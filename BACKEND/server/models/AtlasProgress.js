const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, required: true },
  stepId: { type: String, required: true },
  version: { type: Number, required: true },
  birthRevision: String,
  choice: Number,
}, { timestamps: true });
progressSchema.index({ owner: 1, stepId: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('AtlasProgress', progressSchema);
