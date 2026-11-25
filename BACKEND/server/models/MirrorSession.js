const mongoose = require('mongoose');

const mirrorSchema = new mongoose.Schema({
  initiator: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, required: true },
  clientRequestId: { type: String, required: true },
  question: {
    id: String, version: Number, text: String, options: [String],
  },
  invite: {
    digest: String,
    expiresAt: Date,
    redeemedAt: Date,
  },
  ownAnswer: { type: Number, required: true },
  guess: Number,
  revealedAt: Date,
  status: { type: String, enum: ['pending', 'revealed', 'declined', 'cancelled'], default: 'pending' },
}, { timestamps: true });

mirrorSchema.index({ 'invite.digest': 1 }, { sparse: true });
mirrorSchema.index({ initiator: 1, clientRequestId: 1 }, { unique: true });
mirrorSchema.index({ initiator: 1, updatedAt: -1 });
mirrorSchema.index({ recipient: 1, updatedAt: -1 });

module.exports = mongoose.model('MirrorSession', mirrorSchema);
