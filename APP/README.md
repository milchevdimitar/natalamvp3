# NATALA — Expo / React Native starter (v21)

This is a **native React Native rewrite / functional starter** based on `natala_mockup_v20.html`. It is **not** a pixel-perfect or feature-complete port. The original v20 HTML is included under `reference/` for comparison.

## Run in VS Code on Windows or Arch Linux

Prerequisites: Node.js 22 LTS, npm, VS Code. Install Expo Go on an Android/iOS phone for quick preview (some native capabilities require development builds).

```bash
npm install
npx expo install --fix
npm run start
```

Press `w` for web, `a` for Android emulator, or scan the QR code with Expo Go. Windows and Linux cannot run the iOS simulator locally. An actual iPhone can run an Expo Go preview, or you can use EAS cloud builds for iOS.

### Project layout

- `App.tsx`: app shell, splash animation, page switching, scroll reset
- `src/context/`: theme and navigation state
- `src/theme/`: light/dark design tokens
- `src/components/`: shared cards, text, search, navbar, avatar, progress
- `src/screens/`: Home, Explore, Chat, People, Profile
- `src/data/`: demo content
- `reference/natala_mockup_v20.html`: source of truth for comparison

### What currently works

- Five tabs, Home on launch, splash, light/dark/system appearance, shared typography
- Home stories, daily gifts with reveal/share, moon/sky demo, planetary positions
- Explore filtering and system detail expansion
- Chat list, demo conversation threads and local send
- People discovery, matches, connect demo, QR placeholder
- Profile statistics, progress rings, personal lenses, premium CTA
- Web and native React Native entrypoint

### Not yet migrated / production ready

- Pixel-perfect visual parity with v20; advanced animations (story gestures, true 3D flips, lunar transit, scroll-triggered rings) need a second pass
- QR camera scanning, real authentication, messaging backend, actual matching, real astrology calculations
- Persistent local state, production navigation/deep links, purchases, push notifications, analytics, accessibility audit
- Desktop native packaging: Expo targets Android/iOS/web. Windows/macOS/Linux native builds require an **additional** desktop strategy; the web build can run in desktop browsers today.

### Engineering next steps

1. Review screens against `reference/natala_mockup_v20.html`, record UI differences.
2. Add Expo Router and typed routes when moving beyond five tabs and modals.
3. Add secure auth and backend; move all matching/AI/subscription logic server-side.
4. Add component tests, E2E flows, accessibility, CI, and release channels.
5. Add EAS Build and actual app signing when ready to distribute.

**Data and payments:** all profile information, connections, chat messages, insights, and Premium elements are demos. Do not treat them as real accounts, scientific assessments, AI responses, or billing.

**Dependencies:** package versions target the Expo SDK 54 family. After `npm install`, `npx expo install --fix` aligns native dependency versions to the installed Expo SDK. If installation reports a conflict, use `npx expo-doctor` and the official Expo upgrade guide.

**Collaboration:** commit this folder to a GitHub repo, create feature branches, and use pull requests. Avoid committing `.env` or secrets. `npm install` generates the lockfile, which should then be committed.
# natalamvp3
