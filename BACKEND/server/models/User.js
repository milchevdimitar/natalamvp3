const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    birthdate: { type: Date, required: true },
    birthTime: { type: String },
    birthCity: {
      name: { type: String, required: true },
      country: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    mbti: {
      type: { type: String },
      percentages: {
        extraversion: { type: Number },
        introversion: { type: Number },
        intuitive: { type: Number },
        observant: { type: Number },
        thinking: { type: Number },
        feeling: { type: Number },
        judging: { type: Number },
        prospecting: { type: Number },
      },
    },
    natalChart: {
      sunSign: { type: String },
      moonSign: { type: String },
      ascendant: { type: String },
      planets: Array,
      houses: Array,
      aspects: Array,
    },
    cardology: {
      birthCard: { type: String },
      planetaryCard: { type: String },
    },
    ayurveda: {
      dominantDosha: { type: String, enum: ['vata', 'pitta', 'kapha'] },
      scores: {
        vata: { type: Number },
        pitta: { type: Number },
        kapha: { type: Number },
      },
    },
    numerology: {
      lifePathNumber: { type: Number },
      isMasterNumber: { type: Boolean, default: false },
    },
    bazi: {
      dayMaster: { type: String },
      dayMasterHanzi: { type: String },
      zodiacAnimal: { type: String },
      dominantElement: { type: String },
      favorableElement: { type: String },
      hourBranchIndex: { type: Number, default: null },
      pillars: {
        year: { type: String },
        month: { type: String },
        day: { type: String },
        hour: { type: String },
      },
      elementPercentages: {
        Wood: { type: Number },
        Fire: { type: Number },
        Earth: { type: Number },
        Metal: { type: Number },
        Water: { type: Number },
      },
    },

    // Социален граф и профилни детайли за People модула
    bio: { type: String, default: '' },
    interests: {
      type: [String],
      default: ['Astrology', 'Tarot', 'Numerology'],
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    receivedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    skippedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);