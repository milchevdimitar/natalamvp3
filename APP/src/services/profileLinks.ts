import { Platform, Share } from 'react-native';

export function profileId(value: unknown): string | null {
  return typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value) ? value.toLowerCase() : null;
}

export function profileLink(id: string) {
  return 'https://natala.app/?profile=' + encodeURIComponent(id);
}

export function profileFromLink(value: string, browserOrigin?: string): string | null {
  try {
    const url = new URL(value.trim());
    const ownWebsite = url.origin === 'https://natala.app' || (!!browserOrigin && url.origin === browserOrigin);
    if (ownWebsite && url.pathname === '/') return profileId(url.searchParams.get('profile'));
    if (url.protocol === 'natala:' && url.hostname === 'profile') return profileId(url.pathname.slice(1));
  } catch { /* Only Natala profile links are accepted. */ }
  return null;
}

export async function shareProfile(id: string, name: string): Promise<'shared' | 'copied'> {
  const url = profileLink(id);
  const title = name ? name + ' on Natala' : 'Natala profile';
  if (Platform.OS === 'web') {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
      return 'copied';
    }
  } else {
    await Share.share(Platform.OS === 'ios' ? { message: title, url } : { title, message: title + '\n' + url });
  }
  return 'shared';
}
