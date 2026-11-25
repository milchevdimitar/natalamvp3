const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  pair: { type: String, required: true },
  proposer: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, required: true },
  requestId: { type: String, required: true },
  text: { type: String, required: true, maxlength: 160 },
  status: { type: String, enum: ['pending', 'saved', 'removed'], default: 'pending' },
}, { timestamps: true });

schema.index({ proposer: 1, requestId: 1 }, { unique: true });
schema.index({ pair: 1, status: 1, updatedAt: -1 });
schema.index({ recipient: 1 });

module.exports = mongoose.model('CircleMemory', schema);
