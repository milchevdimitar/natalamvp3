# ENGINEERING PROMPT: Integrate the multi-system Match Engine into our self-discovery/dating app

You are the lead full-stack engineer, algorithm designer, and test engineer for our existing app. This is an IMPLEMENTATION task, not an invitation to produce only an essay, pseudocode, or conceptual architecture. Inspect the repository and existing functionality first, then implement the feature within its current stack and conventions. Communicate findings, changes, and unresolved blockers clearly. Ask for clarification only if a decision cannot be made safely from the codebase; otherwise choose a reversible, documented default.

## Product objective
Build a mutual, explainable match/ranking engine inspired by dating apps, combining:
1. MBTI personality compatibility from our supplied 16×16 color-coded matrix;
2. western astrology synastry (cross-chart planetary aspects);
3. western astrology four-element complementarity (Fire, Air, Water, Earth), consuming our EXISTING element computation;
4. an EXISTING feminine/masculine (Yin/Yang-like) energy-balance computation, interpreted as symbolic energetic polarity, NOT gender identity or biological sex;
5. Chinese Ba Zi (Four Pillars of Destiny), currently being researched/implemented by the developer.

The product principle is **similarity for selected domains and complementary differences in others**:
- MBTI: favor pairings in supplied table; don't assert every intuitive person must date another intuitive person. N/N tendencies are represented by the table, and exceptions are retained.
- Western elements: model reciprocal complementarity (Fire↔Air, Water↔Earth) while also making balanced+balanced pairs score highly.
- Polarity: positive Yang-heavy plus negative Yin-heavy pair well, and balanced+balanced pair well. Do not infer identity, sex, sexual orientation, relationship roles, dominance, consent, or sexuality from this feature.
- Synastry: both supportive aspects and stimulating/tension aspects can matter, in DIFFERENT domains (harmony, attraction, communication, friction). Squares/oppositions are not automatic rejection; conjunctions are not automatically good.
- Ba Zi: traditional Chinese five-element and pillar relationships, NOT conversions from western four elements.

This is a symbolic/self-reflection compatibility index, NOT a scientifically validated prediction of relationship success. Respect preferences and observable behavior over typology. User-facing text must never state a match probability, soulmate destiny, guaranteed relationship outcome, or certainty based on astrology/MBTI/Ba Zi.

## Phase A — Repository audit and integration boundaries
1. Inspect repository architecture, language/framework, DB schemas, auth, user profiles, onboarding, matchmaking/discovery endpoints, existing natal chart/planet positions, existing western element score, polarity score, MBTI storage and Ba Zi work-in-progress. Find current unit/integration test runner, migrations, job queues, caching, API conventions, telemetry and localization.
2. Produce a short audit mapping current models/functions to reused integrations, with explicit assumptions. Do not reimplement the existing element/polarity/Ba Zi calculators where reusable.
3. Make a small, clean and testable domain module, e.g. `match-engine` with submodules `mbti`, `synastry`, `western-elements`, `polarity`, `bazi-adapter`, `eligibility`, `ranker`, `explanations`, and `types`. Adapt names/paths to repo conventions.
4. Use deterministic math for all calculations; any LLM is only a narrative explainer of VERIFIED numeric features. LLM cannot decide eligibility, invent placements/aspects, or change scores. Introduce config/versioning and typed DTOs.

## Phase B — User data, eligibility and uncertainty
Use validated inputs only. Typical profile includes: user ID; date of birth; optional exact local birth time; selected birth city with lat/long and historical IANA time-zone identifier; MBTI type and optional certainty/continuous preference scores; western 4-element shares normalized to sum to 1; polarity normalized to [-1,1] (positive=Yang/active, negative=Yin/receptive); Ba Zi chart/provenance if present; dating preferences, adults-only status, relationship goals, privacy and consent settings.

1. BEFORE scoring, enforce mutual filters: active+consenting users, 18+ only for dating, mutual gender/orientation and age preferences, distance or geography filters where configured, relationship intentions, blocks, reports/safety exclusions, previous swipe/dislike rules, and visibility limits. No match scores for forbidden candidates; no circumvention of blocks.
2. Handle missing data explicitly: no fabricated birth time such as 12:00; without precise time omit Ascendant, angles, houses and hour-pillar features. Moon and other time-sensitive aspects should be skipped or robustly bounded across possible birth times, rather than treated as exact. When exact place/time-zone is absent, defer only location-dependent features. If MBTI is missing, omit that module. If Ba Zi is unavailable, omit its module. Renormalize available module weights, never score missing as zero.
3. Store module availability, data provenance, model/rule version, and a confidence/completeness label separate from the compatibility index.
4. Avoid displaying exact private birth location or date/time in a match explanation. Apply strict access control and minimization; dating orientation/sex-life information may be GDPR special-category data requiring an appropriate legal basis and safeguards.

## Phase C — MBTI module (supplied chart is authoritative for our product heuristic)
Load `mbti_compatibility_matrix.json` (supplied in the task) as data, not hardcoded business logic. The image has a symmetric 16×16 matrix. Type order:
`INFP ENFP INFJ ENFJ INTJ ENTJ INTP ENTP ISFP ESFP ISTP ESTP ISFJ ESFJ ISTJ ESTJ`

Legend and subjective starting normalized values:
- `R` red = 0.25 (the chart says 'Uh-oh, think this one through')
- `Y` yellow = 0.45 ('It could work, but not ideal')
- `L` light green = 0.60 ('One-sided match')
- `G` darker green = 0.80 ('It's got a good chance')
- `B` blue = 1.00 ('Often listed as an ideal match')

The `L` label in the legend does not imply directional scoring: the provided image itself is symmetric. Validate that there are exactly 16 rows, exactly 16 valid symbols per row, and that matrix(i,j)==matrix(j,i). Never use MBTI type as an eligibility veto. If testing shows overpowered scores, reduce its overall weight; don't change the chart secretly.

Reference rows in the same order:
```
INFP GGGBGBGGRRRRRRRR
ENFP GGBGBGGGRRRRRRRR
INFJ GBGGGGGBRRRRRRRR
ENFJ BGGGGGGGBRRRRRRR
INTJ GBGGGGGBLLLLYYYY
ENTJ BGGGGGBGLLLLLLLL
INTP GGGGGBGGLLLLYYYB
ENTP GGBGBGGGLLLLYYYY
ISFP RRRBLLLLYYYYLBLB
ESFP RRRRLLLLYYYYBLBL
ISTP RRRRLLLLYYYYLBLB
ESTP RRRRLLLLYYYYBLBL
ISFJ RRRRYLYYLBLBGGGG
ESFJ RRRRYLYYBLBLGGGG
ISTJ RRRRYLYYLBLBGGGG
ESTJ RRRRYLBYBLBLGGGG
```

Examples from supplied chart: `INFP↔ENFJ = B`; `INFJ↔ENFP = B`; `ENFJ↔ISFP = B`; `ISTJ↔ESTJ = G`. A sensory/intuitive pair is not automatically rejected. Explanations should name shared/different preferences, not pretend chart labels have scientific predictive validity.

## Phase D — Western element compatibility
Reuse our existing weighted elemental distribution algorithm; inspect and preserve its planet weights and choice of including Ascendant before integration. Normalize input to a nonnegative probability-like vector in this exact order: `e = [fire, air, water, earth]`, `sum(e)=1`.

Define an involutive complement transform:
`T(e) = [e.air, e.fire, e.earth, e.water]`
meaning Fire↔Air, Water↔Earth.

For profiles A and B:
`S_elements(A,B) = clamp(1 - 0.5 * sum_i | e_A[i] - T(e_B)[i] |, 0, 1)`.

This is symmetric: `S(A,B)=S(B,A)`. Examples:
- A 50% Fire + 50% Water; B 50% Air + 50% Earth => S=1.0.
- A and B each 25% of all four => S=1.0 (balanced+balanced).
- This is a PRODUCT HYPOTHESIS, not an established law. Its strong preferences must be tempered by the overall blend and validated against user feedback. Store a detailed breakdown, not just S.

## Phase E — Polarity compatibility
Consume the existing polarity engine, normalize each person's result to `p in [-1,1]`, where -1=Yin/receptive-heavy, +1=Yang/active-heavy, 0=balanced. Never derive `p` from declared sex, gender identity, or sexual orientation.

`S_polarity(A,B) = clamp(1 - |p_A + p_B|/2, 0, 1)`.

Examples: (+0.8, -0.8) => 1.0; (0,0) => 1.0; (+0.8,+0.8) => 0.2. Interpret as a symbolic preference for energetic complementarity; let users turn this module off in their preferences if feasible. Store `p` provenance and tolerance to missing source measurements.

## Phase F — Western natal synastry: astronomy first, interpretation second
1. Use the EXISTING natal positions if validated; otherwise introduce a licensed/compatible astronomical ephemeris. Canonical position contract: geocentric tropical ecliptic longitude in degrees [0,360), same ephemeris/time standard for both users; IANA historical timezone and DST converted to UTC. House system is explicitly configured; don't silently mix tropical and sidereal or different house systems. Swiss Ephemeris supports this but has AGPL/professional licensing: evaluate license BEFORE shipping closed-source code.
2. For EVERY relevant CROSS-PROFILE pair (body from A vs body from B), calculate:
   `d = abs(((lambda_A - lambda_B + 180) mod 360) - 180)` (result 0..180).
   Major aspects: conjunction 0°, sextile 60°, square 90°, trine 120°, opposition 180°.
   `orb = abs(d - exact_angle)`. A valid aspect occurs only if `orb <= configured_orb_limit`, with a deterministic aspect tie-breaker if more than one fits. Propose configurable starting limits: conjunction 8° if Sun/Moon, 6° otherwise; sextile 4°; square/trine 6°; opposition 7°. Reduce for angles to ~3° or use a consistent pair-specific table. These are editable traditional interpretive defaults, NOT scientific thresholds.
3. Weight aspect strength by closeness: `closeness = max(0, 1 - orb / orb_limit)`; no zero-denominator. Recognize EXACT angular wrap-around: 359° vs 1° is a 2° conjunction.
4. Prioritize informative personal planet pairs and optionally angles where accurate: Sun–Moon; Moon–Moon; Moon–Venus; Venus–Mars both directions; Venus–Venus; Mercury–Mercury; Mercury–Moon; Sun–Venus; Sun–Sun; Jupiter and Saturn contacts with personal planets. Avoid overweighting generational outer-planet conjunctions shared by similar birth years. If an angle or Moon is unreliable due to unknown birth time, omit it or provide uncertainty bounds.
5. Aspect valence MUST depend on planet pair and domain, not just aspect geometry. Examples:
   - Moon–Moon trine/sextile: emotional harmony bonus.
   - Mercury–Mercury trine/sextile: communication bonus; square: communication challenge.
   - Venus–Mars conjunction/trine/sextile: attraction bonus; Venus–Mars square/opposition may increase 'chemistry' but also tension (do not label fully positive/negative).
   - Moon–Saturn square: challenge for emotional ease; Saturn–Sun/Moon trines may suggest symbolic stability.
   - All conjunctions are context dependent; opposition can represent a mix of attraction and friction.
6. Define a small versioned pair/aspect/domain coefficient table. Accumulate directional evidence A→B and B→A, preserving both, while final aggregate score remains symmetric. Domain outputs: `emotional_harmony`, `communication`, `attraction`, `stability`, `friction`. Prefer a baseline-neutral, bounded, shrunk normalization that does not reward merely having more counted aspects:
   `strength_sum = sum_i w_i*closeness_i*coefficient_i`,
   `weight_sum = sum_i w_i*closeness_i`,
   `domain_score = clamp(0.5 + 0.5*strength_sum/(weight_sum + kappa), 0, 1)` with `kappa=3` initial, positive `w_i` and coefficient in [-1,1].
   If there are insufficient reliable inputs, output null/unavailable rather than fabricating precision. Adjust names/formula if repository already defines a robust equivalent, but preserve domain separation and explainability.
7. Create an overall synastry index from non-null domains, with transparent config. Do not globally treat square or opposition as binary rejection. Show top significant exact aspects with body names, type, observed angle, deviation/orb and explanation code, never generated fake details.
8. Optional V2: grand trines (three-body 120° pattern), T-squares and grand crosses; do not confuse a single trine aspect with a multi-body grand trine. V1 prioritizes accurate pairwise synastry.

## Phase G — Ba Zi adapter and compatibility
Do NOT conflate Ba Zi's `Wood, Fire, Earth, Metal, Water` with Western `Fire, Air, Water, Earth`. Maintain distinct types and calculations.

Read current developer's Ba Zi implementation and reuse its deterministic Four Pillars results. Validation rules: actual birth instant with historical time zone; Year Pillar changes at the exact Li Chun solar term; Month Pillar uses the 12 Jie solar terms; Day Pillar follows the sexagenary cycle; Hour Pillar follows its 2-hour branch and configured day-boundary convention. Decide explicitly whether civil/true solar time is used, whether Zi-day starts 23:00 or 00:00, and how hidden stems/seasonality are weighted. Keep rule set and version in output. No fabricated fourth pillar when birth time is unknown.

Compare the profiles on separate subfeatures:
- Day Master relation of both directions: same, generating, controlling, and applicable Heavenly Stem combinations;
- Day Branch (traditional 'Spouse Palace') and other Earthly Branch Six Harmonies (六合), Three Harmonies (三合), Clashes (六冲), harms/punishments where actually supported;
- cross-chart Heavenly Stem combinations/clashes, with pillar provenance;
- complementary useful/favorable elements if an explicit validated rule-based strength model exists; do not treat raw five-element counts as a universally correct target of 20% each;
- supported Ten Gods relationships (contextualize without gender-based spouse-star assumptions).

A candidate starting Ba Zi scoring config could be: Day Branch interactions 30%, Day Master 25%, favorable element supply 25%, stem relations 15%, other branches 5%; redistribute if a subfeature is unavailable. This is a configurable PRODUCT HEURISTIC. Preserve both supportive and challenging patterns, and never call a particular 'clash' a certain relationship failure. Do not use fortune-cycle predictions as rank penalties in V1.

## Phase H — Final normalized match score
Start with these versioned module weights (sum=1):
- synastry: 0.30
- Ba Zi: 0.20
- MBTI: 0.20
- western elemental complementarity: 0.20
- Yin/Yang polarity: 0.10

For available modules `M`:
`symbolic_score = 100 * (sum_{m in M} w_m*S_m) / sum_{m in M} w_m`
where `0<=S_m<=1`, round for display only. If no modules are available, do NOT invent a score; use non-symbolic discovery ordering and onboarding prompts.

Do not equate `symbolic_score=87` with an 87% probability of romantic success. Label it 'Индекс на символична съвместимост' (0–100 points), not '87% chance of love'. Make all module weights configurable, logged and versioned, with feature flags for Ba Zi rollout. Consider per-user choice of symbolic systems; renormalize weights after opt-out.

If the app contains direct, mutually supplied values/intent/lifestyle information, keep them separate from the symbolic index and give the user's explicit preferences priority. Optionally add an experimentally tuned real-world compatibility score based on shared stated goals/values with higher product priority; do not silently claim it is covered by MBTI/astrology.

## Phase I — API, persistence, performance, UI
Implement or adapt typed interfaces along these lines:
```
computeProfileFeatures(userId): ProfileFeatureSnapshot
calculatePairCompatibility(aId,bId, configVersion): PairCompatibilityResult
getEligibleRankedCandidates(currentUserId, filters, cursor): RankedCandidatesPage
```
Result should contain `total_score`, `components` {name,score,weight,available,confidence}, `synastry_domains`, `explanation_facts`, `top_supportive_factors`, `potential_tensions`, `rules_version`, `computed_at`, data-completeness, and stable explanation keys. Each explanation must trace back to specific inputs and rules. Do not expose the other user's private birth coordinates or exact time.

- Cache immutable feature snapshots by user-profile version + ephemeris/config version; pair scores by sorted (minID,maxID) + both profile versions + rules version, with TTL if applicable.
- Recalculate only affected pairs when birth details, MBTI, preferences, profile consent, rule/config version or Ba Zi calculations change.
- Separate fast eligibility filtering from costlier synastry. Use precomputed features and batch ranking; avoid expensive O(N²) full rewrites, N+1 SQL calls and LLM calls in swipe/discovery list.
- Provide consistent pagination, explainable tie-breaking and adequate exposure diversity. Honor blocks and dislikes. Exclude profile pairs where the other person cannot reciprocally discover the user.
- Localization keys for Bulgarian UI: `match.symbolicCompatibility`, `match.communication`, `match.attraction`, `match.complementaryElements`, `match.polarityBalance`, `match.goodAspects`, `match.growthAreas`, `match.insufficientData`. Keep scientific uncertainty disclosures accessible.
- Explain 2–3 concrete reasons such as 'Your Mercury placements form a close trine' ONLY when computed. The LLM may paraphrase provided explanation facts, but NEVER generate unseen planets/aspects or modify scores.

## Phase J — Automated tests / acceptance criteria
1. MBTI matrix: valid 16×16, known examples, full symmetry, all symbol/score mappings and graceful missing/invalid types.
2. Angular math: (359°,1°)=2° conjunction; (350°,50°)=60° sextile; (10°,100°)=90° square; (10°,130°)=120° trine; (10°,190°)=180° opposition. Correct +/-orb boundaries, exact near-0 crossover and angle normalization.
3. Western elements: complementary A Fire .5+Water .5 vs B Air .5+Earth .5 yields 1; two uniform profiles yield 1; symmetry and normalization/clamping.
4. Polarity: (+.8,-.8)=1; (0,0)=1; (+.8,+.8)=.2; symmetry.
5. Missing/uncertain natal birth time never silently produces Ascendant/houses or pretend-precise Moon. Ba Zi 3-pillar fallback; Li Chun / Jie / timezone / DST / 23:00-or-midnight boundary fixtures.
6. Score always finite 0..100, pair-invariant under A↔B, stable to repeated runs/config. Missing-module weights renormalize; unknown all => no symbolic score.
7. Eligibility: 18+ only, mutual preference, blocks, consent and safety enforced before ranking; no data leak to client; changes invalidate cache.
8. Verify no unintended double weighting of the same element/polarity feature; validate that no AI calls are required for base scoring.
9. Integration tests cover endpoint response schema, DB migrations, deterministic sorted results, performance and compatibility with existing app behavior.

## Deliverables to provide after actual implementation
- Short repository audit with reused functions and changed files.
- Working code, migrations/config/feature flags, and documented API/DTOs.
- Deterministic 16×16 MBTI config loaded from the attached JSON.
- Automated tests with results, including edge cases above and Ba Zi golden fixture cross-checks.
- One example pair output with source facts (use SYNTHETIC/mock birth data, not real user profiles), scored breakdown and Bulgarian UI explanation.
- A one-page note describing non-scientific nature of symbolic interpretations, ephemeris/data licensing, data protection, known limitations, and proposed user-feedback/A-B calibration strategy.
- If any dependency or data source is unavailable, name the blocker and implement the safely testable parts now without claiming it is fully done.

## Supporting technical/research references
- MBTI official statement (no 'best' romantic type combinations): https://www.myersbriggs.org/type-in-my-life/personality-type-and-relationships/
- Swiss Ephemeris / calculations / dual AGPL and commercial licensing: https://www.astro.com/swisseph/swisseph.htm
- Aspect angles and orb definition: https://www.astro.com/astrowiki/en/Aspect
- Ba Zi computation conventions and boundary cases (compare schools): https://bazi-atlas.com/methodology ; https://meet.auspica.app/methods
- Ba Zi partner comparison examples (traditional conventions only): https://bazi-atlas.com/compatibility-calculator
- Research on assortative matching: https://www.nature.com/articles/s41562-023-01672-z
- Astrology marriage predictive validity limitations: https://link.springer.com/article/10.1186/s41118-020-00103-5
- GDPR principles and special-category data: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en ; https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en

START NOW: audit the repository and implement the first functional, tested vertical slice, retaining the current architecture. Do not stop at a design proposal.
