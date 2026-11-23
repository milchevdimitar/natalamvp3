const { NATAL_SIGNATURE_SUFFIX } = require('../../../SHARED/natalGeometry');
const { Plan, TIERS, FEATURES, listedPlans, featuresFor } = require('../models/SubscriptionPlan');
const express = require('express');
const mongoose = require('mongoose');
const { createCipheriv, createDecipheriv, createHash, createHmac, createPublicKey, randomBytes, randomInt, scrypt, timingSafeEqual, verify } = require('node:crypto');
const { promisify } = require('node:util');
const fs = require('node:fs/promises');
const path = require('node:path');
const User = require('../models/User');
const Story = require('../models/Story');
const Chat = require('../models/Chat');
const { ProfileSnapshotCache, PairMatchCache } = require('../models/MatchCache');

const router = express.Router();
const route = (method, pathname, ...handlers) => router[method](pathname, ...handlers.map((handler) =>
  (req, res, next) => Promise.resolve().then(() => handler(req, res, next)).catch(next)));
const testLoginEnabled = () => process.env.NODE_ENV !== 'production' && process.env.NATALA_OWNER_TEST_LOGIN === 'true';
const testOwners = () => [process.env.NATALA_ALEX_TEST_EMAIL, process.env.NATALA_DIMITAR_TEST_EMAIL].map(normalizeEmail).filter(validEmail);
const hashPassword = promisify(scrypt);
const hash = (value) => createHash('sha256').update(value).digest('hex');
const Session = mongoose.model('AccountSession', new mongoose.Schema({
  digest: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  expires: { type: Date, required: true, expires: 0 },
}));
const EmailCode = mongoose.model('AccountEmailCode', new mongoose.Schema({
  email: { type: String, unique: true },
  digest: String,
  expires: { type: Date, expires: 0 },
  sentAt: Date,
  attempts: Number,
}));
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';
const owners = () => [process.env.NATALA_ALEX_EMAIL, process.env.NATALA_DIMITAR_EMAIL].map(normalizeEmail).filter(validEmail);

const normalizeTier = (tier) => tier === 'go_deeper_plus' ? 'pro' : TIERS.includes(tier) ? tier : 'free';

function state(user) {
  const subscription = user.subscription;
  const isOwner = (user.verifiedEmail && owners().includes(user.email)) || (testLoginEnabled() && user.ownerTestAccount && testOwners().includes(user.email));
  const active = subscription && ['active', 'trialing', 'canceled'].includes(subscription.status) &&
    (subscription.expiresAt ? subscription.expiresAt.getTime() > Date.now() : subscription.status !== 'canceled');
  const previewTier = isOwner && user.previewTier ? normalizeTier(user.previewTier) : null;
  const tier = isOwner ? previewTier ?? 'owner' : active ? normalizeTier(subscription.tier) : 'free';
  return { subscription: subscription ? { ...subscription.toObject(), tier: normalizeTier(subscription.tier) } : null, isOwner: Boolean(isOwner), tier, previewTier };
}

async function accountDetails(user) {
  const account = state(user);
  if (account.isOwner) {
    const plans = await listedPlans();
    return { ...account, plans, features: account.tier === 'owner' ? FEATURES : plans[account.tier] };
  }
  return { ...account, features: await featuresFor(account.tier) };
}

function requireFeature(feature) {
  return async (req, res, next) => {
    try {
      const features = await featuresFor(state(req.account).tier);
      if (!features.includes(feature)) return res.status(403).json({ error: 'This feature is unavailable on your plan.' });
      next();
    } catch (error) { next(error); }
  };
}

async function requireAccount(req, res, next) {
  try {
    const token = /^Bearer ([a-f0-9]{64})$/.exec(req.get('authorization') || '')?.[1];
    const session = token && await Session.findOne({ digest: hash(token), expires: { $gt: new Date() } });
    const user = session && await User.findById(session.user).select('+verifiedEmail +ownerTestAccount +previewTier');
    if (!user || (user.ownerTestAccount && !testLoginEnabled())) return res.status(401).json({ error: 'Please sign in again.' });
    req.account = user;
    req.accountSession = session;
    next();
  } catch (error) {
    next(error);
  }
}

async function freshProfile(id) {
  const profile = await User.findById(id);
  if (!profile?.birthdate || profile.natalChart?.signature?.endsWith(NATAL_SIGNATURE_SUFFIX)) return profile;
  const { handlers } = require('../calc');
  const { profilePatch } = await handlers.astrology['natal-chart']({ user: profile.toObject() });
  if (!profilePatch) return profile;
  if (!profilePatch.hasExactBirthTime) delete profilePatch.natalChart.ascendant;
  const updated = await User.findOneAndUpdate({ _id: id, updatedAt: profile.updatedAt },
    { $set: profilePatch }, { new: true, runValidators: true });
  return updated || await User.findById(id);
}

async function signIn(user, res) {
  const token = randomBytes(32).toString('hex');
  await Session.create({ digest: hash(token), user: user._id, expires: new Date(Date.now() + 30 * 86400000) });
  const profile = await freshProfile(user._id);
  return res.json({ token, user: profile, ...await accountDetails(user) });
}

const attempts = new Map();
function limitSignIn(req, res, next) {
  const now = Date.now();
  for (const [ip, attempt] of attempts) if (attempt.until <= now) attempts.delete(ip);
  const attempt = attempts.get(req.ip) || { count: 0, until: now + 15 * 60000 };
  attempts.set(req.ip, attempt);
  if (++attempt.count > 25) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  next();
}

const mailReady = () => Boolean(process.env.RESEND_API_KEY && process.env.NATALA_EMAIL_FROM && process.env.NATALA_EMAIL_CODE_KEY?.length >= 32);
const codeDigest = (email, code) => createHmac('sha256', process.env.NATALA_EMAIL_CODE_KEY).update(email + ':' + code).digest('hex');
const reservedEmail = (email) => [...owners(), ...testOwners()].includes(email);

route('post', '/email-code', limitSignIn, async (req, res) => {
  if (!mailReady()) return res.status(503).json({ error: 'Email verification is unavailable. Try a sign-in provider.' });
  const email = normalizeEmail(req.body?.email);
  if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (reservedEmail(email)) return res.sendStatus(204);
  const now = Date.now();
  const code = String(randomInt(10000000, 100000000));
  const digest = codeDigest(email, code);
  try {
    await EmailCode.updateOne({ email, sentAt: { $lte: new Date(now - 60000) } }, {
      $set: { digest, expires: new Date(now + 600000), sentAt: new Date(now), attempts: 0 },
    }, { upsert: true });
  } catch (error) {
    if (error.code === 11000) return res.status(429).json({ error: 'Wait one minute before requesting another code.' });
    throw error;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.NATALA_EMAIL_FROM, to: [email], subject: 'Your Natala verification code', text: `Your Natala code is ${code}. It expires in 10 minutes.` }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Email could not be sent');
    return res.sendStatus(204);
  } catch {
    await EmailCode.deleteOne({ email, digest });
    return res.status(503).json({ error: 'Could not send a verification email. Try again shortly.' });
  }
});

async function consumeCode(email, code) {
  if (!mailReady() || typeof code !== 'string' || !/^\d{8}$/.test(code)) return false;
  const entry = await EmailCode.findOneAndUpdate({ email, expires: { $gt: new Date() }, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { new: true });
  if (!entry || !timingSafeEqual(Buffer.from(entry.digest, 'hex'), Buffer.from(codeDigest(email, code), 'hex'))) return false;
  return Boolean((await EmailCode.deleteOne({ _id: entry.id, digest: entry.digest })).deletedCount);
}

route('post', '/email', limitSignIn, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const { password, name, register, recover, code } = req.body || {};
  if (!validEmail(email) || typeof password !== 'string' || password.length < 10 || password.length > 128) {
    return res.status(400).json({ error: 'Enter a valid email and a password of 10 to 128 characters.' });
  }
  const existing = await User.findOne({ email }).select('+passwordHash +verifiedEmail +ownerTestAccount +previewTier +appleSubject +googleSubject');
  if (register === true || recover === true) {
    if (reservedEmail(email)) return res.status(409).json({ error: 'Use the sign-in method associated with this account.' });
    if (recover === true && (!existing || existing.appleSubject || existing.googleSubject || existing.ownerTestAccount)) {
      return res.status(409).json({ error: 'Could not reset the password. Try the sign-in method associated with this account.' });
    }
    if (!recover && (typeof name !== 'string' || !name.trim() || name.length > 80 || existing)) {
      return res.status(409).json({ error: 'Could not register. If you already have a Natala profile, choose Set or reset password.' });
    }
    const needsCode = recover === true || mailReady() || process.env.NODE_ENV === 'production';
    if (needsCode && !await consumeCode(email, code)) return res.status(400).json({ error: 'Enter the verification code sent to your email.' });
    const salt = randomBytes(16).toString('hex');
    const passwordHash = salt + ':' + (await hashPassword(password, salt, 64)).toString('hex');
    try {
      if (recover === true) {
        const updated = await User.findOneAndUpdate(
          { _id: existing.id, appleSubject: null, googleSubject: null, ownerTestAccount: { $ne: true }, passwordHash: existing.passwordHash ?? null },
          { passwordHash, verifiedEmail: true }, { new: true },
        ).select('+verifiedEmail +previewTier');
        if (!updated) return res.status(409).json({ error: 'Account changed. Request a fresh code.' });
        await Session.deleteMany({ user: updated.id });
        return await signIn(updated, res);
      }
      return await signIn(await User.create({ email, name: name.trim(), passwordHash, verifiedEmail: needsCode }), res);
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ error: 'This email already has a profile.' });
      throw error;
    }
  }
  const [salt, expected] = existing?.passwordHash?.split(':') || ['00000000000000000000000000000000', '0'.repeat(128)];
  const actual = await hashPassword(password, salt, 64);
  if (!timingSafeEqual(actual, Buffer.from(expected, 'hex')) || !existing?.passwordHash) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  return signIn(existing, res);
});

route('get', '/methods', (req, res) => res.json({ emailVerification: mailReady() || process.env.NODE_ENV === 'production' }));

const providers = {
  apple: { issuer: 'https://appleid.apple.com', jwks: 'https://appleid.apple.com/auth/keys', audience: () => process.env.APPLE_CLIENT_ID },
  google: { issuer: 'https://accounts.google.com', jwks: 'https://www.googleapis.com/oauth2/v3/certs', audience: () => process.env.GOOGLE_WEB_CLIENT_ID },
};
const keys = new Map();
async function verifyIdentity(provider, token, nonce, requireAppleNonce = true) {
  const config = Object.hasOwn(providers, provider) && providers[provider];
  if (!config?.audience() || typeof token !== 'string' || token.length > 12000) throw new Error('Identity provider unavailable');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const [header, claims] = parts.slice(0, 2).map((part) => JSON.parse(Buffer.from(part, 'base64url')));
  const now = Date.now();
  if (header.alg !== 'RS256' || claims.iss !== config.issuer || claims.aud !== config.audience() ||
      !Number.isFinite(claims.exp) || claims.exp * 1000 <= now || typeof claims.sub !== 'string' ||
      (provider === 'apple' && requireAppleNonce && (typeof nonce !== 'string' || !/^[a-f0-9]{64}$/.test(nonce) || claims.nonce !== hash(nonce)))) throw new Error('Invalid claims');
  let cached = keys.get(provider);
  if (!cached || cached.until <= now || !cached.keys.some((key) => key.kid === header.kid)) {
    const response = await fetch(config.jwks, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Identity keys unavailable');
    cached = { keys: (await response.json()).keys, until: now + 3600000 };
    keys.set(provider, cached);
  }
  const jwk = cached.keys.find((key) => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk || !verify('RSA-SHA256', Buffer.from(parts.slice(0, 2).join('.')), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(parts[2], 'base64url'))) {
    throw new Error('Invalid signature');
  }
  return claims;
}

const appleKey = () => Buffer.from(process.env.APPLE_TOKEN_ENCRYPTION_KEY || '', 'hex');
async function appleRequest(action, data) {
  const clientId = process.env.APPLE_CLIENT_ID;
  const clientSecret = process.env.APPLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || appleKey().length !== 32) throw new Error('Apple token exchange is unavailable');
  const response = await fetch(`https://appleid.apple.com/auth/${action}`, {
    method: 'POST',
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...data }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Apple token request failed');
  if (action === 'token') return response.json();
}

async function exchangeAppleCode(code, subject) {
  if (typeof code !== 'string' || !code || code.length > 4096) throw new Error('Missing Apple authorization code');
  const result = await appleRequest('token', { grant_type: 'authorization_code', code });
  const claims = await verifyIdentity('apple', result.id_token, undefined, false);
  if (claims.sub !== subject || !result.refresh_token) throw new Error('Invalid Apple token exchange');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', appleKey(), iv);
  const token = Buffer.concat([cipher.update(result.refresh_token, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), token].map((item) => item.toString('base64url')).join('.');
}

async function revokeAppleToken(encrypted) {
  const [iv, tag, token] = encrypted.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', appleKey(), iv);
  decipher.setAuthTag(tag);
  const value = Buffer.concat([decipher.update(token), decipher.final()]).toString('utf8');
  await appleRequest('revoke', { token: value, token_type_hint: 'refresh_token' });
}

route('post', '/provider', limitSignIn, async (req, res) => {
  const { provider, token, nonce, name, authorizationCode } = req.body || {};
  let claims;
  let providerCredentials = {};
  try {
    claims = await verifyIdentity(provider, token, nonce);
    if (provider === 'apple') providerCredentials = { appleRefreshToken: await exchangeAppleCode(authorizationCode, claims.sub) };
  } catch {
    return res.status(401).json({ error: 'Could not verify this sign-in. Check provider setup and try again.' });
  }
  const field = provider === 'apple' ? 'appleSubject' : 'googleSubject';
  let user = await User.findOne({ [field]: claims.sub }).select('+verifiedEmail +previewTier');
  if (user && provider === 'apple') {
    user.appleRefreshToken = providerCredentials.appleRefreshToken;
    await user.save();
  }
  if (!user) {
    const email = normalizeEmail(claims.email);
    if (!validEmail(email) || ![true, 'true'].includes(claims.email_verified)) return res.status(401).json({ error: 'A verified email is required.' });
    const trustedEmail = provider === 'apple' || email.endsWith('@gmail.com') || Boolean(claims.hd);
    const existing = await User.findOne({ email }).select('+passwordHash +googleSubject +appleSubject +ownerTestAccount');
    if (existing && (!trustedEmail || existing.passwordHash || existing[field] || existing.ownerTestAccount)) {
      return res.status(409).json({ error: 'This email already uses a different sign-in method.' });
    }
    try {
      if (existing) {
        user = await User.findOneAndUpdate({ _id: existing.id, [field]: null, passwordHash: null, ownerTestAccount: { $ne: true } }, { ...providerCredentials, [field]: claims.sub, verifiedEmail: true }, { new: true }).select('+verifiedEmail +previewTier');
        if (!user) return res.status(409).json({ error: 'Could not link this identity. Try signing in again.' });
      } else {
        const displayName = typeof name === 'string' && name.trim() ? name.trim().slice(0, 80) : email.split('@')[0];
        if (owners().includes(email) && !trustedEmail) return res.status(401).json({ error: 'A verified owner identity is required.' });
        user = await User.create({ ...providerCredentials, email, name: displayName, [field]: claims.sub, verifiedEmail: trustedEmail });
      }
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ error: 'Account already exists. Try signing in again.' });
      throw error;
    }
  }
  return signIn(user, res);
});

route('post', '/owner-test', limitSignIn, async (req, res) => {
  if (!testLoginEnabled()) return res.sendStatus(404);
  const { username, pairingCode } = req.body || {};
  const email = normalizeEmail(username === 'alex' ? process.env.NATALA_ALEX_TEST_EMAIL : username === 'dimitar' ? process.env.NATALA_DIMITAR_TEST_EMAIL : '');
  const expected = process.env.NATALA_OWNER_PAIRING_CODE;
  const loopback = process.env.NATALA_OWNER_LOOPBACK === 'true' && !req.get('forwarded') && !req.get('x-forwarded-for') &&
    ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  if (!validEmail(email) || owners().includes(email) || (!loopback && !(expected?.length >= 24 && typeof pairingCode === 'string' &&
      timingSafeEqual(Buffer.from(hash(expected), 'hex'), Buffer.from(hash(pairingCode), 'hex'))))) return res.sendStatus(403);
  const user = await User.findOneAndUpdate({ email, ownerTestAccount: true }, { $setOnInsert: { email, name: username, ownerTestAccount: true } },
    { upsert: true, new: true }).select('+ownerTestAccount +previewTier').catch((error) => {
    if (error.code !== 11000) throw error;
    return null;
  });
  if (!user) return res.sendStatus(409);
  return signIn(user, res);
});

route('get', '/tab-activity', requireAccount, async (req, res) => {
  const { email, friends, receivedRequests } = req.account;
  const conversations = await Chat.aggregate([
    { $match: { participants: email } },
    { $project: { incoming: { $arrayElemAt: [{ $filter: {
      input: '$messages', as: 'message', cond: { $ne: ['$$message.senderEmail', email] },
    } }, -1] } } },
  ]);
  res.json({
    chat: conversations.flatMap(({ incoming }) => incoming?._id ? [String(incoming._id)] : []),
    people: [
      ...(receivedRequests || []).map((id) => 'request:' + id),
      ...(friends || []).map((id) => 'friend:' + id),
    ],
  });
});

route('get', '/me', requireAccount, async (req, res) => res.json({ user: await freshProfile(req.account.id), ...await accountDetails(req.account) }));
route('post', '/logout', requireAccount, async (req, res) => {
  await req.accountSession.deleteOne();
  res.sendStatus(204);
});
route('put', '/preview-tier', requireAccount, async (req, res) => {
  if (!state(req.account).isOwner) return res.sendStatus(403);
  const tier = req.body?.tier;
  if (![null, ...TIERS].includes(tier)) return res.sendStatus(400);
  req.account.previewTier = tier;
  await req.account.save();
  res.json(await accountDetails(req.account));
});
route('put', '/plans/:tier', requireAccount, async (req, res) => {
  if (!state(req.account).isOwner) return res.sendStatus(403);
  const { tier } = req.params;
  const features = req.body?.features;
  if (!TIERS.includes(tier) || !Array.isArray(features) || features.length > FEATURES.length ||
      features.some((feature) => !FEATURES.includes(feature))) {
    return res.status(400).json({ error: 'Select a valid plan and available features.' });
  }
  await Plan.updateOne({ _id: tier }, { $set: { features: FEATURES.filter((feature) => features.includes(feature)) } }, { upsert: true });
  res.json(await accountDetails(req.account));
});

route('post', '/unsubscribe', requireAccount, async (req, res) => {
  if (['ios', 'android'].includes(req.account.subscription?.platform)) {
    return res.status(409).json({ error: 'Manage renewal in the store that billed your subscription.' });
  }
  req.account.subscription.tier = 'free';
  req.account.subscription.status = 'canceled';
  await req.account.save();
  res.json(await accountDetails(req.account));
});

async function removeUpload(url, directory, pattern) {
  const filename = typeof url === 'string' ? url.split('/').pop() : '';
  if (!pattern.test(filename)) return;
  await fs.unlink(path.join(__dirname, '..', 'uploads', directory, filename)).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
}

route('delete', '/me', requireAccount, async (req, res) => {
  const user = req.account;
  const credentials = await User.findById(user.id).select('+appleRefreshToken');
  const ids = [user.id, user.email];
  const stories = await Story.find({ userId: { $in: ids } }).select('imageUrl').lean();
  for (const story of stories) await removeUpload(story.imageUrl, '', /^story_\d+\.png$/);
  await removeUpload(user.avatarUrl, 'profilepic', /^[a-f0-9-]{36}\.(jpg|png)$/);
  await Promise.all([
    Story.deleteMany({ userId: { $in: ids } }),
    Story.updateMany({ likes: { $in: ids } }, { $pull: { likes: { $in: ids } } }),
    Chat.deleteMany({ participants: user.email }),
    User.updateMany({}, { $pull: Object.fromEntries(
      ['friends', 'sentRequests', 'receivedRequests', 'skippedUsers', 'blockedUsers', 'reportedUsers'].map((field) => [field, user._id])
    ) }),
    ProfileSnapshotCache.deleteMany({ userId: { $in: ids } }),
    PairMatchCache.deleteMany({ pairId: new RegExp(`(^|::)${user.id}(::|$)`) }),
    EmailCode.deleteMany({ email: user.email }),
  ]);
  await user.deleteOne();
  await Session.deleteMany({ user: user._id });
  if (credentials?.appleRefreshToken) {
    await revokeAppleToken(credentials.appleRefreshToken).catch(() => {
      console.warn('Unable to revoke Sign in with Apple for a deleted account.');
    });
  }
  res.sendStatus(204);
});

module.exports = { router, requireAccount, requireFeature };
