const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User'); // Вашият съществуващ модел за потребители

// 1. Извличане на всички чатове за даден потребител
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userEmail = email.toLowerCase().trim();
    const chats = await Chat.find({ participants: userEmail }).sort({ updatedAt: -1 });

    // Форматиране за фронтенда
    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        const partnerEmail = chat.participants.find((p) => p !== userEmail) || userEmail;
        const partnerUser = await User.findOne({ email: partnerEmail });
        const partnerName = partnerUser?.name || partnerEmail.split('@')[0];

        return {
          id: chat._id.toString(),
          partnerEmail,
          partnerName,
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.lastMessageTime,
          messages: chat.messages.map((m) => ({
            id: m._id.toString(),
            senderEmail: m.senderEmail,
            text: m.text,
            timestamp: m.timestamp,
          })),
        };
      })
    );

    res.json(formattedChats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Старт или намиране на съществуващ чат по имейл
router.post('/start', async (req, res) => {
  try {
    const { userEmail, partnerEmail } = req.body;

    const uEmail = userEmail.toLowerCase().trim();
    const pEmail = partnerEmail.toLowerCase().trim();

    // Проверка дали партньорът съществува в базата данни
    const partnerUser = await User.findOne({ email: pEmail });
    if (!partnerUser) {
      return res.status(444).json({ message: 'Потребителят с този имейл не съществува.' });
    }

    // Търсене на съществуващ чат между двамата
    let chat = await Chat.findOne({
      participants: { $all: [uEmail, pEmail] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [uEmail, pEmail],
        lastMessage: 'Нов разговор',
        lastMessageTime: 'Сега',
        messages: [],
      });
      await chat.save();
    }

    res.json({
      id: chat._id.toString(),
      partnerEmail: pEmail,
      partnerName: partnerUser.name || pEmail.split('@')[0],
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageTime,
      messages: chat.messages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Изпращане на съобщение
router.post('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderEmail, text } = req.body;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(444).json({ message: 'Чаталнята не е намерена' });

    const newMsg = {
      senderEmail: senderEmail.toLowerCase().trim(),
      text,
      timestamp: timeStr,
    };

    chat.messages.push(newMsg);
    chat.lastMessage = text;
    chat.lastMessageTime = timeStr;
    await chat.save();

    res.json({ success: true, message: newMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Вземане на съобщения за конкретен чат (за Polling)
router.get('/:chatId/messages', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(444).json({ message: 'Чаталнята не е намерена' });

    const formattedMessages = chat.messages.map((m) => ({
      id: m._id.toString(),
      senderEmail: m.senderEmail,
      text: m.text,
      timestamp: m.timestamp,
    }));

    res.json(formattedMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;