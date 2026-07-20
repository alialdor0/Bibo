import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { Themed } from './Themed';

const ITEM_H = 44;
const VISIBLE = 5;

export default function WheelPicker({ items, value, onChange, hint }) {
  const { theme } = useApp();
  const scrollRef = useRef(null);
  const timer     = useRef(null);

  const selIdx = items.findIndex(i => i[0] === value);

  const goTo = useCallback((idx, animated = false) => {
    scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated });
  }, []);

  useEffect(() => {
    const idx = items.findIndex(i => i[0] === value);
    setTimeout(() => goTo(Math.max(0, idx), false), 80);
  }, [items, value, goTo]);

  const onScroll = (e) => {
    clearTimeout(timer.current);
    const y = e.nativeEvent.contentOffset.y;
    timer.current = setTimeout(() => {
      let idx = Math.round(y / ITEM_H);
      idx = Math.max(0, Math.min(idx, items.length - 1));
      goTo(idx, true);
      if (items[idx][0] !== value) onChange(items[idx][0]);
    }, 80);
  };

  const visH = ITEM_H * VISIBLE;

  return (
    <View style={s.wrap}>
    <Themed>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
      <View style={[s.outer, { height: visH }]}>
        <View style={[s.line, { top: visH / 2 - 23 }]} />
        <View style={[s.line, { top: visH / 2 + 22 }]} />
        <View style={[s.fadeTop, { backgroundColor: theme.bg, opacity: 0.92 }]} pointerEvents="none" />
        <View style={[s.fadeBot, { backgroundColor: theme.bg, opacity: 0.92 }]} pointerEvents="none" />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}>
          {items.map((item, i) => {
            const dist  = Math.abs(selIdx - i);
            const isSel = dist === 0;
            const op    = dist === 0 ? 1 : dist === 1 ? 0.5 : dist === 2 ? 0.2 : 0.06;
            return (
              <TouchableOpacity
                key={String(i)}
                onPress={() => { onChange(item[0]); goTo(i, true); }}
                style={[s.item, { height: ITEM_H, opacity: op }]}
                accessibilityLabel={item[1] || item[0]}>
                <Text style={isSel ? s.textSel : s.text}>{item[0]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Themed>
    </View>
  );
}

export function AgePicker({ ages, value, onChange, hint }) {
  const { theme } = useApp();
  const scrollRef = useRef(null);
  const timer     = useRef(null);
  const selIdx    = Math.max(0, ages.indexOf(value));

  const goTo = useCallback((idx, animated = false) => {
    scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated });
  }, []);

  useEffect(() => {
    setTimeout(() => goTo(Math.max(0, ages.indexOf(value)), false), 80);
  }, [value, ages, goTo]);

  const onScroll = (e) => {
    clearTimeout(timer.current);
    const y = e.nativeEvent.contentOffset.y;
    timer.current = setTimeout(() => {
      let idx = Math.round(y / ITEM_H);
      idx = Math.max(0, Math.min(idx, ages.length - 1));
      goTo(idx, true);
      if (ages[idx] !== value) onChange(ages[idx]);
    }, 80);
  };

  const visH = ITEM_H * VISIBLE;

  return (
    <View style={s.wrap}>
    <Themed>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
      <View style={[s.outer, { height: visH }]}>
        <View style={[s.line, { top: visH / 2 - 23 }]} />
        <View style={[s.line, { top: visH / 2 + 22 }]} />
        <View style={[s.fadeTop, { backgroundColor: theme.bg, opacity: 0.92 }]} pointerEvents="none" />
        <View style={[s.fadeBot, { backgroundColor: theme.bg, opacity: 0.92 }]} pointerEvents="none" />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}>
          {ages.map((age, i) => {
            const dist  = Math.abs(selIdx - i);
            const isSel = dist === 0;
            const op    = dist === 0 ? 1 : dist === 1 ? 0.5 : dist === 2 ? 0.2 : 0.06;
            return (
              <TouchableOpacity
                key={age}
                onPress={() => { onChange(age); goTo(i, true); }}
                style={[s.item, { height: ITEM_H, opacity: op }]}
                accessibilityLabel={age}>
                <Text style={isSel ? s.textSel : s.text}>{age}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Themed>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { width: '100%', alignItems: 'center', marginBottom: 10 },
  hint:    { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 },
  outer:   { width: '100%', maxWidth: 280, overflow: 'hidden', position: 'relative' },
  line:    { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(46,139,87,0.6)', zIndex: 3 },
  fadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '38%', backgroundColor: 'rgba(8,8,15,0.92)', zIndex: 2 },
  fadeBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', backgroundColor: 'rgba(8,8,15,0.92)', zIndex: 2 },
  item:    { alignItems: 'center', justifyContent: 'center' },
  text:    { fontSize: 15, color: '#fff', fontWeight: '400' },
  textSel: { fontSize: 19, color: '#a5d6a7', fontWeight: '700' },
});
