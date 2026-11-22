const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Story = require('../models/Story');

// GET /api/stories/active - Взимане на сторита (< 24 часа)
router.get('/active', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeStories = await Story.find({ 
      createdAt: { $gte: twentyFourHoursAgo } 
    }).sort({ createdAt: -1 });

    res.json(activeStories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stories/upload-base64 - Безопасно качване чрез Base64 (без FormData)
router.post('/upload-base64', async (req, res) => {
  try {
    const { imageBase64, userId, authorName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Липсват base64 данни за снимката.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const filename = `story_${Date.now()}.png`;
    const filepath = path.join(__dirname, '../uploads', filename);

    fs.writeFileSync(filepath, buffer);

    const serverUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${serverUrl}/uploads/${filename}`;

    const newStory = new Story({
      userId: userId ? String(userId).toLowerCase().trim() : 'guest',
      authorName: authorName || 'Stargazer',
      imageUrl: imageUrl,
      likes: [],
    });

    await newStory.save();
    res.status(201).json(newStory);
  } catch (err) {
    console.error('Грешка при запис на Base64 снимка:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stories/:id/like - Харесване / Отхаресване на стори
router.post('/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId е задължителен.' });
    }

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Сторито не е намерено.' });
    }

    if (!Array.isArray(story.likes)) {
      story.likes = [];
    }

    const normalizedUserId = String(userId).toLowerCase().trim();
    const existingIndex = story.likes.findIndex(
      (id) => String(id).toLowerCase().trim() === normalizedUserId
    );

    if (existingIndex > -1) {
      // Ако вече е харесано -> премахваме лайка
      story.likes.splice(existingIndex, 1);
    } else {
      // Ако не е харесано -> добавяме потребителя
      story.likes.push(normalizedUserId);
    }

    await story.save();

    res.json({
      success: true,
      likes: story.likes,
      likesCount: story.likes.length,
    });
  } catch (err) {
    console.error('Грешка при харесване на стори:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/stories/:id
router.delete('/:id', async (req, res) => {
  try {
    await Story.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Сторито е изтрито.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;