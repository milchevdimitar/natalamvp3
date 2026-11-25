const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  text: { type: String, default: '' },
  type: {
    type: String,
    enum: ['text', 'story_reply', 'story_share'],
    default: 'text',
  },
  storyData: {
    storyId: { type: String },
    imageUrl: { type: String },
    authorName: { type: String },
    createdAt: { type: String }, // Време на качване на сторито
  },
  replyTo: {
    messageId: { type: String },
    senderEmail: { type: String },
    text: { type: String },
  },
  timestamp: {
    type: String,
    default: () =>
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
});

const chatSchema = new mongoose.Schema(
  {
    datingPair: { type: String, unique: true, sparse: true },
    participants: [{ type: String, required: true }],
    lastMessage: { type: String, default: '' },
    lastMessageTime: { type: String, default: '' },
    messages: [messageSchema],
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });

module.exports = mongoose.model('Chat', chatSchema);
