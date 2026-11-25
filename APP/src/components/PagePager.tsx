import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { Animated, ScrollView, StyleSheet } from 'react-native';

export type PagePagerHandle = { setPage: (index: number, animated?: boolean) => void };
export type PagePagerProps = React.PropsWithChildren<{
  initialIndex?: number;
  width: number;
  position: Animated.Value;
  fraction: Animated.Value;
  pagerRef: React.Ref<PagePagerHandle>;
  onIndexChange?: (index: number) => void;
  onSettled?: (index: number) => void;
}>;

export function PagePager({ initialIndex = 0, width, position, fraction, pagerRef, onIndexChange, onSettled, children }: PagePagerProps) {
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const index = useRef(initialIndex);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const count = React.Children.count(children);

  function setPage(next: number, animated = true) {
    const target = Math.max(0, Math.min(count - 1, next));
    clearTimeout(settleTimer.current);
    if (!animated) {
      if (target !== index.current) onIndexChange?.(target);
      index.current = target;
      position.setValue(target);
      fraction.setValue(0);
    }
    scroll.current?.scrollTo({ x: target * width, animated });
    if (!animated) onSettled?.(target);
  }

  useImperativeHandle(pagerRef, () => ({ setPage }));
  useEffect(() => {
    const frame = requestAnimationFrame(() => scroll.current?.scrollTo({ x: index.current * width, animated: false }));
    return () => { cancelAnimationFrame(frame); clearTimeout(settleTimer.current); };
  }, [width]);

  return <ScrollView ref={scroll} horizontal pagingEnabled snapToInterval={width}
    directionalLockEnabled nestedScrollEnabled showsHorizontalScrollIndicator={false}
    style={styles.pager} scrollEventThrottle={16}
    onScroll={({ nativeEvent }) => {
      const progress = Math.max(0, Math.min(count - 1, nativeEvent.contentOffset.x / Math.max(1, width)));
      const next = Math.round(progress);
      position.setValue(progress);
      if (next !== index.current) { index.current = next; onIndexChange?.(next); }
      if (onSettled) {
        clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(() => onSettled(next), 140);
      }
    }}>
    {children}
  </ScrollView>;
}

const styles = StyleSheet.create({ pager: { flex: 1 } });
