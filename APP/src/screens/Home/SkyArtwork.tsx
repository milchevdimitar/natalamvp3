import React from 'react';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

type SkyArtworkKind = 'sun' | 'codex' | 'retro';
export const SKY_ARTWORK_SIZE = 69;

const colors = {
  sun: ['#ffecab', '#ffc451', '#ce7414'],
  codex: ['#504eac', '#282c71', '#0b1239'],
  retro: ['#c7b6ff', '#7369d9', '#342f7e'],
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
      {kind === 'retro' && <Path d="M24 31a11 11 0 1 1 1 10 M24 23v8h8" fill="none" stroke="#e9e8ff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
    </Svg>
  );
}
