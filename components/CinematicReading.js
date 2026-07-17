import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Modal, FlatList, Dimensions, Animated } from 'react-native';
import Avatar from './Avatar';

var Speech = null;
try { Speech = require('expo-speech'); } catch (e) {}

function speakLine(text, onDone) {
  if (!Speech) { if (onDone) onDone(); return; }
  Speech.stop();
  Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 0.82, onDone: onDone || (() => {}) });
}

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * القراءة السينمائية — عرض القصة كاملة كتجربة ملء الشاشة، صفحة واحدة (سطر
 * واحد) في كل مرة بخط كبير وتنقّل بالسحب أفقيًا (زي عرض قصص حقيقي)، بدل
 * قائمة تمرير عادية. بتتفتح بعد إنهاء الحلقة كمكافأة/مراجعة.
 */
export default function CinematicReading({ visible, episode, lang, onClose }) {
  const [playingIdx, setPlayingIdx] = useState(null);
  const [pageIdx, setPageIdx] = useState(0);
  const listRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPageIdx(0);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } else if (Speech) {
      Speech.stop();
    }
  }, [visible]);

  if (!episode) return null;

  const isAr = lang === 'ar';
  const full = episode.full_episode || {};
  const lines = episode.lines || [];
  const texts = full.text || lines.map(l => l.text);

  // الصفحات: مقدمة (٠) + سطر لكل صفحة + خاتمة (النهاية)
  const pages = [
    { type: 'intro' },
    ...texts.map((txt, i) => ({ type: 'line', text: txt, arabic: lines[i]?.arabic, idx: i })),
    { type: 'end' },
  ];

  const play = (idx, text) => {
    setPlayingIdx(idx);
    speakLine(text, () => setPlayingIdx(null));
  };

  const goTo = (i) => {
    if (i < 0 || i >= pages.length) return;
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  const onMomentumEnd = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setPageIdx(i);
  };

  const renderPage = ({ item, index }) => {
    if (item.type === 'intro') {
      return (
        <View style={[s.page, { width: SCREEN_W }]}>
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
            <Text style={s.swipeHint}>{isAr ? 'اسحب للبدء →' : 'Swipe to begin →'}</Text>
          </View>
        </View>
      );
    }
    if (item.type === 'end') {
      return (
        <View style={[s.page, { width: SCREEN_W }]}>
          <View style={s.theEndCard}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🎬</Text>
            <Text style={s.theEndTxt}>{isAr ? 'النهاية' : 'The End'}</Text>
            <TouchableOpacity style={s.doneBtn} onPress={onClose} accessible={true} accessibilityRole="button">
              <Text style={s.doneBtnTxt}>{isAr ? 'إغلاق' : 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={[s.page, { width: SCREEN_W }]}>
        <View style={s.pageCard}>
          <Text style={s.pageNumTxt}>{item.idx + 1} / {texts.length}</Text>
          <Text style={s.pageEn}>{item.text}</Text>
          <Text style={s.pageAr}>{item.arabic}</Text>
          <TouchableOpacity
            style={s.pagePlayBtn}
            onPress={() => play(item.idx, item.text)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isAr ? 'استمع لهذا السطر' : 'Listen to this line'}
          >
            <Text style={s.pagePlayTxt}>{playingIdx === item.idx ? '🔊 ' + (isAr ? 'جارٍ النطق...' : 'Playing...') : '▶️ ' + (isAr ? 'استماع' : 'Listen')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} accessible={true} accessibilityRole="button" accessibilityLabel={isAr ? 'إغلاق' : 'Close'}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={s.headerLabel}>{isAr ? 'قراءة سينمائية' : 'Cinematic Reading'}</Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={s.progressRow}>
          {pages.map((_, i) => (
            <View key={String(i)} style={[s.progressDot, i === pageIdx ? s.progressDotActive : null]} />
          ))}
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            ref={listRef}
            data={pages}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderPage}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
            getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          />
        </Animated.View>

        <View style={s.navRow}>
          <TouchableOpacity
            style={[s.navBtn, pageIdx === 0 ? s.navBtnDisabled : null]}
            onPress={() => goTo(pageIdx - 1)}
            disabled={pageIdx === 0}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isAr ? 'السطر السابق' : 'Previous line'}
          >
            <Text style={s.navBtnTxt}>{isAr ? '← السابق' : '← Previous'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.navBtn, pageIdx === pages.length - 1 ? s.navBtnDisabled : null]}
            onPress={() => goTo(pageIdx + 1)}
            disabled={pageIdx === pages.length - 1}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isAr ? 'السطر التالي' : 'Next line'}
          >
            <Text style={s.navBtnTxt}>{isAr ? 'التالي →' : 'Next →'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#08080f' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  closeBtn:     { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:     { color: '#fff', fontSize: 13 },
  headerLabel:  { color: '#fff', fontWeight: '800', fontSize: 14 },

  progressRow:  { flexDirection: 'row', gap: 4, paddingHorizontal: 16, marginBottom: 8 },
  progressDot:  { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressDotActive: { backgroundColor: '#2E8B57' },

  page:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },

  titleCard:    { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 18, padding: 28, width: '100%' },
  filmIcon:     { fontSize: 40, marginBottom: 10 },
  title:        { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle:     { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6 },
  castRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  castTxt:      { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  swipeHint:    { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 22 },

  pageCard:     { alignItems: 'center', width: '100%' },
  pageNumTxt:   { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '700', marginBottom: 22 },
  pageEn:       { color: '#fff', fontSize: 22, lineHeight: 34, textAlign: 'center', fontWeight: '600' },
  pageAr:       { color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 26, marginTop: 16, textAlign: 'center' },
  pagePlayBtn:  { marginTop: 30, backgroundColor: 'rgba(46,139,87,0.15)', borderWidth: 1, borderColor: 'rgba(46,139,87,0.4)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  pagePlayTxt:  { color: '#a5d6a7', fontSize: 13, fontWeight: '700' },

  theEndCard:   { alignItems: 'center' },
  theEndTxt:    { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: '700', letterSpacing: 1, marginBottom: 24 },
  doneBtn:      { backgroundColor: '#1B3A6B', borderRadius: 13, paddingVertical: 13, paddingHorizontal: 32 },
  doneBtnTxt:   { color: '#fff', fontSize: 15, fontWeight: '700' },

  navRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  navBtn:       { paddingVertical: 10, paddingHorizontal: 16 },
  navBtnDisabled: { opacity: 0.25 },
  navBtnTxt:    { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700' },
});
