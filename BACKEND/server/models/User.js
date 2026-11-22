const mongoose = require('mongoose');

const ZodiacPositionSchema = new mongoose.Schema(
  {
    deg: { type: Number },
    signDeg: { type: Number },
    degFormatted: { type: String },
    sign: { type: String },
    latinSign: { type: String },
    symbol: { type: String },
    bgName: { type: String },
    element: { type: String, enum: ['Fire', 'Earth', 'Air', 'Water'] },
    modality: { type: String, enum: ['Cardinal', 'Fixed', 'Mutable'] },
    polarity: { type: String, enum: ['Yang', 'Yin'] },
  },
  { _id: false }
);

const PlanetPositionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    symbol: { type: String },
    deg: { type: Number, required: true },
    signDeg: { type: Number },
    degFormatted: { type: String },
    sign: { type: String, required: true },
    latinSign: { type: String },
    signSymbol: { type: String },
    signBg: { type: String },
    house: { type: Number, min: 1, max: 12 },
    element: { type: String, enum: ['Fire', 'Earth', 'Air', 'Water'] },
    modality: { type: String, enum: ['Cardinal', 'Fixed', 'Mutable'] },
    polarity: { type: String, enum: ['Yang', 'Yin'] },
    isRetrograde: { type: Boolean, default: false },
    speedDegPerDay: { type: Number, default: 0 },
    dignity: {
      type: String,
      enum: ['Domicile', 'Exaltation', 'Detriment', 'Fall', 'Peregrine'],
      default: 'Peregrine',
    },
  },
  { _id: false }
);

const HouseCuspSchema = new mongoose.Schema(
  {
    house: { type: Number, min: 1, max: 12, required: true },
    cuspDeg: { type: Number, required: true },
    signDeg: { type: Number },
    degFormatted: { type: String },
    sign: { type: String, required: true },
    latinSign: { type: String },
    symbol: { type: String },
    bgName: { type: String },
    element: { type: String, enum: ['Fire', 'Earth', 'Air', 'Water'] },
    modality: { type: String, enum: ['Cardinal', 'Fixed', 'Mutable'] },
    traditionalRuler: { type: String },
    modernRuler: { type: String },
    planetsInHouse: [{ type: String }],
  },
  { _id: false }
);

const NatalAspectSchema = new mongoose.Schema(
  {
    id: { type: String },
    body1: { type: String, required: true },
    body1Key: { type: String, required: true },
    body2: { type: String, required: true },
    body2Key: { type: String, required: true },
    aspectType: { type: String, required: true },
    symbol: { type: String },
    exactAngle: { type: Number },
    actualAngle: { type: Number },
    orb: { type: Number },
    maxOrb: { type: Number },
    isApplying: { type: Boolean, default: false },
    harmony: { type: String, enum: ['harmonious', 'challenging', 'neutral'] },
    weight: { type: Number },
  },
  { _id: false }
);

const ChartPatternSchema = new mongoose.Schema(
  {
    id: { type: String },
    type: {
      type: String,
      enum: ['Stellium', 'T-Square', 'Grand Trine', 'Grand Cross', 'Yod'],
      required: true,
    },
    bodies: [{ type: String }],
    sign: { type: String },
    house: { type: Number },
    element: { type: String },
    apexBody: { type: String },
  },
  { _id: false }
);

const NatalChartSchema = new mongoose.Schema(
  {
    sunSign: { type: String, index: true },
    moonSign: { type: String, index: true },
    ascendant: { type: String, index: true },
    midheaven: { type: String },
    descendant: { type: String },
    imumCoeli: { type: String },
    dominantElement: { type: String, index: true },
    dominantModality: { type: String },
    isDayChart: { type: Boolean },

    chartRuler: {
      ascSign: { type: String },
      traditionalRuler: { type: String },
      modernRuler: { type: String },
      rulerSign: { type: String },
      rulerHouse: { type: Number },
      isRulerRetrograde: { type: Boolean },
    },

    signature: { type: String },
    calculatedAt: { type: Date },
    zodiacType: { type: String, default: 'Tropical' },
    houseSystem: { type: String, default: 'Placidus' },
    ephemerisSource: { type: String, default: 'astronomy-engine-jpl' },
    hasExactBirthTime: { type: Boolean, default: false },
    dateStr: { type: String },
    timeStr: { type: String },
    birthDateTimeUtc: { type: Date },
    lat: { type: Number },
    lon: { type: Number },
    timezone: { type: String },

    asc: { type: Number },
    mc: { type: Number },
    dsc: { type: Number },
    ic: { type: Number },
    angles: {
      asc: ZodiacPositionSchema,
      mc: ZodiacPositionSchema,
      dsc: ZodiacPositionSchema,
      ic: ZodiacPositionSchema,
    },
    cusps: [{ type: Number }],
    houses: [HouseCuspSchema],

    planetPositions: [PlanetPositionSchema],
    planets: {
      sun: PlanetPositionSchema,
      moon: PlanetPositionSchema,
      mercury: PlanetPositionSchema,
      venus: PlanetPositionSchema,
      mars: PlanetPositionSchema,
      jupiter: PlanetPositionSchema,
      saturn: PlanetPositionSchema,
      uranus: PlanetPositionSchema,
      neptune: PlanetPositionSchema,
      pluto: PlanetPositionSchema,
      northNode: PlanetPositionSchema,
      southNode: PlanetPositionSchema,
      lilith: PlanetPositionSchema,
      partOfFortune: PlanetPositionSchema,
    },

    aspects: [NatalAspectSchema],
    patterns: [ChartPatternSchema],

    elements: {
      fire: { type: Number },
      earth: { type: Number },
      air: { type: Number },
      water: { type: Number },
      shares: {
        fire: { type: Number },
        air: { type: Number },
        water: { type: Number },
        earth: { type: Number },
      },
      dominantElement: { type: String },
      lackingElement: { type: String, default: null },
    },
    modalities: {
      cardinal: { type: Number },
      fixed: { type: Number },
      mutable: { type: Number },
      dominantModality: { type: String },
    },
    polarity: {
      yang: { type: Number },
      yin: { type: Number },
      score: { type: Number },
      dominantPolarity: { type: String },
    },
    hemispheres: {
      eastern: { type: Number },
      western: { type: Number },
      northern: { type: Number },
      southern: { type: Number },
    },
  },
  { _id: false }
);

const CustomFriendSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    relationshipType: {
      type: String,
      enum: ['romantic', 'ex_partner', 'friend', 'family', 'other'],
      default: 'friend',
    },
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
    natalChart: NatalChartSchema,
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const UserCollectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['insights', 'transits', 'patterns', 'bonds', 'library', 'audio', 'classes'],
      default: 'insights',
    },
    items: [
      {
        itemId: { type: String, required: true },
        itemType: { type: String, required: true },
        title: { type: String },
        subtitle: { type: String },
        savedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

function normalizeBirthdateInput(val) {
  if (!val) return val;
  if (typeof val === 'object' && !(val instanceof Date) && val.$date) {
    return new Date(val.$date);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const dmy = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dmy) {
      return new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]), 12, 0));
    }
    const ymd = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
    if (ymd) {
      return new Date(Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), 12, 0));
    }
  }
  return val;
}

const emptyToUndefined = (v) => (v === '' || v === null ? undefined : v);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    cosmicCode: { type: String, unique: true, sparse: true },
    birthdate: {
      type: Date,
      required: true,
      set: normalizeBirthdateInput,
    },
    birthTime: {
      type: String,
      set: emptyToUndefined,
    },
    hasExactBirthTime: { type: Boolean, default: false },
    birthCity: {
      name: {
        type: String,
        required: true,
        default: 'Sofia',
        set: (v) => (typeof v === 'string' && v.trim() ? v.trim() : 'Sofia'),
      },
      country: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
      timezone: { type: String },
    },
    currentLocation: {
      city: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },

    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      set: emptyToUndefined,
    },
    mbti: {
      type: {
        type: String,
        set: emptyToUndefined,
      },
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

    natalChart: NatalChartSchema,
    westernElements: {
      shares: {
        fire: { type: Number },
        air: { type: Number },
        water: { type: Number },
        earth: { type: Number },
      },
      dominantElement: { type: String },
      lackingElement: { type: String },
      includesAscendant: { type: Boolean, default: false },
      source: { type: String },
    },
    polarity: {
      score: { type: Number },
      dominantPolarity: { type: String },
      sourceCoverage: { type: Number },
      provenance: { type: String },
    },

    cardology: {
      birthCard: { type: String },
      planetaryCard: { type: String },
    },
    ayurveda: {
      dominantDosha: {
        type: String,
        enum: ['vata', 'pitta', 'kapha'],
        set: emptyToUndefined,
      },
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

    bio: { type: String, default: '' },
    interests: {
      type: [String],
      default: ['Astrology', 'Tarot', 'Numerology'],
    },
    gender: { type: String, set: emptyToUndefined },
    seekingGenders: [{ type: String }],
    ageRangePreference: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 99 },
    },
    maxDistanceKm: { type: Number, default: null },
    relationshipIntentions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isDiscoverable: { type: Boolean, default: true },
    symbolicMatchConsent: { type: Boolean, default: true },
    datingConsent: { type: Boolean, default: false },

    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    receivedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    skippedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reportedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    customFriends: [CustomFriendSchema],
    followedPublicFigures: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PublicFigure' }],

    collections: [UserCollectionSchema],
    preferences: {
      enableSynastry: { type: Boolean, default: true },
      enableBazi: { type: Boolean, default: true },
      enableMbti: { type: Boolean, default: true },
      enableWesternElements: { type: Boolean, default: true },
      enablePolarity: { type: Boolean, default: true },
      language: { type: String, enum: ['bg', 'en'], default: 'bg' },
    },

    expoPushTokens: [{ type: String }],
    notifications: {
      dailyUpdates: { type: Boolean, default: true },
      newInsights: { type: Boolean, default: true },
      personalTransits: { type: Boolean, default: true },
      bondTransits: { type: Boolean, default: true },
      socialActivity: { type: Boolean, default: true },
      friendRequests: { type: Boolean, default: true },
      dailyReminderTime: { type: String, default: '09:00' },
    },

    subscription: {
      tier: {
        type: String,
        enum: ['free', 'go_deeper_plus'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'trialing', 'past_due', 'canceled', 'expired'],
        default: 'active',
      },
      platform: { type: String, enum: ['ios', 'android', 'web', 'none'], default: 'none' },
      productId: { type: String },
      expiresAt: { type: Date, default: null },
    },

    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);