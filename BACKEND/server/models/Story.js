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
  likes: [
    {
      type: String // Списък от userId/email на потребителите, които са харесали сторито
    }
  ],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Story', storySchema);