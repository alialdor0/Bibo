import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions, Animated } from 'react-native';
import ThemedSafeArea from './Themed';
import Avatar from './Avatar';
import { playTrackAmbient } from '../utils/ambientMusic';

var Speech = null;
try { Speech = require('expo-speech'); } catch (e) {}

function speakLine(text, onDone) {
  if (!Speech) { if (onDone) onDone(); return; }
  Speech.stop();
  Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 0.82, onDone: onDone || (() => {}) });
}

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * القراءة السينمائية — عرض القصة كتجربة ملء الشاشة، صفحة واحدة (سطر واحد) في
 * كل مرة بخط كبير وتنقّل بالسحب أفقيًا (زي عرض قصص حقيقي)، بدل قائمة تمرير
 * عادية. بتتفتح بعد إنهاء الحلقة كمكافأة/مراجعة (episode)، أو من المكتبة
 * لقراءة كتاب المسار كله تراكميًا من أول فصل لآخر فصل خلّصه المستخدم (chapters).
 *
 * Props:
 *  - episode: بيانات حلقة واحدة كاملة (للمراجعة فور إنهاء الحلقة)
 *  - chapters: مصفوفة فصول [{episodeId, title, titleAr, lines:[{text}]}] (لقراءة الكتاب كله من المكتبة)
 *  - bookTitle / bookTitleAr: عنوان الكتاب/المسار (يُستخدم مع chapters فقط)
 */
export default function CinematicReading({ visible, episode, chapters, bookTitle, bookTitleAr, lang, trackId, onClose }) {
  const [playingIdx, setPlayingIdx] = useState(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const autoPlayRef = useRef(false); // نتحقق منه فورًا من غير انتظار إعادة الرندر
  const programmaticScrollRef = useRef(false); // نميّز التنقل التلقائي عن سحب المستخدم اليدوي
  const listRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const stopFullStoryPlayback = () => {
    autoPlayRef.current = false;
    setAutoPlaying(false);
    if (Speech) Speech.stop();
    setPlayingIdx(null);
  };

  useEffect(() => {
    if (visible) {
      setPageIdx(0);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      if (trackId) playTrackAmbient(trackId);
    } else {
      stopFullStoryPlayback();
    }
    return () => { if (Speech) Speech.stop(); autoPlayRef.current = false; };
  }, [visible, trackId]);

  const isMultiChapter = Array.isArray(chapters) && chapters.length > 0;
  if (!episode && !isMultiChapter) return null;

  const isAr = lang === 'ar';

  // ── بناء الصفحات: إما من فصول الكتاب المتراكم، أو من حلقة واحدة (السلوك القديم) ──
  let pages = [];
  let lineCount = 0;
  if (isMultiChapter) {
    pages.push({ type: 'bookIntro' });
    chapters.forEach((ch, chIdx) => {
      pages.push({ type: 'chapterIntro', title: ch.title, titleAr: ch.titleAr, chapterNum: chIdx + 1, totalChapters: chapters.length });
      (ch.lines || []).forEach((l) => {
        pages.push({ type: 'line', text: l.text, idx: lineCount });
        lineCount += 1;
      });
    });
  } else {
    const full = episode.full_episode || {};
    const lines = episode.lines || [];
    const texts = full.text || lines.map(l => l.text);
    pages.push({ type: 'intro', full, title: episode.title, titleAr: episode.title_arabic });
    texts.forEach((txt, i) => { pages.push({ type: 'line', text: txt, idx: i }); lineCount += 1; });
  }
  pages.push({ type: 'end' });

  const play = (idx, text) => {
    if (autoPlayRef.current) stopFullStoryPlayback(); // الاستماع لسطر واحد يدويًا يوقف التشغيل الكامل
    setPlayingIdx(idx);
    speakLine(text, () => setPlayingIdx(null));
  };

  const goTo = (i, programmatic = false) => {
    if (i < 0 || i >= pages.length) return;
    if (programmatic) programmaticScrollRef.current = true;
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  const onMomentumEnd = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setPageIdx(i);
    if (!programmaticScrollRef.current && autoPlayRef.current) {
      stopFullStoryPlayback(); // المستخدم سحب الشاشة يدويًا أثناء التشغيل — نوقف التشغيل التلقائي
    }
    programmaticScrollRef.current = false;
  };

  /** يسمّع صفحات القصة (الأسطر فقط) بالتتابع، وينقل الصفحة المعروضة تلقائيًا مع كل سطر */
  const playFromPageIndex = (idx) => {
    if (!autoPlayRef.current) return;
    if (idx >= pages.length) { stopFullStoryPlayback(); return; }
    const page = pages[idx];
    if (page.type !== 'line') {
      goTo(idx, true);
      setTimeout(() => playFromPageIndex(idx + 1), 600);
      return;
    }
    goTo(idx, true);
    setPlayingIdx(page.idx);
    speakLine(page.text, () => {
      if (autoPlayRef.current) playFromPageIndex(idx + 1);
    });
  };

  /** زر "استماع للقصة كاملة" — يبدأ من الصفحة الحالية (أو أول سطر لو كنا في صفحة عنوان) */
  const toggleFullStoryPlayback = () => {
    if (autoPlaying) {
      stopFullStoryPlayback();
      return;
    }
    autoPlayRef.current = true;
    setAutoPlaying(true);
    const startIdx = pages[pageIdx] && pages[pageIdx].type === 'line' ? pageIdx : pages.findIndex(p => p.type === 'line');
    playFromPageIndex(startIdx >= 0 ? startIdx : 0);
  };

  const renderPage = ({ item, index }) => {
    if (item.type === 'bookIntro') {
      return (
        <View style={[s.page, { width: SCREEN_W }]}>
          <View style={s.titleCard}>
            <Text style={s.filmIcon}>📚</Text>
            <Text style={s.title}>{isAr ? bookTitleAr : bookTitle}</Text>
            <Text style={s.subtitle}>{chapters.length} {isAr ? 'فصلًا' : chapters.length === 1 ? 'chapter' : 'chapters'}</Text>
            <Text style={s.swipeHint}>{isAr ? 'اسحب للبدء →' : 'Swipe to begin →'}</Text>
          </View>
        </View>
      );
    }
    if (item.type === 'chapterIntro') {
      return (
        <View style={[s.page, { width: SCREEN_W }]}>
          <View style={s.titleCard}>
            <Text style={s.filmIcon}>🎬</Text>
            <Text style={s.chapterNumTxt}>{isAr ? `الفصل ${item.chapterNum}` : `Chapter ${item.chapterNum}`} · {item.chapterNum}/{item.totalChapters}</Text>
            <Text style={s.title}>{isAr ? item.titleAr : item.title}</Text>
          </View>
        </View>
      );
    }
    if (item.type === 'intro') {
      return (
        <View style={[s.page, { width: SCREEN_W }]}>
          <View style={s.titleCard}>
            <Text style={s.filmIcon}>🎬</Text>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.titleAr}>{item.titleAr}</Text>
            <Text style={s.subtitle}>{item.full.hero}{item.full.city ? ' · ' + item.full.city : ''}</Text>
            {item.full.partner ? (
              <View style={s.castRow}>
                <Avatar name={item.full.partner} size={32} />
                <Text style={s.castTxt}>{isAr ? 'وبطولة' : 'Also starring'} {item.full.partner}</Text>
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
    // سطر نص عادي — إنجليزي بس (بدون ترجمة عربية بالقراءة السينمائية)
    return (
      <View style={[s.page, { width: SCREEN_W }]}>
        <View style={s.pageCard}>
          <Text style={s.pageNumTxt}>{item.idx + 1} / {lineCount}</Text>
          <Text style={s.pageEn}>{item.text}</Text>
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
      <ThemedSafeArea style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} accessible={true} accessibilityRole="button" accessibilityLabel={isAr ? 'إغلاق' : 'Close'}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={s.headerLabel}>{isAr ? 'قراءة سينمائية' : 'Cinematic Reading'}</Text>
          <TouchableOpacity
            onPress={toggleFullStoryPlayback}
            style={s.listenAllBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={autoPlaying ? (isAr ? 'إيقاف الاستماع' : 'Stop listening') : (isAr ? 'استماع للقصة كاملة' : 'Listen to full story')}
          >
            <Text style={s.listenAllBtnTxt}>{autoPlaying ? '⏸' : '🔊'}</Text>
          </TouchableOpacity>
        </View>

        {isMultiChapter ? (
          <View style={s.progressBarTrack}>
            <View style={[s.progressBarFill, { width: `${Math.round(((pageIdx + 1) / pages.length) * 100)}%` }]} />
          </View>
        ) : (
          <View style={s.progressRow}>
            {pages.map((_, i) => (
              <View key={String(i)} style={[s.progressDot, i === pageIdx ? s.progressDotActive : null]} />
            ))}
          </View>
        )}

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
      </ThemedSafeArea>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#08080f' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  closeBtn:     { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:     { color: '#fff', fontSize: 13 },
  headerLabel:  { color: '#fff', fontWeight: '800', fontSize: 14 },
  listenAllBtn:    { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(46,139,87,0.18)', alignItems: 'center', justifyContent: 'center' },
  listenAllBtnTxt: { fontSize: 14 },

  progressRow:  { flexDirection: 'row', gap: 4, paddingHorizontal: 16, marginBottom: 8 },
  progressDot:  { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressDotActive: { backgroundColor: '#2E8B57' },
  progressBarTrack: { height: 4, marginHorizontal: 16, marginBottom: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressBarFill:  { height: '100%', borderRadius: 2, backgroundColor: '#2E8B57' },
  chapterNumTxt: { color: '#2E8B57', fontSize: 13, fontWeight: '700', marginBottom: 10 },

  page:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },

  titleCard:    { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 18, padding: 28, width: '100%' },
  filmIcon:     { fontSize: 40, marginBottom: 10 },
  title:        { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  titleAr:      { color: 'rgba(255,255,255,0.55)', fontSize: 15, textAlign: 'center', marginTop: 4 },
  subtitle:     { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6 },
  castRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  castTxt:      { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  swipeHint:    { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 22 },

  pageCard:     { alignItems: 'center', width: '100%' },
  pageNumTxt:   { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '700', marginBottom: 22 },
  pageEn:       { color: '#fff', fontSize: 22, lineHeight: 34, textAlign: 'center', fontWeight: '600' },
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
