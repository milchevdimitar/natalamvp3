const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');

const User = require('./models/User');
const storiesRoutes = require('./routes/stories');
const chatRoutes = require('./routes/chatRoutes');
const horizonsRoutes = require('./routes/horizons');
const peopleRoutes = require('./routes/people');

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

// Запис и синхронизация на изчисления профил
app.post('/api/users/profile', async (req, res) => {
  try {
    const userData = req.body;
    if (!userData.email) {
      return res.status(400).json({ success: false, error: 'Липсва имейл.' });
    }

    const normalizedEmail = userData.email.toLowerCase().trim();
    const updatedUser = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { ...userData, email: normalizedEmail, lastActiveAt: new Date() } },
      { new: true, upsert: true, runValidators: true }
    );

    console.log(`📥 [MongoDB API] Обновен профил за: ${updatedUser.email}`);
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('❌ [MongoDB API Грешка]:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users/profile/:email', async (req, res) => {
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

// Логин / Бърза регистрация само с имейл
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: 'Имейлът е задължителен.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Търсим съществуващ потребител
    let user = await User.findOne({ email: normalizedEmail });

    // Ако не съществува, създаваме стартов профил
    if (!user) {
      user = new User({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        birthdate: new Date(),
        birthCity: { name: 'София', country: 'България' },
        lastActiveAt: new Date(),
      });
      await user.save();
      console.log(`✨ Създаден нов потребител в MongoDB: ${user.email}`);
    } else {
      user.lastActiveAt = new Date();
      await user.save();
      console.log(`🔑 Успешен логин за: ${user.email}`);
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('❌ Грешка при логин:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const reportRoutes = require('./routes/report');
app.use(reportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Natala API сървърът работи на порт ${PORT}`);
});