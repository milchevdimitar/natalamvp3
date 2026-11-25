const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  _id: String,
  members: { type: [String], required: true, index: true },
  firstAction: { type: String, enum: ['like', 'pass'] },
  secondAction: { type: String, enum: ['like', 'pass'] },
  closed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('DatingPair', schema);
