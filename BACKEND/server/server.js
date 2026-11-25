const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const { randomUUID } = require('node:crypto');

const User = require('./models/User');
const storiesRoutes = require('./routes/stories');
const chatRoutes = require('./routes/chatRoutes');
const horizonsRoutes = require('./routes/horizons');
const peopleRoutes = require('./routes/people');
const calcRoutes = require('./routes/calc');

const app = express();
app.use(cors());

// Увеличаване на лимита за заявките, за да се поддържа качването на Base64 снимки
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Автоматично създаване на папката uploads, ако не съществува
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Статичен достъп до качените снимки (сторита)
app.use('/uploads', express.static(uploadsDir));

const MONGO_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGO_URI)
  .then(() =>
    console.log(`✅ Успешна връзка с MongoDB Atlas! [DB: ${mongoose.connection.name}]`)
  )
  .catch((err) => console.error('❌ Грешка при свързване с MongoDB:', err.message));

// Healthcheck Ендпойнт
app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    dbConnected: state === 1,
    status: states[state] || 'unknown',
    databaseName: mongoose.connection.name || null,
  });
});

// Рутове за сторита (Stories API)
app.use('/api/stories', storiesRoutes);

// Рутове за чатове (Chat API)
app.use('/api/chats', chatRoutes);

// Рутове за NASA JPL Horizons API (Horizons Proxy)
app.use('/api/horizons', horizonsRoutes);

// Рутове за приятели, покани и съвместимост (People API)
app.use('/api/people', peopleRoutes);
app.use('/api/calc', calcRoutes);

// Запис и синхронизация на изчисления профил
const { router: accountRoutes, requireAccount, requireFeature } = require('./routes/account');
app.use('/api/account', accountRoutes);
app.use('/api', require('./routes/today'));
app.use('/api/mirrors', require('./routes/mirrors'));
app.use('/api/constellations', require('./routes/constellations'));
app.use('/api/atlas', require('./routes/atlas'));
app.use('/api/me/showcase', require('./routes/showcase'));
const { searchVideos, searchCities } = require('./routes/discovery');
app.get('/api/feed/videos', requireAccount, searchVideos);
app.get('/api/locations/search', searchCities);
app.put('/api/users/profile/birth', requireAccount, require('./routes/birthProfile'));

app.post('/api/users/profile', requireAccount, async (req, res) => {
  let newPhoto;
  try {
    const userData = req.body || {};
    if (!userData.email) {
      return res.status(400).json({ success: false, error: 'Липсва имейл.' });
    }

    const normalizedEmail = req.account.email;
    if (typeof userData.email !== 'string' || userData.email.toLowerCase().trim() !== normalizedEmail) {
      return res.sendStatus(403);
    }
    const photoPattern = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/;
    const storedPhotoPattern = /^\/uploads\/profilepic\/[a-f\d-]{36}\.(?:jpg|png)$/;
    const avatar = userData.avatarUrl;
    const image = typeof avatar === 'string' && avatar.length <= 640000 ? avatar.match(photoPattern) : null;
    const validImage = image && (image[1] === 'jpeg' ? image[2].startsWith('/9j/') : image[2].startsWith('iVBORw0KGgo'));
    const echoedPath = typeof avatar === 'string' && storedPhotoPattern.test(avatar);
    if (avatar !== undefined && avatar !== '' && !echoedPath && !validImage) {
      return res.status(400).json({ success: false, error: 'Expected a JPEG or PNG profile photo under 480 KB.' });
    }

    // Премахваме системните/непроменяеми полета на MongoDB преди $set
    const protectedFields = new Set(['_id', 'id', '__v', 'email', 'createdAt', 'updatedAt', 'subscription',
      'passwordHash', 'verifiedEmail', 'owner', 'termsAcceptedAt', 'termsVersion', 'googleSubject', 'appleSubject', 'ownerTestAccount', 'previewTier', 'appleRefreshToken', 'dating', 'blockedUsers', 'reportedUsers', 'showcase', 'isDiscoverable']);
    const safeUpdateFields = Object.fromEntries(Object.entries(userData)
      .filter(([key]) => !key.startsWith('$') && !key.includes('.') && !protectedFields.has(key)));
    // Full profile saves can echo the current avatar path. Only a fresh upload or deletion can replace it.
    if (echoedPath) delete safeUpdateFields.avatarUrl;
    let previousPhoto;
    if (validImage || avatar === '') {
      const previous = await User.findOne({ email: normalizedEmail }).select('avatarUrl').lean();
      previousPhoto = previous?.avatarUrl;
    }
    if (validImage) {
      const directory = path.join(uploadsDir, 'profilepic');
      await fs.promises.mkdir(directory, { recursive: true });
      const filename = randomUUID() + (image[1] === 'png' ? '.png' : '.jpg');
      newPhoto = path.join(directory, filename);
      await fs.promises.writeFile(newPhoto, Buffer.from(image[2], 'base64'), { flag: 'wx' });
      safeUpdateFields.avatarUrl = '/uploads/profilepic/' + filename;
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.account._id },
      { $set: { ...safeUpdateFields, email: normalizedEmail, lastActiveAt: new Date() } },
      { new: true, runValidators: true }
    );
    newPhoto = undefined;
    if (previousPhoto && storedPhotoPattern.test(previousPhoto)) {
      await fs.promises.unlink(path.join(uploadsDir, 'profilepic', path.basename(previousPhoto))).catch(() => {});
    }

    console.log(`📥 [MongoDB API] Обновен профил за: ${updatedUser.email}`);
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    if (newPhoto) await fs.promises.unlink(newPhoto).catch(() => {});
    console.error('❌ [MongoDB API Грешка]:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users/profile/:email', requireAccount, async (req, res) => {
  if (req.params.email.toLowerCase().trim() !== req.account.email) return res.sendStatus(403);
  try {
    const user = await User.findOne({
      email: req.params.email.toLowerCase().trim(),
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Потребителят не е намерен.' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Логин / Бърза регистрация
const aiAstrologyRoutes = require('./routes/aiAstrology');
app.use('/api/ai/astrology', aiAstrologyRoutes);

const reportRoutes = require('./routes/report');
app.use(['/api/users/:id/report/pdf', '/api/users/:id/report/reading'], requireAccount, (req, res, next) => {
  if (req.params.id !== req.account.id) return res.sendStatus(403);
  next();
}, requireFeature('pdf-report'));
app.use(reportRoutes);
app.use((error, req, res, next) => {
  console.error('API request failed:', error.name);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Something went wrong. Try again.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Natala API сървърът работи на порт ${PORT}`);
});
