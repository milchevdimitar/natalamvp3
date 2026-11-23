import React from 'react';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

type SkyArtworkKind = 'sun' | 'codex' | 'retro' | 'report';
export const SKY_ARTWORK_SIZE = 69;

const colors = {
  sun: ['#ffecab', '#ffc451', '#ce7414'],
  codex: ['#504eac', '#282c71', '#0b1239'],
  retro: ['#c7b6ff', '#7369d9', '#342f7e'],
  report: ['#74568f', '#342557', '#140f32'],
};

export function SkyArtwork({ kind }: { kind: SkyArtworkKind }) {
  const gradient = 'home-orb-' + kind;
  return (
    <Svg width={SKY_ARTWORK_SIZE} height={SKY_ARTWORK_SIZE} viewBox="0 0 69 69" accessible={false}>
      <Defs>
        <RadialGradient id={gradient} cx="35%" cy="28%" rx="78%" ry="78%">
          {colors[kind].map((color, i) => <Stop key={color} offset={[0, 0.46, 1][i]} stopColor={color} />)}
        </RadialGradient>
        {kind === 'codex' && <>
          <RadialGradient id="atlas-planet" cx="29%" cy="23%" rx="73%" ry="78%">
            <Stop offset={0} stopColor="#f5ecff" />
            <Stop offset={0.36} stopColor="#b8acff" />
            <Stop offset={0.75} stopColor="#7062d9" />
            <Stop offset={1} stopColor="#3b2e85" />
          </RadialGradient>
          <LinearGradient id="atlas-orbit" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset={0} stopColor="#84dfff" />
            <Stop offset={0.52} stopColor="#e8deff" />
            <Stop offset={1} stopColor="#ffd295" />
          </LinearGradient>
        </>}
      </Defs>
      <Circle cx={34.5} cy={34.5} r={34} fill={`url(#${gradient})`} stroke="rgba(218,227,255,0.25)" />
      {kind === 'codex' && <>
        <Circle cx={34.5} cy={34.5} r={28} fill="none" stroke="#b2afff" strokeOpacity={0.25} strokeDasharray="1 4" />
        <Ellipse cx={34.5} cy={34.5} rx={28} ry={10} rotation={-29} origin="34.5,34.5" fill="none" stroke="url(#atlas-orbit)" strokeWidth={1.4} opacity={0.63} />
        <Circle cx={34.5} cy={34.5} r={14} fill="url(#atlas-planet)" stroke="#e0d5ff" strokeOpacity={0.52} />
        <Path d="M11 50 C15 57 52 39 59 24" fill="none" stroke="#a8a4ff" strokeWidth={4} strokeOpacity={0.18} strokeLinecap="round" />
        <Path d="M11 50 C15 57 52 39 59 24" fill="none" stroke="url(#atlas-orbit)" strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={52} cy={40.5} r={3.2} fill="#ffd38c" stroke="#fff0c6" strokeWidth={0.8} />
        <Circle cx={22} cy={20} r={2} fill="#b2edff" />
        <Path d="M49 11 Q49 15 53 15 Q49 16 49 20 Q48 16 44.5 15 Q48 15 49 11Z" fill="#f8ecff" />
        <Circle cx={25} cy={56} r={1.1} fill="#d4d7ff" />
      </>}
      {kind === 'report' && <>
        <Circle cx={34.5} cy={34.5} r={27} fill="none" stroke="#efc490" strokeOpacity={0.32} strokeDasharray="1 4" />
        <Path d="M34.5 38c-5-6-11-8-19-7l2 17c7-1 12 1 17 5 5-4 10-6 17-5l2-17c-8-1-14 1-19 7Z" fill="#281e4c" stroke="#ffdc9e" strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="M34.5 38v14M21 38c4 0 7 1 10 3m-9 3c4 0 6 1 9 3m17-9c-4 0-7 1-10 3m9 3c-4 0-6 1-9 3" fill="none" stroke="#f2b976" strokeWidth={1} strokeLinecap="round" opacity={0.75} />
        <Path d="M34.5 12c1.2 7.6 3 9.4 9.5 11-6.5 1.6-8.3 3.4-9.5 11-1.2-7.6-3-9.4-9.5-11 6.5-1.6 8.3-3.4 9.5-11Z" fill="#fff0bc" />
        <Path d="M48 15v7m-3.5-3.5h7M20 23v5m-2.5-2.5h5" fill="none" stroke="#fbd593" strokeWidth={1.2} strokeLinecap="round" />
        <Circle cx={51} cy={53} r={1.4} fill="#baaeff" />
        <Circle cx={24} cy={55} r={1.2} fill="#ffd892" />
      </>}
      {kind === 'retro' && <Path d="M24 31a11 11 0 1 1 1 10 M24 23v8h8" fill="none" stroke="#e9e8ff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
    </Svg>
  );
}
