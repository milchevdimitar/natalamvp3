import React from 'react';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

type SkyArtworkKind = 'sun' | 'codex' | 'retro';

const colors = {
  sun: ['#ffecab', '#ffc451', '#ce7414'],
  codex: ['#bdcaff', '#577adf', '#423eaa'],
  retro: ['#c7b6ff', '#7369d9', '#342f7e'],
};

export function SkyArtwork({ kind }: { kind: SkyArtworkKind }) {
  const gradient = 'home-orb-' + kind;
  return (
    <Svg width={69} height={69} viewBox="0 0 69 69" accessible={false}>
      <Defs>
        <RadialGradient id={gradient} cx="35%" cy="28%" rx="78%" ry="78%">
          {colors[kind].map((color, i) => <Stop key={color} offset={[0, 0.46, 1][i]} stopColor={color} />)}
        </RadialGradient>
      </Defs>
      <Circle cx={34.5} cy={34.5} r={34} fill={`url(#${gradient})`} stroke="rgba(218,227,255,0.25)" />
      {kind === 'codex' && <Path d="M34.5 20 Q36 33 49 34.5 Q36 36 34.5 49 Q33 36 20 34.5 Q33 33 34.5 20Z" fill="#e8edff" />}
      {kind === 'retro' && <Path d="M24 31a11 11 0 1 1 1 10 M24 23v8h8" fill="none" stroke="#e9e8ff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
    </Svg>
  );
}
