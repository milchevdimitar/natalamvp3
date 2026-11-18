const mongoose = require('mongoose');

const ProfileSnapshotCacheSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    profileVersion: { type: String, required: true },
    rulesVersion: { type: String, required: true },
    ephemerisVersion: { type: String, required: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 3600 * 1000) },
  },
  { timestamps: true }
);

ProfileSnapshotCacheSchema.index(
  { userId: 1, profileVersion: 1, rulesVersion: 1, ephemerisVersion: 1 },
  { unique: true }
);
ProfileSnapshotCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PairMatchCacheSchema = new mongoose.Schema(
  {
    pairId: { type: String, required: true, index: true }, // `${minId}::${maxId}`
    versionKey: { type: String, required: true }, // `${vA}:${vB}:${rulesVersion}`
    rulesVersion: { type: String, required: true },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 3600 * 1000) },
  },
  { timestamps: true }
);

PairMatchCacheSchema.index({ pairId: 1, versionKey: 1 }, { unique: true });
PairMatchCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = {
  ProfileSnapshotCache: mongoose.model('ProfileSnapshotCache', ProfileSnapshotCacheSchema),
  PairMatchCache: mongoose.model('PairMatchCache', PairMatchCacheSchema),
};