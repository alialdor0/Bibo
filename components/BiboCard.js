import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function BiboMsg({ text, color }) {
  return (
    <View style={[s.wrap, { borderColor: (color || '#2E8B57') + '44' }]}>
      <View style={[s.bird, { borderColor: (color || '#2E8B57') + '66' }]}>
        <Text style={s.birdEmoji}>🐦</Text>
      </View>
      <View style={s.content}>
        <Text style={[s.name, { color: color || '#2E8B57' }]}>Bibo</Text>
        <Text style={s.text}>{text}</Text>
      </View>
    </View>
  );
}

export function PageHeader({ title, onBack, backLabel, right }) {
  return (
    <View style={s.header}>
      {onBack ? (
        <TouchableOpacity style={s.backBtn} onPress={onBack} accessibilityRole="button">
          <Text style={s.backTxt}>{'← ' + (backLabel || 'Back')}</Text>
        </TouchableOpacity>
      ) : <View style={s.spacer} />}
      <Text style={s.title}>{title}</Text>
      {right || <View style={s.spacer} />}
    </View>
  );
}

export function GemsBadge({ gems }) {
  return (
    <View style={s.gemsBadge}>
      <Text style={s.gemsIcon}>💎</Text>
      <Text style={s.gemsVal}>{gems}</Text>
    </View>
  );
}

export function StationeryBar({ stationery }) {
  const { pen, eraser, pages } = stationery;
  return (
    <View style={s.statBar}>
      <View style={s.statItem}>
        <Text style={s.statIcon}>🖊️</Text>
        <View style={s.inkBarBg}>
          <View style={[s.inkBarFill, { width: Math.min(100, pen.inkLeft) + '%' }]} />
        </View>
      </View>
      <View style={s.statItem}>
        <Text style={s.statIcon}>🧹</Text>
        <Text style={s.statVal}>{eraser.uses}</Text>
      </View>
      <View style={s.statItem}>
        <Text style={s.statIcon}>📄</Text>
        <Text style={s.statVal}>{pages.left}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:      { flexDirection: 'row', backgroundColor: 'rgba(46,139,87,0.08)', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12, gap: 10 },
  bird:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0a150a', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  birdEmoji: { fontSize: 22 },
  content:   { flex: 1 },
  name:      { fontSize: 11, marginBottom: 3 },
  text:      { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  title:     { fontSize: 16, fontWeight: '700', color: '#fff' },
  backBtn:   { padding: 8 },
  backTxt:   { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  spacer:    { width: 60 },
  gemsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,179,0,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,179,0,0.3)' },
  gemsIcon:  { fontSize: 14 },
  gemsVal:   { fontSize: 13, fontWeight: '700', color: '#FFB300' },
  statBar:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 8 },
  statItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statIcon:  { fontSize: 14 },
  statVal:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  inkBarBg:  { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  inkBarFill:{ height: '100%', backgroundColor: '#2E8B57', borderRadius: 2 },
});
