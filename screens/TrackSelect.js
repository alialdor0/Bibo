import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, SafeAreaView } from 'react-native';
import { useApp } from '../context/AppContext';
import { t, TRACKS } from '../data';

export default function TrackSelect({ onSelect }) {
  const { lang, setTrack } = useApp();
  const T = (k) => t(k, lang);

  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSelect = (track) => {
    setSelected(track);
  };

  const handleConfirm = () => {
    if (!selected) return;
    setConfirmed(true);
    setTrack(selected);
    setTimeout(() => onSelect(selected), 700);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={s.appName}>Bibo</Text>
          <Text style={s.subtitle}>Choose Your Dramatic Track</Text>
          <Text style={s.hint}>You can change this later from Settings</Text>
        </Animated.View>

        {TRACKS.map((track) => {
          const isSel = selected?.id === track.id;
          return (
            <Animated.View key={track.id} style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <TouchableOpacity
                style={[s.card, { borderColor: isSel ? track.color : 'rgba(255,255,255,0.07)' }, isSel ? { backgroundColor: track.bg } : null]}
                onPress={() => handleSelect(track)}
                accessibilityRole="button"
                accessibilityLabel={track.name}>
                <View style={s.cardTop}>
                  <View style={[s.iconWrap, isSel ? { backgroundColor: track.color + '22', borderColor: track.color + '66' } : null]}>
                    <Text style={s.icon}>{track.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.name, isSel ? { color: track.color } : null]}>{track.name}</Text>
                    <Text style={s.nameAr}>{track.nameAr}</Text>
                  </View>
                  {isSel ? (
                    <View style={[s.checkCircle, { backgroundColor: track.color + '33', borderColor: track.color }]}>
                      <Text style={[s.check, { color: track.color }]}>✓</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={s.desc}>{track.desc}</Text>
                <Text style={[s.cinematic, isSel ? { color: track.color + 'cc' } : null]}>🎬 {track.cinematic}</Text>
                {isSel ? (
                  <View style={s.soundsRow}>
                    {track.sounds.map(snd => (
                      <View key={snd} style={[s.soundChip, { borderColor: track.color + '44', backgroundColor: track.color + '15' }]}>
                        <Text style={[s.soundTxt, { color: track.color }]}>{snd}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {selected ? (
          <View style={[s.preview, { borderColor: selected.color + '44' }]}>
            <Text style={[s.previewLabel, { color: selected.color }]}>{selected.icon} Story Preview</Text>
            <Text style={s.previewDesc}>{selected.desc}</Text>
            <View style={[s.previewLine, { borderLeftColor: selected.color + '66' }]}>
              <Text style={s.previewTxt}>{selected.preview}</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[s.btn, { opacity: selected ? 1 : 0.3 }, selected ? { backgroundColor: selected.color + 'cc' } : { backgroundColor: 'rgba(255,255,255,0.08)' }]}
          onPress={handleConfirm}
          disabled={!selected}
          accessibilityRole="button">
          <Text style={s.btnTxt}>
            {confirmed ? 'Preparing your story...' : selected ? 'Start ' + selected.name + ' →' : 'Choose a track first'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#08080f' },
  content:    { padding: 20, paddingBottom: 40, alignItems: 'center' },
  header:     { alignItems: 'center', marginBottom: 24, width: '100%' },
  appName:    { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 4, marginBottom: 6 },
  subtitle:   { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  hint:       { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  card:       { width: '100%', maxWidth: 400, borderRadius: 16, borderWidth: 1, marginBottom: 10, padding: 16, backgroundColor: 'rgba(255,255,255,0.02)' },
  cardTop:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconWrap:   { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  icon:       { fontSize: 26 },
  name:       { fontSize: 15, fontWeight: '700', color: '#fff' },
  nameAr:     { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  checkCircle:{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  check:      { fontSize: 16, fontWeight: '900' },
  desc:       { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20, marginBottom: 8 },
  cinematic:  { fontSize: 11, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', marginBottom: 8 },
  soundsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  soundChip:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  soundTxt:   { fontSize: 11, fontWeight: '600' },
  preview:    { width: '100%', maxWidth: 400, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderRadius: 14, marginTop: 6, marginBottom: 4, padding: 14 },
  previewLabel:{ fontSize: 12, fontWeight: '700', marginBottom: 8 },
  previewDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, lineHeight: 20 },
  previewLine: { borderLeftWidth: 3, paddingLeft: 10 },
  previewTxt:  { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 22 },
  btn:        { width: '100%', maxWidth: 400, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 16 },
  btnTxt:     { color: '#fff', fontSize: 15, fontWeight: '700' },
});
