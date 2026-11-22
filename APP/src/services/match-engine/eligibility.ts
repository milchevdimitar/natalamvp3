import { EligibilityResult, UserMatchInput } from './types';

export function computeAgeYears(
  birthdate?: string | Date | null,
  referenceDate: Date = new Date()
): number | null {
  if (!birthdate) return null;
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return null;

  let age = referenceDate.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - dob.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && referenceDate.getUTCDate() < dob.getUTCDate())
  ) {
    age -= 1;
  }
  return age >= 0 && age < 125 ? age : null;
}

export function haversineDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | null {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    Number.isNaN(lat1) ||
    Number.isNaN(lon1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lon2)
  ) {
    return null;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function matchesGenderPreference(
  seeker: UserMatchInput,
  candidate: UserMatchInput
): boolean {
  if (!seeker.seekingGenders || seeker.seekingGenders.length === 0) return true;
  if (!candidate.gender) return false;
  const normalizedSeeking = seeker.seekingGenders.map((g) => g.toLowerCase());
  if (normalizedSeeking.includes('all') || normalizedSeeking.includes('everyone')) {
    return true;
  }
  return normalizedSeeking.includes(candidate.gender.toLowerCase());
}

function matchesAgePreference(
  seeker: UserMatchInput,
  candidateAge: number
): boolean {
  const pref = seeker.ageRangePreference;
  if (!pref) return true;
  const min = typeof pref.min === 'number' ? Math.max(18, pref.min) : 18;
  const max = typeof pref.max === 'number' ? pref.max : 120;
  return candidateAge >= min && candidateAge <= max;
}

export function checkMutualEligibility(
  userA: UserMatchInput,
  userB: UserMatchInput,
  options: { requireDatingAdultCheck?: boolean; referenceDate?: Date } = {}
): EligibilityResult {
  const reasons: string[] = [];
  const requireAdult = options.requireDatingAdultCheck ?? true;
  const refDate = options.referenceDate ?? new Date();

  if (!userA?.id || !userB?.id || userA.id === userB.id) {
    return { eligible: false, reasons: ['SAME_OR_INVALID_USER'], distanceKm: null };
  }

  // 1. Active & consent checks
  if (userA.isActive === false || userB.isActive === false) {
    reasons.push('INACTIVE_ACCOUNT');
  }
  if (userA.symbolicMatchConsent === false || userB.symbolicMatchConsent === false) {
    reasons.push('MISSING_SYMBOLIC_CONSENT');
  }
  if (requireAdult && (userA.datingConsent === false || userB.datingConsent === false)) {
    reasons.push('MISSING_DATING_CONSENT');
  }

  // 2. Visibility limits (mutual discoverability)
  if (userA.isDiscoverable === false || userB.isDiscoverable === false) {
    reasons.push('USER_NOT_DISCOVERABLE');
  }

  // 3. Mandatory 18+ enforcement for dating
  const ageA = computeAgeYears(userA.birthdate, refDate);
  const ageB = computeAgeYears(userB.birthdate, refDate);
  if (requireAdult) {
    if (ageA === null || ageA < 18) reasons.push('USER_A_UNDERAGE_OR_UNKNOWN_DOB');
    if (ageB === null || ageB < 18) reasons.push('USER_B_UNDERAGE_OR_UNKNOWN_DOB');
  }

  // 4. Blocks, safety reports & previous swipe/dislike exclusions (bidirectional)
  const aBlocked = new Set(userA.blockedUserIds || []);
  const bBlocked = new Set(userB.blockedUserIds || []);
  if (aBlocked.has(userB.id) || bBlocked.has(userA.id)) {
    reasons.push('USER_BLOCKED');
  }

  const aReported = new Set(userA.reportedUserIds || []);
  const bReported = new Set(userB.reportedUserIds || []);
  if (aReported.has(userB.id) || bReported.has(userA.id)) {
    reasons.push('SAFETY_REPORT_EXCLUSION');
  }

  const aDisliked = new Set(userA.dislikedUserIds || []);
  const bDisliked = new Set(userB.dislikedUserIds || []);
  if (aDisliked.has(userB.id) || bDisliked.has(userA.id)) {
    reasons.push('PREVIOUSLY_DISLIKED');
  }

  // 5. Mutual gender / orientation preferences
  if (!matchesGenderPreference(userA, userB) || !matchesGenderPreference(userB, userA)) {
    reasons.push('MUTUAL_GENDER_PREFERENCE_MISMATCH');
  }

  // 6. Mutual age preferences
  if (ageA !== null && ageB !== null) {
    if (!matchesAgePreference(userA, ageB) || !matchesAgePreference(userB, ageA)) {
      reasons.push('MUTUAL_AGE_PREFERENCE_MISMATCH');
    }
  }

  // 7. Geography / max distance filter (uses currentLocation if present, else birthCity)
  const locA = userA.currentLocation || userA.birthCity;
  const locB = userB.currentLocation || userB.birthCity;
  const distanceKm = haversineDistanceKm(
    locA?.latitude,
    locA?.longitude,
    locB?.latitude,
    locB?.longitude
  );

  if (distanceKm !== null) {
    if (typeof userA.maxDistanceKm === 'number' && distanceKm > userA.maxDistanceKm) {
      reasons.push('EXCEEDS_USER_A_MAX_DISTANCE');
    }
    if (typeof userB.maxDistanceKm === 'number' && distanceKm > userB.maxDistanceKm) {
      reasons.push('EXCEEDS_USER_B_MAX_DISTANCE');
    }
  }

  // 8. Mutual relationship intentions when strict mode is enabled
  if (
    (userA.strictIntentionMatch || userB.strictIntentionMatch) &&
    Array.isArray(userA.relationshipIntentions) &&
    Array.isArray(userB.relationshipIntentions) &&
    userA.relationshipIntentions.length > 0 &&
    userB.relationshipIntentions.length > 0
  ) {
    const setB = new Set(userB.relationshipIntentions.map((x) => x.toLowerCase()));
    const overlap = userA.relationshipIntentions.some((x) =>
      setB.has(x.toLowerCase())
    );
    if (!overlap) {
      reasons.push('RELATIONSHIP_INTENTION_MISMATCH');
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    distanceKm,
  };
}