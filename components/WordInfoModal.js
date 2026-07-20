import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { Themed, inkColor } from './Themed';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

/**
 * مودال "معلومات الكلمة" — يعرض بيانات المفردة الكاملة (نطق، مقاطع،
 * نوع نحوي، مستوى) لما المستخدم يدوس على أيقونة ℹ️.
 *
 * Props: visible, word (كائن vocabulary كامل), lang, onClose, onPlay, isFavorite, onToggleFavorite
 */
export default function WordInfoModal({ visible, word, lang, onClose, onPlay, isFavorite, onToggleFavorite }) {
  const { theme } = useApp();
  if (!word) return null;
  const isAr = lang === 'ar';
  const displayWord = word.word || word.en;
  const syllableList = word.syllables && word.syllables.length ? word.syllables : [displayWord];
  const stressIdx = (word.stress || 1) - 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Themed>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel={isAr ? 'إغلاق' : 'Close'}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>

          {onToggleFavorite ? (
            <TouchableOpacity
              style={s.favBtn}
              onPress={onToggleFavorite}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? (isAr ? 'إزالة من المفضلة' : 'Remove from favorites') : (isAr ? 'إضافة إلى المفضلة' : 'Add to favorites')}
            >
              <Text style={s.favTxt}>{isFavorite ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={s.emoji}>{word.emoji}</Text>
          <Text style={s.word}>{displayWord}</Text>
          <Text style={s.phonetic}>{word.phonetic}</Text>

          <TouchableOpacity style={s.playBtn} onPress={onPlay} accessibilityRole="button">
            <Text style={s.playTxt}>🔊 {isAr ? 'استمع' : 'Listen'}</Text>
          </TouchableOpacity>

          <View style={s.divider} />

          <Row label={isAr ? 'المعنى' : 'Meaning'}       value={word.arabic || word.ar} />
          <Row label={isAr ? 'النطق' : 'Pronunciation'}  value={word.pronunciation || word.pron} />

          {syllableList.length > 1 ? (
            <View style={s.syllableRow}>
              <Text style={s.rowLabel}>{isAr ? 'المقاطع' : 'Syllables'}</Text>
              <View style={s.syllableChips}>
                {syllableList.map((syl, i) => (
                  <View key={String(i)} style={[s.sylChip, i === stressIdx ? s.sylChipStressed : null]}>
                    <Text style={[s.sylChipTxt, i === stressIdx ? s.sylChipTxtStressed : null]}>{syl}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <Row label={isAr ? 'نوع الكلمة' : 'Word type'} value={word.grammar || word.word_type} />
          <Row label={isAr ? 'المستوى' : 'Level'}        value={word.difficulty} />
        </Themed>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:       { width: '100%', maxWidth: 340, backgroundColor: '#12121c', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 22, alignItems: 'center' },
  closeBtn:   { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:   { color: '#fff', fontSize: 14 },
  favBtn:     { position: 'absolute', top: 12, left: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,179,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  favTxt:     { fontSize: 16, color: '#FFB300' },
  emoji:      { fontSize: 40, marginTop: 6 },
  word:       { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 6 },
  phonetic:   { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  playBtn:    { marginTop: 12, backgroundColor: '#2E8B57', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 9 },
  playTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  divider:    { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  row:        { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  rowLabel:   { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  rowValue:   { color: '#fff', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  syllableRow:      { width: '100%', paddingVertical: 7 },
  syllableChips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, justifyContent: 'flex-end' },
  sylChip:          { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  sylChipStressed:  { borderColor: '#FFB300', backgroundColor: 'rgba(255,179,0,0.15)' },
  sylChipTxt:       { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  sylChipTxtStressed:{ color: '#FFB300', fontWeight: '800' },
});
