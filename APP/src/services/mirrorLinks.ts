import Constants from 'expo-constants';
import { Platform } from 'react-native';

const tokenPattern = /^[a-f0-9]{48}$/;

export function mirrorFromLink(value: string, browserOrigin?: string): string | null {
  try {
    const url = new URL(value.trim());
    const web = (url.origin === 'https://natala.app' || url.origin === browserOrigin) && url.pathname === '/';
    const native = url.protocol === 'natala:' && url.hostname === 'mirror';
    const expo = __DEV__ && (url.protocol === 'exp:' || url.protocol === 'exps:') && url.pathname === '/--/';
    const token = native ? url.pathname.slice(1) : web || expo ? url.searchParams.get('mirror') : null;
    return token && tokenPattern.test(token) ? token : null;
  } catch {
    return null;
  }
}

export const nativeMirrorLink = (token: string) => 'natala://mirror/' + token;

export function mirrorLink(token: string) {
  if (Platform.OS === 'web' && __DEV__ && typeof window !== 'undefined') {
    return window.location.origin + '/?mirror=' + token;
  }
  if (__DEV__ && Constants.appOwnership === 'expo' && Constants.expoConfig?.hostUri) {
    return 'exp://' + Constants.expoConfig.hostUri + '/--/?mirror=' + token;
  }
  return 'https://natala.app/?mirror=' + token;
}
