import React, { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const artwork = {
  astrology: { colors: ['#f8d591', '#715bb0', '#201d54'], ink: '#fff0ba', glyph: <><Circle cx={34} cy={34} r={14} /><Ellipse cx={34} cy={34} rx={22} ry={8} rotation={-35} origin="34,34" /><Circle cx={46} cy={21} r={2.3} fill="#fff0ba" /><Path d="M34 28v12m-6-6h12" /></> },
  numerology: { colors: ['#a6c8ff', '#445da9', '#182b60'], ink: '#e4efff', glyph: <><Path d="M34 13l21 21-21 21-21-21z" /><Path d="M25 28h18l-13 17M19 34h4m22 0h4" /></> },
  mbti: { colors: ['#ddbbff', '#704da2', '#32204f'], ink: '#f3ddff', glyph: <><Path d="M34 15l18 10v18L34 53 16 43V25zM16 25l18 10 18-10M34 35v18M25 20l18 10v18" /><Circle cx={34} cy={35} r={3} fill="#f3ddff" /></> },
  cardology: { colors: ['#f7b1c7', '#98506f', '#482646'], ink: '#ffe4ed', glyph: <><Rect x={23} y={17} width={23} height={35} rx={4} rotation={15} origin="34,34" /><Rect x={20} y={16} width={24} height={36} rx={4} fill="#542c58" /><Path d="M32 40l-6-6a4 4 0 0 1 6-5 4 4 0 0 1 6 5z" /></> },
  tarot: { colors: ['#ffda99', '#a06a51', '#473050'], ink: '#ffedc4', glyph: <><Rect x={21} y={14} width={26} height={40} rx={3} /><Path d="M34 23l2.2 7.8L44 33l-7.8 2.2L34 43l-2.2-7.8L24 33l7.8-2.2zM29 47h10" /></> },
  ayurveda: { colors: ['#aae5c1', '#468f84', '#224a60'], ink: '#dbffe9', glyph: <><Path d="M34 49C19 49 16 39 16 33c8 0 14 3 18 10 4-7 10-10 18-10 0 6-3 16-18 16zM34 43c-8-6-10-15 0-24 10 9 8 18 0 24zM24 53h20" /></> },
  bazi: { colors: ['#f6bc9e', '#986079', '#4a2b56'], ink: '#ffe1c9', glyph: <><Path d="M17 48h34m-30-4V27m9 17V21m8 23V21m9 23V27M17 26h34M23 19h22m-20 1 9-6 9 6" /><Circle cx={34} cy={34} r={3} /></> },
  'chinese-zodiac': { colors: ['#ffcd91', '#aa5563', '#562b4e'], ink: '#ffedc4', glyph: <><Circle cx={34} cy={34} r={19} /><Path d="M34 15v5m19 14h-5M34 53v-5m-19-14h5m8-8 6-5 6 5 3 8-4 10H29l-4-10zM30 33h8m-4-5v10" /></> },
  blood: { colors: ['#f8abae', '#a15269', '#4d2343'], ink: '#ffe1e8', glyph: <Path d="M34 17c-4 8-12 15-12 23a12 12 0 1 0 24 0c0-8-8-15-12-23zM28 40a6 6 0 0 0 5 6" /> },
  elements: { colors: ['#ace2ef', '#517da7', '#242e59'], ink: '#e0fcff', glyph: <><Path d="M34 15l19 19-19 19-19-19zM15 34h38M34 15v38M23 27h5m12 0h5m-22 14h5m12 0h5" /></> },
  enneagram: { colors: ['#c3b0f7', '#6465a7', '#302851'], ink: '#efe7ff', glyph: <><Circle cx={34} cy={34} r={18} /><Path d="M34 16l16 28H18zM22 20l23 28L16 32l35-5-17 25 12-33" /></> },
  design: { colors: ['#a6dbc4', '#547f90', '#252f58'], ink: '#e3fff5', glyph: <><Path d="M34 17l12 15-12 19-12-19zM22 32h24M34 17v34" /><Circle cx={34} cy={17} r={3} fill="#e3fff5" /><Circle cx={34} cy={51} r={3} fill="#e3fff5" /></> },
} as const;

export type ExploreArtworkKind = keyof typeof artwork;

export function ExploreArtwork({ kind, muted = false }: { kind: ExploreArtworkKind; muted?: boolean }) {
  const id = 'explore-orb-' + useId().replace(/[^a-z0-9]/gi, '');
  const { colors, ink, glyph } = artwork[kind];
  const palette = muted ? ['#b1b6c1', '#5e6573', '#343944'] : colors;
  const stroke = muted ? '#d1d5df' : ink;

  return (
    <Svg width={64} height={64} viewBox="0 0 68 68" accessible={false}>
      <Defs>
        <RadialGradient id={id} cx="29%" cy="18%" rx="83%" ry="85%">
          {palette.map((color, i) => <Stop key={color} offset={[0, 0.46, 1][i]} stopColor={color} />)}
        </RadialGradient>
      </Defs>
      <Circle cx={34} cy={34} r={32} fill={`url(#${id})`} stroke={stroke} strokeOpacity={0.34} />
      <Circle cx={34} cy={34} r={28} fill="none" stroke={stroke} strokeOpacity={0.18} />
      <Path d="M13 19h6m-3-3v6m35 30h5m-2.5-2.5v5" stroke={stroke} strokeOpacity={0.75} />
      <G fill="none" stroke={stroke} strokeWidth={1.55} strokeLinecap="round" strokeLinejoin="round">
        {glyph}
      </G>
    </Svg>
  );
}
