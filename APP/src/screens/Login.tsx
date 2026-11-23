import { API_BASE_URL } from '../services/apiBase';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { accountMethods, authenticate, changeBackend, sendEmailCode } from '../services/account';
import { CosmicBackground, useReducedMotion } from './Home/CosmicBackground';

const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const deviceGoogleAvailable = Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
  !!googleClientId && (Platform.OS !== 'ios' || !!googleIosClientId);
const ownerTesting = (__DEV__ || Constants.expoConfig?.extra?.lanTestBuild === true) && process.env.EXPO_PUBLIC_NATALA_OWNER_TEST_LOGIN === 'true';

export default function Login() {
  const { setUser, setPage, setAccount } = useApp();
  const reduced = useReducedMotion();
  const offset = useRef(new Animated.Value(0)).current;
  const [register, setRegister] = useState(false);
  const [recover, setRecover] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [editingBackend, setEditingBackend] = useState(false);
  const [backendInput, setBackendInput] = useState('');
  const [backendNotice, setBackendNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Platform.OS === 'ios') void AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    void accountMethods().then((methods) => setNeedsCode(methods.emailVerification)).catch(() => {});
  }, []);

  const submit = async (operation: () => Promise<Awaited<ReturnType<typeof authenticate>> | null>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await operation();
      if (!result) return;
      setAccount(result);
      setUser(result.user);
      setPage('home');
    } catch (failure: unknown) {
      const code = (failure as { code?: string })?.code;
      if (code !== 'ERR_REQUEST_CANCELED' && code !== 'SIGN_IN_CANCELLED') {
        setError(failure instanceof Error ? failure.message : 'Could not sign in. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const applyBackend = async (value: string | null) => {
    if (busy) return;
    setBusy(true);
    setBackendNotice('');
    setError('');
    try {
      const url = await changeBackend(value);
      setCode('');
      setCodeSent(false);
      setPairingCode('');
      setNeedsCode(await accountMethods().then((methods) => methods.emailVerification).catch(() => false));
      setBackendNotice(`Connected to ${url.replace(/\/api$/, '')}`);
    } catch (failure) {
      setBackendNotice(failure instanceof Error ? failure.message : 'Could not change backend.');
    } finally {
      setBusy(false);
    }
  };

  const signInWithApple = () => submit(async () => {
    const nonce = Array.from(await Crypto.getRandomBytesAsync(32), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const credential = await AppleAuthentication.signInAsync({
      nonce: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce),
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL, AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
    });
    return authenticate('/provider', {
      provider: 'apple', token: credential.identityToken, nonce, authorizationCode: credential.authorizationCode,
      name: [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' '),
    });
  });

  const signInWithGoogle = () => submit(async () => {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({ webClientId: googleClientId, iosClientId: googleIosClientId });
    await GoogleSignin.hasPlayServices();
    const result = await GoogleSignin.signIn();
    if (result.type !== 'success') return null;
    return authenticate('/provider', { provider: 'google', token: result.data.idToken, name: result.data.user.name });
  });

  const emailAction = () => submit(() => authenticate('/email', { email, password, name, register, recover, code }));
  const showCode = recover || (register && needsCode);
  const requestCode = () => submit(async () => {
    await sendEmailCode(email);
    setCodeSent(true);
    return null;
  });
  const googleModule = deviceGoogleAvailable ? require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin') : null;
  const GoogleButton = googleModule?.GoogleSigninButton;
  const googleAvailable = deviceGoogleAvailable && (Platform.OS !== 'ios' || appleAvailable);
  const field = (label: string, value: string, change: (value: string) => void, options: React.ComponentProps<typeof TextInput> = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} style={styles.input} value={value} onChangeText={change} editable={!busy} {...options} />
    </View>
  );

  return (
    <View style={styles.screen}>
      <CosmicBackground offset={offset} reduced={reduced} darkBottom />
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
            <View style={styles.content}>
              <Text style={styles.logo}>Natala</Text>
              <Text accessibilityRole="header" style={styles.title}>{recover ? 'Set your password.' : register ? 'Find your cosmic rhythm.' : 'Welcome back.'}</Text>
              <Text style={styles.subtitle}>{recover ? 'Verify your email to access your existing profile.' : register ? 'Create an account to save your discoveries.' : 'Sign in to pick up where you left off.'}</Text>
              <View style={styles.panel}>
                {!recover && appleAvailable && <View pointerEvents={busy ? 'none' : 'auto'}>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                    cornerRadius={12} style={styles.provider} onPress={signInWithApple}
                  />
                </View>}
                {!recover && googleAvailable && GoogleButton && <GoogleButton
                  size={GoogleButton.Size.Wide} color={GoogleButton.Color.Light} disabled={busy}
                  style={styles.provider} onPress={signInWithGoogle}
                />}
                {!recover && (appleAvailable || googleAvailable) && <View style={styles.divider}><View style={styles.line} /><Text style={styles.label}>or use email</Text><View style={styles.line} /></View>}
                {register && field('Name', name, setName, { autoComplete: 'name', maxLength: 80 })}
                {field('Email', email, (value) => { setEmail(value); setCodeSent(false); setCode(''); }, { autoCapitalize: 'none', autoComplete: 'email', keyboardType: 'email-address', maxLength: 254 })}
                {showCode && <>
                  <Pressable accessibilityRole="button" disabled={busy} onPress={requestCode} style={styles.switch}>
                    <Text style={styles.switchText}>{codeSent ? 'Send a new code' : 'Send verification code'}</Text>
                  </Pressable>
                  {codeSent && <Text style={styles.label}>Check your email for an 8-digit code.</Text>}
                  {field('Verification code', code, setCode, { autoComplete: 'one-time-code', keyboardType: 'number-pad', maxLength: 8 })}
                </>}
                {field(recover ? 'New password' : 'Password', password, setPassword, { autoCapitalize: 'none', autoComplete: register || recover ? 'new-password' : 'current-password', secureTextEntry: true, maxLength: 128, onSubmitEditing: emailAction })}
                {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
                <Pressable accessibilityRole="button" disabled={busy} onPress={emailAction} style={styles.primary}>
                  {busy ? <ActivityIndicator color="#15143d" /> : <Text style={styles.primaryText}>{recover ? 'Save password and sign in' : register ? 'Create account' : 'Sign in'}</Text>}
                </Pressable>
              </View>
              <Pressable accessibilityRole="button" disabled={busy} style={styles.switch} onPress={() => { setRegister(!register && !recover); setRecover(false); setError(''); }}>
                <Text style={styles.switchText}>{recover ? 'Back to sign in' : register ? 'Already have an account? Sign in' : 'New to Natala? Create an account'}</Text>
              </Pressable>
              {!register && !recover && <Pressable accessibilityRole="button" disabled={busy} style={styles.switch} onPress={() => { setRecover(true); setPassword(''); setError(''); }}>
                <Text style={styles.switchText}>Set or reset password</Text>
              </Pressable>}
              <Pressable accessibilityRole="button" disabled={busy} style={styles.switch} onPress={() => {
                if (!editingBackend) {
                  setBackendInput(API_BASE_URL.replace(/^http:\/\//, '').replace(/\/api\/?$/, ''));
                  setBackendNotice('');
                }
                setEditingBackend(!editingBackend);
              }}>
                <Text style={styles.switchText}>Change backend IP</Text>
              </Pressable>
              {editingBackend && <View style={styles.panel}>
                {field('Backend IP', backendInput, setBackendInput, {
                  autoCapitalize: 'none', autoCorrect: false, placeholder: '192.168.1.10:5000',
                  keyboardType: Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default',
                  returnKeyType: 'go', onSubmitEditing: () => applyBackend(backendInput),
                })}
                <Pressable accessibilityRole="button" disabled={busy || !backendInput.trim()} style={styles.primary} onPress={() => applyBackend(backendInput)}>
                  <Text style={styles.primaryText}>Use this backend</Text>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={busy} style={styles.switch} onPress={() => applyBackend(null)}>
                  <Text style={styles.switchText}>Use default backend</Text>
                </Pressable>
                {!!backendNotice && <Text accessibilityLiveRegion="polite" style={styles.label}>{backendNotice}</Text>}
              </View>}
              {ownerTesting && <View style={styles.panel}>
                <Text style={styles.label}>Owner testing</Text>
                {field('Device pairing code', pairingCode, setPairingCode, { secureTextEntry: true, autoCapitalize: 'none' })}
                <View style={styles.owners}>
                  {(['alex', 'dimitar'] as const).map((username) => <Pressable key={username} accessibilityRole="button" disabled={busy} style={styles.owner} onPress={() => submit(() => authenticate('/owner-test', { username, pairingCode }))}>
                    <Text style={styles.switchText}>{username}</Text>
                  </Pressable>)}
                </View>
              </View>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  content: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: 12 },
  logo: { fontFamily: 'DancingScript_700Bold', fontSize: 41, color: '#fbf8ff', textAlign: 'center', marginBottom: 14 },
  title: { fontSize: 29, fontWeight: '800', color: '#f6f3ff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#bbc8ee', textAlign: 'center', marginBottom: 10 },
  panel: { gap: 12, padding: 17, borderRadius: 24, backgroundColor: '#242958a6', borderWidth: 1, borderColor: '#7e87d466' },
  provider: { height: 49, width: '100%' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 3 },
  line: { flex: 1, height: 1, backgroundColor: '#707aae65' },
  field: { gap: 5 },
  label: { color: '#c4cbed', fontSize: 13 },
  input: { height: 48, paddingHorizontal: 13, color: '#fff', backgroundColor: '#151d44', borderRadius: 12, borderWidth: 1, borderColor: '#626eb18c' },
  primary: { minHeight: 49, borderRadius: 12, backgroundColor: '#c4b7ff', alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  primaryText: { color: '#171331', fontWeight: '800', fontSize: 15 },
  error: { color: '#ffb8bf', fontSize: 13 },
  switch: { padding: 12, alignItems: 'center' },
  switchText: { color: '#ded6ff', fontWeight: '700', textAlign: 'center' },
  owners: { flexDirection: 'row', gap: 12 },
  owner: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#4c4a87' },
});
