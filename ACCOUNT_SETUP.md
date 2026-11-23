# Natala accounts and subscriptions

## Local testing

Email registration and password sign-in work against the development API. Profile birth details can be entered later under Settings.

Use a separate test database for the owner shortcuts. Set these in `BACKEND/server/.env`:

```dotenv
NODE_ENV=development
NATALA_OWNER_TEST_LOGIN=true
NATALA_ALEX_TEST_EMAIL=alex@natala.test
NATALA_DIMITAR_TEST_EMAIL=dimitar@natala.test
NATALA_OWNER_PAIRING_CODE=<random secret of at least 24 characters>
```

Set `EXPO_PUBLIC_NATALA_OWNER_TEST_LOGIN=true` in `APP/.env`, restart both servers and open the login screen. Enter the device pairing code once per sign-in and tap **alex** or **dimitar**. For a backend and browser on the same computer, `NATALA_OWNER_LOOPBACK=true` allows the buttons to work without a code. Leave the test flags off for a deployed backend. Use HTTPS for deployed authentication.

For real owner accounts, set `NATALA_ALEX_EMAIL` and `NATALA_DIMITAR_EMAIL` on the server to the owners' verified provider addresses. These are separate from the test accounts. Sign in with the configured provider and find **Preview access** under Settings → Subscription.

## Email verification

Configure `RESEND_API_KEY`, `NATALA_EMAIL_FROM` and `NATALA_EMAIL_CODE_KEY` in the backend. The sender must belong to a verified Resend domain. Use a random secret of at least 32 characters for the code key. Existing profiles from the old email-only screen can use **Set or reset password** to keep their data after email verification. Production email registration requires verification.

## Apple and Google

- Enable Sign in with Apple for the Apple Developer App ID used by the build. Set the backend `APPLE_CLIENT_ID` to that bundle identifier, `APPLE_CLIENT_SECRET` to the signed Apple client-secret JWT and `APPLE_TOKEN_ENCRYPTION_KEY` to a private 32-byte key encoded as 64 hexadecimal characters. Keep the encryption key stable so account deletion can revoke existing Apple grants. Renew the Apple client secret before it expires.
- Create Google OAuth clients for the iOS bundle and the Android package and signing certificate. Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in the app and use the Web OAuth client ID for both `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the app and `GOOGLE_WEB_CLIENT_ID` on the server. Build a new Expo development client after changing the Google iOS client ID. Google native login requires a development or release build. Use `npx expo start --dev-client` with that build. The default `npm start` targets Expo Go for email and local owner testing.
- Configure the email sender and exercise sign-in, recovery, and account deletion with real provider accounts before App Review.

## Plan access

By default, Free includes the six core Explore systems, Plus adds Tarot and BaZi, and Pro adds the profile PDF. Existing Go Deeper Plus subscriptions retain their previous features under Pro. Home, Profile, and social tabs are core features.

Under Settings ? Subscription, owners can preview each plan and use its settings button to edit which Explore systems and reports it includes. Saved feature changes are shared by accounts using the same backend database. Owner access always unlocks every configurable feature.

Settings shows the stored plan and expiration. Plans billed by Apple or Google open the corresponding store's subscription settings for cancellation. For release with paid subscriptions, connect store products and verified receipt or server-notification processing to the existing server-side subscription record. This change adds entitlement handling and subscription management UI.


## Android APK testing on the local network

Set `NATALA_ANDROID_LAN_TEST=true` in the environment that generates the internal Android build. The Expo config then enables local HTTP for that test APK. Leave the flag unset for published builds, which should use HTTPS. For an internal APK with passwordless owner testing, also set `EXPO_PUBLIC_NATALA_OWNER_TEST_LOGIN=true` at build time and configure the development backend.

From the login screen, open **Change backend IP**, enter the computer's LAN IPv4 address (or `IP:port`) and tap **Use this backend**. Natala checks the server before saving the address. The default HTTP port is 5000. The phone and backend must be able to reach each other over the network. **Use default backend** restores the address configured for that build.
