import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';
import type LottieView from 'lottie-react-native';
import type { ComponentProps } from 'react';

type Player = Pick<LottieView, 'play' | 'pause' | 'reset'>;

export default forwardRef<Player, ComponentProps<typeof LottieView>>(function StreakLottie(
  { source, webStyle, onAnimationLoaded, onAnimationFailure }, ref
) {
  const [player, setPlayer] = useState<DotLottie | null>(null);
  useImperativeHandle(ref, () => ({
    play: () => { player?.play(); },
    pause: () => { player?.pause(); },
    reset: () => { player?.setFrame(0); },
  }), [player]);

  useEffect(() => {
    if (!player) return;
    const loaded = () => onAnimationLoaded?.();
    const failed = ({ error }: { error: Error }) => onAnimationFailure?.(error.message);
    player.addEventListener('load', loaded);
    player.addEventListener('loadError', failed);
    if (player.isLoaded) loaded();
    return () => {
      player.removeEventListener('load', loaded);
      player.removeEventListener('loadError', failed);
    };
  }, [player, onAnimationLoaded, onAnimationFailure]);

  return <DotLottieReact data={JSON.stringify(source)} style={webStyle} dotLottieRefCallback={setPlayer} />;
});
