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
const DatingPair = require('../models/DatingPair');
const { ProfileSnapshotCache, PairMatchCache } = require('../models/MatchCache');

const router = express.Router();
const route = (method, pathname, ...handlers) => router[method](pathname, ...handlers.map((handler) =>
  (req, res, next) => Promise.resolve().then(() => handler(req, res, next)).catch(next)));
const testLoginEnabled = () => process.env.NODE_ENV !== 'production' && process.env.NATALA_OWNER_TEST_LOGIN === 'true';
const testOwners = () => [process.env.NATALA_ALEX_TEST_EMAIL, process.env.NATALA_DIMITAR_TEST_EMAIL].map(normalizeEmail).filter(validEmail);
const hashPassword = promisify(scrypt);
const hash = (value) => createHash('sha256').update(value).digest('hex');
const DAY_MS = 86400000;
const SESSION_LIFETIME = 30 * DAY_MS;
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
  const isOwner = user.owner === true || (user.verifiedEmail && owners().includes(user.email)) || (testLoginEnabled() && user.ownerTestAccount && testOwners().includes(user.email));
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
    const user = session && await User.findById(session.user).select('+verifiedEmail +owner +ownerTestAccount +previewTier');
    if (!user || (user.ownerTestAccount && !testLoginEnabled())) return res.status(401).json({ error: 'Please sign in again.' });
    if (session.expires.getTime() < Date.now() + SESSION_LIFETIME - DAY_MS) {
      await Session.updateOne({ _id: session.id }, { $max: { expires: new Date(Date.now() + SESSION_LIFETIME) } });
    }
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
  await Session.create({ digest: hash(token), user: user._id, expires: new Date(Date.now() + SESSION_LIFETIME) });
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

const TERMS_VERSION = '2026-11-24';

function registrationProfile(body) {
  const { name, gender, birth, termsVersion } = body;
  if (typeof name !== 'string' || !name.trim() || name.length > 80) throw new Error('Enter your full name.');
  if (!['male', 'female', 'other'].includes(gender)) throw new Error('Select a gender.');
  if (termsVersion !== TERMS_VERSION) throw new Error('Read and accept the current Terms of Use.');
  const { year, month, day, city, time = '' } = birth || {};
  if (typeof time !== 'string' || (time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))) {
    throw new Error('Choose a valid birth time.');
  }
  if (![year, month, day].every(Number.isInteger) || year < 1900 || year > new Date().getFullYear()) {
    throw new Error('Choose a valid birth date.');
  }
  const birthdate = new Date(Date.UTC(year, month - 1, day, 12));
  if (birthdate.getUTCFullYear() !== year || birthdate.getUTCMonth() + 1 !== month ||
      birthdate.getUTCDate() !== day || Date.UTC(year, month - 1, day) > Date.now()) {
    throw new Error('Choose a valid birth date.');
  }
  if (typeof city?.name !== 'string' || !city.name.trim() || city.name.length > 200 ||
      !Number.isFinite(city.lat) || Math.abs(city.lat) > 90 || !Number.isFinite(city.lng) || Math.abs(city.lng) > 180 ||
      typeof city.timezone !== 'string' || !city.timezone || city.timezone.length > 100) {
    throw new Error('Choose a birth city from the search results.');
  }
  try { new Intl.DateTimeFormat('en', { timeZone: city.timezone }); }
  catch { throw new Error('Choose a birth city with a valid time zone.'); }
  return { name: name.trim(), gender, birthdate, birthTime: time || undefined, hasExactBirthTime: Boolean(time),
    birthCity: { name: city.name.trim(), country: typeof city.country === 'string' ? city.country.slice(0, 100) : '',
      latitude: city.lat, longitude: city.lng, timezone: city.timezone },
    termsVersion, termsAcceptedAt: new Date() };
}

route('post', '/email', limitSignIn, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const { password, register, recover, code } = req.body || {};
  if (!validEmail(email) || typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Enter a valid email and a password of 8 to 128 characters.' });
  }
  const existing = await User.findOne({ email }).select('+passwordHash +verifiedEmail +owner +ownerTestAccount +previewTier +appleSubject +googleSubject');
  if (register === true || recover === true) {
    if (reservedEmail(email)) return res.status(409).json({ error: 'Use the sign-in method associated with this account.' });
    if (recover === true && (!existing || existing.appleSubject || existing.googleSubject || existing.ownerTestAccount)) {
      return res.status(409).json({ error: 'Could not reset the password. Try the sign-in method associated with this account.' });
    }
    let profile;
    if (!recover) {
      if (existing) return res.status(409).json({ error: 'This email already has a profile.' });
      try { profile = registrationProfile(req.body); }
      catch (error) { return res.status(400).json({ error: error.message }); }
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
        ).select('+verifiedEmail +owner +previewTier');
        if (!updated) return res.status(409).json({ error: 'Account changed. Request a fresh code.' });
        await Session.deleteMany({ user: updated.id });
        return await signIn(updated, res);
      }
      return await signIn(await User.create({ ...profile, email, passwordHash, verifiedEmail: needsCode }), res);
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

route('get', '/methods', (req, res) => res.json({ emailVerification: mailReady() || process.env.NODE_ENV === 'production', termsVersion: TERMS_VERSION }));

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
  let user = await User.findOne({ [field]: claims.sub }).select('+verifiedEmail +owner +previewTier');
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
        user = await User.findOneAndUpdate({ _id: existing.id, [field]: null, passwordHash: null, ownerTestAccount: { $ne: true } }, { ...providerCredentials, [field]: claims.sub, verifiedEmail: true }, { new: true }).select('+verifiedEmail +owner +previewTier');
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
  const { email, friends, receivedRequests, blockedUsers } = req.account;
  const socialIds = [...(receivedRequests || []), ...(friends || [])];
  const [conversations, pairs] = await Promise.all([
    Chat.aggregate([
      { $match: { participants: email } },
      { $project: { participants: 1, datingPair: 1, incoming: { $slice: [{ $filter: {
        input: '$messages', as: 'message', cond: { $ne: ['$$message.senderEmail', email] },
      } }, -12] } } },
    ]),
    DatingPair.find({ members: req.account.id, closed: { $ne: true }, firstAction: 'like', secondAction: 'like' })
      .select('members updatedAt').lean(),
  ]);
  const matchIds = pairs.map((pair) => pair.members.find((id) => id !== req.account.id));
  const partnerEmails = conversations.flatMap(({ participants }) => participants.filter((value) => value !== email));
  const people = await User.find({
    $or: [{ _id: { $in: [...socialIds, ...matchIds] } }, { email: { $in: partnerEmails } }],
    isActive: { $ne: false }, blockedUsers: { $ne: req.account._id },
    _id: { $nin: blockedUsers || [] },
  }).select('name email').lean();
  const byEmail = new Map(people.map((person) => [person.email, person]));
  const byId = new Map(people.map((person) => [String(person._id), person]));
  const activePairs = new Set(pairs.map(({ _id }) => String(_id)));
  const chat = [];
  const notifications = [];
  for (const conversation of conversations) {
    const partnerEmail = conversation.participants.find((value) => value !== email);
    const partner = partnerEmail ? byEmail.get(partnerEmail) : req.account;
    if (!partner || (conversation.datingPair && !activePairs.has(conversation.datingPair))) continue;
    const latest = conversation.incoming.at(-1);
    if (latest?._id) chat.push(String(latest._id));
    for (const message of conversation.incoming) {
      if (!message._id) continue;
      notifications.push({
        id: String(message._id), kind: 'chat', title: partner.name || 'New message',
        body: typeof message.text === 'string' && message.text ? message.text.slice(0, 140) : 'Sent you a message.',
        chatId: String(conversation._id), date: message._id.getTimestamp(),
      });
    }
  }
  const social = [];
  for (const [kind, ids] of [['request', receivedRequests], ['friend', friends]]) {
    for (const value of ids || []) {
      const person = byId.get(String(value));
      if (!person) continue;
      const id = kind + ':' + value;
      social.push(id);
      notifications.push({
        id, kind, title: kind === 'request' ? 'Connection request' : 'New connection',
        body: kind === 'request' ? person.name + ' wants to connect.' : 'You’re connected with ' + person.name + '.',
      });
    }
  }
  for (const pair of pairs) {
    const person = byId.get(pair.members.find((id) => id !== req.account.id));
    if (person) notifications.push({ id: 'match:' + pair._id, kind: 'match', title: 'It’s a match', body: 'You and ' + person.name + ' liked each other.', date: pair.updatedAt });
  }
  const dated = notifications.filter(({ date }) => date).sort((a, b) => b.date - a.date);
  res.json({ chat, people: social, notifications: [...notifications.filter(({ kind }) => kind === 'request'), ...dated, ...notifications.filter(({ kind }) => kind === 'friend')].slice(0, 80) });
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
    DatingPair.deleteMany({ members: user.id }),
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
