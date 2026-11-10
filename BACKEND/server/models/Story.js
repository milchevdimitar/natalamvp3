const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  authorName: { 
    type: String, 
    required: true 
  },
  imageUrl: { 
    type: String, 
    required: true // Пълен URL адрес до качения PNG файл
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Story', storySchema);