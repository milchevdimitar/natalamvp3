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

    // Премахване на префикса (ако има такъв)
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const filename = `story_${Date.now()}.png`;
    const filepath = path.join(__dirname, '../uploads', filename);

    // Запис на файла на диска
    fs.writeFileSync(filepath, buffer);

    const serverUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${serverUrl}/uploads/${filename}`;

    const newStory = new Story({
      userId: userId || 'guest',
      authorName: authorName || 'Stargazer',
      imageUrl: imageUrl,
    });

    await newStory.save();
    res.status(201).json(newStory);
  } catch (err) {
    console.error('Грешка при запис на Base64 снимка:', err);
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