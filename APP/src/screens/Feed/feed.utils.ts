import type { ExploreRoute } from '../../data/exploreRoutes';
import type { DashboardSystem } from '../../services/profileDashboard';

const domains: Record<ExploreRoute, string[]> = {
  astrology: ['astrology', 'zodiac', 'sun sign', 'horoscope'],
  numerology: ['numerology', 'life path'],
  mbti: ['mbti', 'personality type', 'myers briggs'],
  cardology: ['cardology', 'birth card'],
  tarot: ['tarot', 'arcana'],
  ayurveda: ['ayurveda', 'dosha', 'ayurvedic'],
  bazi: ['bazi', 'four pillars', 'day master', 'ba zi'],
  'chinese-zodiac': ['chinese zodiac', 'chinese astrology', 'year of the'],
};
const signs = 'aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces'.split(' ');

export type FeedTopic = { query: string; badge: string; route: ExploreRoute; terms: string[] };

export const normalizeFeedText = (value: string) =>
  decodeHtmlEntities(value).normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const contains = (text: string, term: string) => (' ' + text + ' ').includes(' ' + term + ' ');

export function buildFeedTopics(systems: readonly DashboardSystem[]): FeedTopic[] {
  return systems.flatMap(({ route, name, value }) => {
    const result = value?.trim();
    if (!result) return [];
    const term = normalizeFeedText(result);
    const terms = route === 'ayurveda' ? (term.match(/\b(vata|pitta|kapha)\b/g) ?? [term]) :
      route === 'chinese-zodiac' ? [term, term.split(' ').at(-1) || term] :
      route === 'bazi' ? [term, term.replace(/\b(?:yin|yang|day master)\b/g, '').trim()] :
      route === 'numerology' ? [`life path ${term}`, `life path number ${term}`] :
      [term];
    return [{ query: `${route === 'numerology' ? 'life path' : domains[route][0]} ${result} shorts`, badge: name, route, terms: terms.filter(Boolean) }];
  });
}

export function scoreFeedVideo(topic: FeedTopic, rawTitle: string, rawDescription: string) {
  const title = normalizeFeedText(rawTitle);
  const description = normalizeFeedText(rawDescription.slice(0, 900));
  const domain = domains[topic.route];
  const titleTopic = domain.some((term) => contains(title, term));
  const descriptionTopic = domain.some((term) => contains(description, term));
  const titleMatch = topic.terms.some((term) => contains(title, term));
  const descriptionMatch = topic.terms.some((term) => contains(description, term));
  if (!titleTopic && !descriptionTopic) return 0;
  if (topic.route === 'astrology' && !titleMatch && signs.some((sign) => contains(title, sign))) return 0;
  if (topic.route === 'mbti' && !titleMatch && /\b[ei][ns][tf][jp]\b/.test(title)) return 0;
  if (titleMatch) return titleTopic ? 5 : 4;
  if (titleTopic && descriptionMatch) return 2;
  return 0;
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