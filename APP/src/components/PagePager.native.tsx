import React, { useImperativeHandle, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import type { PagePagerProps } from './PagePager';

const AnimatedPager = Animated.createAnimatedComponent(PagerView);

export function PagePager({ initialIndex = 0, position, fraction, pagerRef, onIndexChange, onSettled, children }: PagePagerProps) {
  const pager = useRef<PagerView>(null);
  const firstPage = useRef(initialIndex).current;
  const settledIndex = useRef(initialIndex);
  const observeSettling = Boolean(onSettled);
  const onPageScroll = useMemo(() => Animated.event(
    [{ nativeEvent: { position, offset: fraction } }],
    {
      useNativeDriver: true,
      ...(observeSettling && { listener: ({ nativeEvent }: { nativeEvent: { position: number; offset: number } }) => {
        settledIndex.current = Math.round(nativeEvent.position + nativeEvent.offset);
      } }),
    },
  ), [position, fraction, observeSettling]);

  useImperativeHandle(pagerRef, () => ({
    setPage: (page, animated = true) => {
      if (animated) pager.current?.setPage(page);
      else {
        settledIndex.current = page;
        position.setValue(page);
        fraction.setValue(0);
        pager.current?.setPageWithoutAnimation(page);
        onSettled?.(page);
      }
    },
  }), [fraction, position, onSettled]);

  return <AnimatedPager ref={pager} style={styles.pager} initialPage={firstPage}
    onPageScroll={onPageScroll}
    onPageSelected={({ nativeEvent }) => {
      onIndexChange?.(nativeEvent.position);
    }}
    onPageScrollStateChanged={onSettled ? ({ nativeEvent }) => {
      if (nativeEvent.pageScrollState === 'idle') onSettled(settledIndex.current);
    } : undefined}>
    {React.Children.map(children, (child) => <View collapsable={false} style={styles.page}>{child}</View>)}
  </AnimatedPager>;
}

const styles = StyleSheet.create({
  pager: { flex: 1 },
  page: { width: '100%', height: '100%' },
});
