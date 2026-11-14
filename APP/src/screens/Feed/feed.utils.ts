import { FALLBACK_TAGS, ZODIAC_BG_MAP } from './feed.constants';
import { ProfileQueryResult, UserProfileInput } from './feed.types';

export function buildSearchQueryFromProfile(
  userProfile?: UserProfileInput | null
): ProfileQueryResult {
  const keywords: string[] = [];
  const badges: string[] = [];

  const rawZodiac = userProfile?.zodiacSign || userProfile?.natalChart?.sunSign;
  const rawMbti = userProfile?.personalityType || userProfile?.mbti?.type;
  const interests = Array.isArray(userProfile?.interests) ? userProfile.interests : [];

  if (rawZodiac && rawZodiac.trim()) {
    const cleanZodiac = rawZodiac.trim();
    const bgZodiac = ZODIAC_BG_MAP[cleanZodiac.toLowerCase()] || cleanZodiac;
    keywords.push(`${cleanZodiac} zodiac`);
    badges.push(`✨ ${bgZodiac}`);
  }

  if (rawMbti && rawMbti.trim()) {
    const cleanMbti = rawMbti.trim().toUpperCase();
    keywords.push(`${cleanMbti} personality`);
    badges.push(`🧠 ${cleanMbti}`);
  }

  if (interests.length > 0) {
    const topInterests = interests.slice(0, 2).map((i) => i.trim()).filter(Boolean);
    keywords.push(...topInterests);
    topInterests.forEach((interest) => badges.push(`🔮 ${interest}`));
  }

  if (keywords.length === 0) {
    const randomFallback = FALLBACK_TAGS.slice(0, 2).join(' ');
    return {
      query: `${randomFallback} #shorts`,
      badges: ['🌌 Астрология', '🔮 Таро'],
    };
  }

  return {
    query: `${keywords.join(' ')} #shorts`,
    badges,
  };
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function buildYouTubeEmbedHtml(
  videoId: string,
  initialActive: boolean,
  initialMuted: boolean
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="referrer" content="strict-origin-when-cross-origin">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #000000;
          }
          iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            background: transparent;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <iframe
          id="ytplayer"
          src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${videoId}&playsinline=1&iv_load_policy=3&fs=0&enablejsapi=1&origin=https://natala.app"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
        <script>
          var iframe = document.getElementById('ytplayer');
          var state = {
            active: ${initialActive ? 'true' : 'false'},
            paused: false,
            muted: ${initialMuted ? 'true' : 'false'},
            firstFrameBuffered: false
          };

          function postCmd(func, args) {
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: func,
                args: args || []
              }), '*');
            }
          }

          function sendHandshake() {
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage(JSON.stringify({
                event: 'listening',
                id: 1,
                channel: 'widget'
              }), '*');
            }
          }

          window.syncPlayerState = function(active, paused, muted) {
            var wasActive = state.active;
            state.active = active;
            state.paused = paused;
            state.muted = muted;

            if (!active) {
              postCmd('mute');
              postCmd('pauseVideo');
              if (wasActive && state.firstFrameBuffered) {
                postCmd('seekTo', [0, true]);
              }
              return;
            }

            if (paused) {
              postCmd('pauseVideo');
            } else {
              postCmd(muted ? 'mute' : 'unMute');
              postCmd('playVideo');
            }
          };

          iframe.addEventListener('load', function() {
            sendHandshake();
            setTimeout(sendHandshake, 150);
            setTimeout(sendHandshake, 450);
          });

          window.addEventListener('message', function(event) {
            if (!event.data || typeof event.data !== 'string') return;
            try {
              var parsed = JSON.parse(event.data);
              var playerState = parsed.info && typeof parsed.info.playerState === 'number'
                ? parsed.info.playerState
                : (parsed.event === 'onStateChange' ? parsed.info : null);

              if (playerState === 1 && !state.firstFrameBuffered) {
                state.firstFrameBuffered = true;

                if (!state.active) {
                  postCmd('mute');
                  postCmd('pauseVideo');
                  postCmd('seekTo', [0, true]);
                } else {
                  if (state.paused) {
                    postCmd('pauseVideo');
                  } else if (!state.muted) {
                    postCmd('unMute');
                  }
                }

                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'frame_ready' }));
                }
              }

              if (parsed.event === 'onError' && window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', code: parsed.info }));
              }
            } catch (e) {}
          });
        </script>
      </body>
    </html>
  `;
}