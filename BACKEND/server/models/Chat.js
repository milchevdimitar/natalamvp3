const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: {
    type: String,
    default: () =>
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
});

const chatSchema = new mongoose.Schema(
  {
    participants: [{ type: String, required: true }], // Масив от два имейла
    lastMessage: { type: String, default: '' },
    lastMessageTime: { type: String, default: '' },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);