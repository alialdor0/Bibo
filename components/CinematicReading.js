import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Modal } from 'react-native';
import Avatar from './Avatar';

var Speech = null;
try { Speech = require('expo-speech'); } catch (e) {}

function speakLine(text, onDone) {
  if (!Speech) { if (onDone) onDone(); return; }
  Speech.stop();
  Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 0.82, onDone: onDone || (() => {}) });
}

/**
 * القراءة السينمائية — عرض نص الحلقة كامل (full_episode) بشكل كتاب أنيق،
 * بزرار استماع لكل سطر. بتتفتح بعد إنهاء الحلقة كمكافأة/مراجعة.
 */
export default function CinematicReading({ visible, episode, lang, onClose }) {
  const [playingIdx, setPlayingIdx] = useState(null);
  if (!episode) return null;

  const isAr = lang === 'ar';
  const full = episode.full_episode || {};
  const lines = episode.lines || [];
  const texts = full.text || lines.map(l => l.text);

  const play = (idx, text) => {
    setPlayingIdx(idx);
    speakLine(text, () => setPlayingIdx(null));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} accessibilityRole="button">
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={s.headerLabel}>{isAr ? 'قراءة سينمائية' : 'Cinematic Reading'}</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={s.body}>
          <View style={s.titleCard}>
            <Text style={s.filmIcon}>🎬</Text>
            <Text style={s.title}>{isAr ? episode.title_arabic : episode.title}</Text>
            <Text style={s.subtitle}>{full.hero}{full.city ? ' · ' + full.city : ''}</Text>
            {full.partner ? (
              <View style={s.castRow}>
                <Avatar name={full.partner} size={32} />
                <Text style={s.castTxt}>{isAr ? 'وبطولة' : 'Also starring'} {full.partner}</Text>
              </View>
            ) : null}
          </View>

          {texts.map((txt, i) => (
            <View key={String(i)} style={s.pageCard}>
              <View style={s.pageNum}><Text style={s.pageNumTxt}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.pageEn}>{txt}</Text>
                <Text style={s.pageAr}>{lines[i]?.arabic}</Text>
              </View>
              <TouchableOpacity style={s.pagePlayBtn} onPress={() => play(i, txt)} accessibilityRole="button">
                <Text style={s.pagePlayTxt}>{playingIdx === i ? '🔊' : '▶️'}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={s.theEndCard}>
            <Text style={s.theEndTxt}>{isAr ? 'النهاية 🎬' : 'The End 🎬'}</Text>
          </View>

          <TouchableOpacity style={s.doneBtn} onPress={onClose}>
            <Text style={s.doneBtnTxt}>{isAr ? 'إغلاق' : 'Close'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#08080f' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  closeBtn:     { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:     { color: '#fff', fontSize: 13 },
  headerLabel:  { color: '#fff', fontWeight: '800', fontSize: 14 },
  body:         { padding: 18, paddingBottom: 50 },

  titleCard:    { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 18, padding: 24, marginBottom: 20 },
  filmIcon:     { fontSize: 34, marginBottom: 8 },
  title:        { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle:     { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6 },
  castRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  castTxt:      { color: 'rgba(255,255,255,0.6)', fontSize: 12 },

  pageCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, marginBottom: 10 },
  pageNum:      { width: 22, height: 22, borderRadius: 11, backgroundColor: '#2E8B57', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  pageNumTxt:   { color: '#fff', fontSize: 11, fontWeight: '800' },
  pageEn:       { color: '#fff', fontSize: 14, lineHeight: 21 },
  pageAr:       { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 19, marginTop: 3 },
  pagePlayBtn:  { padding: 4 },
  pagePlayTxt:  { fontSize: 18 },

  theEndCard:   { alignItems: 'center', paddingVertical: 24 },
  theEndTxt:    { color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  doneBtn:      { backgroundColor: '#1B3A6B', borderRadius: 13, paddingVertical: 13, alignItems: 'center' },
  doneBtnTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});
