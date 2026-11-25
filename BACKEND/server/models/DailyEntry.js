const mongoose = require('mongoose');

const dailyEntry = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, required: true },
  localDate: { type: String, required: true },
  zone: { type: String, required: true },
  prompt: {
    id: String, version: Number, title: String, question: String,
    options: [String], reason: String,
  },
  answer: { type: Number, default: null },
}, { timestamps: true });

dailyEntry.index({ owner: 1, localDate: -1 }, { unique: true });

module.exports = mongoose.model('DailyEntry', dailyEntry);
