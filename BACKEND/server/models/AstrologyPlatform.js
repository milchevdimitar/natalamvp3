const mongoose = require('mongoose');

// 1. Bonds & Bond Transits (Модули 6, 7, 15.3, 19.3-19.8)
const BondSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: {
      type: String,
      enum: ['user', 'custom_friend', 'public_figure'],
      required: true,
    },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    targetCustomFriendId: { type: mongoose.Schema.Types.ObjectId, default: null },
    targetPublicFigureId: { type: mongoose.Schema.Types.ObjectId, ref: 'PublicFigure', default: null },
    relationshipCategory: {
      type: String,
      enum: ['romantic', 'ex_partner', 'friend', 'family', 'public_figure', 'other'],
      default: 'romantic',
    },
    compatibilitySnapshot: { type: mongoose.Schema.Types.Mixed },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 2. Public Figures (Модул 15)
const PublicFigureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, unique: true },
    category: { type: String }, // 'Music', 'Cinema', 'Science', 'History', 'Art'
    bio: { type: String },
    avatarUrl: { type: String },
    birthdate: { type: Date, required: true },
    birthTime: { type: String },
    hasExactBirthTime: { type: Boolean, default: false },
    birthCity: {
      name: { type: String },
      country: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
      timezone: { type: String },
    },
    mbtiType: { type: String },
    natalChart: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// 3. Content Library, Audio, 360° Moon Journeys & Astrology Classes (Модули 10, 11, 13)
const ContentItemSchema = new mongoose.Schema(
  {
    moduleType: {
      type: String,
      enum: ['cosmic_climate', 'library_article', 'audio_insight', 'meditation_360', 'moon_journey', 'astrology_class'],
      required: true,
      index: true,
    },
    courseLevel: { type: String, enum: ['astrology_101', 'intermediate', 'advanced', null], default: null },
    orderIndex: { type: Number, default: 0 },
    title: { type: String, required: true },
    subtitle: { type: String },
    body: { type: String },
    audioUrl: { type: String },
    isSpatial360: { type: Boolean, default: false },
    durationSec: { type: Number },
    isPremium: { type: Boolean, default: false }, // Go Deeper+ (Модул 19)
    tags: {
      planets: [{ type: String }],
      signs: [{ type: String }],
      houses: [{ type: Number }],
      aspects: [{ type: String }],
      topics: [{ type: String }],
    },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 4. Shared Experiences & Conversations (Модули 12, 14)
const SharedExperienceSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorDisplayName: { type: String },
    authorBigThree: {
      sunSign: String,
      moonSign: String,
      ascendant: String,
    },
    contextType: {
      type: String,
      enum: ['insight', 'pattern', 'transit', 'bond', 'daily_update'],
      required: true,
      index: true,
    },
    contextKey: { type: String, required: true, index: true }, // напр. 'saturn_square_moon' или 'stellium_house_10'
    content: { type: String, required: true, maxlength: 1500 },
    visibility: { type: String, enum: ['public', 'friends'], default: 'public' },
    resonatesCount: { type: Number, default: 0 },
    resonatedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        displayName: String,
        text: { type: String, maxlength: 800 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = {
  Bond: mongoose.models.Bond || mongoose.model('Bond', BondSchema),
  PublicFigure: mongoose.models.PublicFigure || mongoose.model('PublicFigure', PublicFigureSchema),
  ContentItem: mongoose.models.ContentItem || mongoose.model('ContentItem', ContentItemSchema),
  SharedExperience: mongoose.models.SharedExperience || mongoose.model('SharedExperience', SharedExperienceSchema),
};