const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');

// 1. Извличане на всички чатове за даден потребител
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userEmail = email.toLowerCase().trim();
    const chats = await Chat.find({ participants: userEmail }).sort({ updatedAt: -1 });

    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        const partnerEmail = chat.participants.find((p) => p !== userEmail) || userEmail;
        const partnerUser = await User.findOne({ email: partnerEmail });
        const partnerName = partnerUser?.name || partnerEmail.split('@')[0];

        return {
          id: chat._id.toString(),
          partnerEmail,
          partnerName,
          partnerId: partnerUser?._id.toString(),
          partnerAvatar: partnerUser?.avatarUrl || partnerUser?.photoUrl,
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.lastMessageTime,
          messages: chat.messages.map((m) => ({
            id: m._id.toString(),
            senderEmail: m.senderEmail,
            text: m.text,
            type: m.type || 'text',
            storyData: m.storyData || null,
            replyTo: m.replyTo || null,
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

    const partnerUser = await User.findOne({ email: pEmail });
    if (!partnerUser) {
      return res.status(404).json({ message: 'Потребителят с този имейл не съществува.' });
    }

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
      partnerId: partnerUser._id.toString(),
      partnerAvatar: partnerUser.avatarUrl || partnerUser.photoUrl,
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageTime,
      messages: chat.messages.map((m) => ({
        id: m._id.toString(),
        senderEmail: m.senderEmail,
        text: m.text,
        type: m.type || 'text',
        storyData: m.storyData || null,
        replyTo: m.replyTo || null,
        timestamp: m.timestamp,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Изпращане на съобщение (с поддръжка за story_reply, story_share и replyTo)
router.post('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderEmail, text, type, storyData, replyTo } = req.body;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Чаталнята не е намерена' });

    const msgType = type || 'text';
    const msgText = text || (msgType === 'story_reply' ? '💬 Отговор на стори' : msgType === 'story_share' ? '📷 Споделено стори' : '');

    const newMsg = {
      senderEmail: senderEmail.toLowerCase().trim(),
      text: msgText,
      type: msgType,
      storyData: storyData || null,
      replyTo: replyTo || null,
      timestamp: timeStr,
    };

    chat.messages.push(newMsg);
    chat.lastMessage = msgText;
    chat.lastMessageTime = timeStr;
    await chat.save();

    const savedMsg = chat.messages[chat.messages.length - 1];

    res.json({
      success: true,
      message: {
        id: savedMsg._id.toString(),
        senderEmail: savedMsg.senderEmail,
        text: savedMsg.text,
        type: savedMsg.type,
        storyData: savedMsg.storyData,
        replyTo: savedMsg.replyTo,
        timestamp: savedMsg.timestamp,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Вземане на съобщения за конкретен чат (за Polling / Real-time updates)
router.get('/:chatId/messages', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Чаталнята не е намерена' });

    const formattedMessages = chat.messages.map((m) => ({
      id: m._id.toString(),
      senderEmail: m.senderEmail,
      text: m.text,
      type: m.type || 'text',
      storyData: m.storyData || null,
      replyTo: m.replyTo || null,
      timestamp: m.timestamp,
    }));

    res.json(formattedMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
