import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PALETTE = ['#2E8B57', '#1B3A6B', '#8B4513', '#7B2D8B', '#B8860B', '#2F6F6F'];

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) % PALETTE.length;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/**
 * أفاتار بسيط بحرف أول الاسم ولون ثابت لكل اسم — مفيد لعرض شخصيات
 * القصة المساعدة (partners) قبل ما نحتاج صور حقيقية ليهم.
 */
export default function Avatar({ name = '?', size = 44 }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const bg = colorFor(name);
  return (
    <View style={[s.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg + '33', borderColor: bg }]}>
      <Text style={[s.txt, { fontSize: size * 0.42, color: bg }]}>{initial}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  circle: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  txt:    { fontWeight: '800' },
});
