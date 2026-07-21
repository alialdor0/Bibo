import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import ThemedSafeArea from '../components/Themed';
import { t, COVER_STICKERS, BOOK_COVERS } from '../data';
import { GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import BottomNav from '../components/BottomNav';
import CinematicReading from '../components/CinematicReading';
import { stopAmbient } from '../utils/ambientMusic';
import { exportBookPDF, shareBookAchievement } from '../utils/libraryExport';

function BookCard({ book, lang, custom, onPress }) {
  const title = lang === 'ar' ? book.trackNameAr : book.trackName;
  const { accuracy, total: answersTotal } = aggregateAccuracy(book);
  const hasAccuracy = typeof accuracy === 'number' && answersTotal > 0;
  const selectedCover = BOOK_COVERS.find(c => c.id === custom?.coverId);
  const color = selectedCover ? selectedCover.colors[0] : (book.color || '#2E8B57');
  const stickers = custom?.stickers || [];
  const stickerEmojis = stickers.map(id => COVER_STICKERS.find(st => st.id === id)).filter(st => st && st.type === 'emoji').map(st => st.emoji);
  const wordCount = aggregateWords(book).length;
  const chapterCount = (book.chapters || []).length;
  const readCount = maxReadCount(book);
  return (
    <LinearGradient
      colors={hasAccuracy ? masteryGradient(accuracy) : [color + '55', color + '30']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.bookGradientBorder}
    >
      <TouchableOpacity style={[s.book, { backgroundColor: color + '14' }]} onPress={onPress}>
        {hasAccuracy ? (
          <View style={[s.accBadge, { backgroundColor: accuracyColor(accuracy) }]}>
            <Text style={s.accBadgeTxt}>{accuracy}%</Text>
          </View>
        ) : null}
        <Text style={s.bookIcon}>{book.icon}</Text>
        <Text style={s.bookTitle} numberOfLines={2}>{title}</Text>
        <Text style={s.bookMeta}>
          {chapterCount} {lang === 'ar' ? (chapterCount === 1 ? 'فصل' : 'فصول') : chapterCount === 1 ? 'chapter' : 'chapters'}
          {' · '}{wordCount} {lang === 'ar' ? 'كلمة' : 'words'}
        </Text>
        {stickerEmojis.length ? (
          <Text style={s.bookStickers}>{stickerEmojis.join(' ')}</Text>
        ) : null}
        {readCount > 1 ? (
          <View style={s.readBadge}><Text style={s.readBadgeTxt}>×{readCount}</Text></View>
        ) : null}
      </TouchableOpacity>
    </LinearGradient>
  );
}

/** بطاقة رف خاصة (مو كتاب حلقة عادي) — تفتح شاشة تانية بالتطبيق، زي القاموس */
function ShelfLinkCard({ icon, title, subtitle, color, onPress }) {
  return (
    <TouchableOpacity style={[s.book, s.shelfLinkBook, { borderColor: color + '55', backgroundColor: color + '14' }]} onPress={onPress}>
      <Text style={s.bookIcon}>{icon}</Text>
      <Text style={s.bookTitle} numberOfLines={2}>{title}</Text>
      <Text style={s.bookMeta}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

/** يحوّل الثواني لصيغة "س دقيقة و ث ثانية" بحسب اللغة */
function formatDuration(sec, lang) {
  if (sec == null || isNaN(sec)) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (lang === 'ar') {
    if (m <= 0) return `${s} ثانية`;
    return `${m} د ${s} ث`;
  }
  if (m <= 0) return `${s}s`;
  return `${m}m ${s}s`;
}

/** كل الكلمات الفريدة المتجمّعة من كل فصول الكتاب (بدون تكرار) */
function aggregateWords(book) {
  const seen = new Map();
  for (const ch of book.chapters || []) {
    for (const w of ch.words || []) {
      if (w && !seen.has(w.id)) seen.set(w.id, w);
    }
  }
  return Array.from(seen.values());
}
/** نسبة الدقة الإجمالية عبر كل فصول الكتاب (null لو مفيش بيانات إجابات) */
function aggregateAccuracy(book) {
  let correct = 0, total = 0;
  for (const ch of book.chapters || []) {
    correct += ch.correctAnswers || 0;
    total += ch.totalAnswers || 0;
  }
  return total > 0 ? { accuracy: Math.round((correct / total) * 100), total } : { accuracy: null, total: 0 };
}
const aggregateGems = (book) => (book.chapters || []).reduce((n, ch) => n + (ch.gemsEarned || 0), 0);
const aggregateTimeSpent = (book) => (book.chapters || []).reduce((n, ch) => n + (ch.timeSpentSec || 0), 0);
const latestCompletedAt = (book) => (book.chapters || []).reduce((max, ch) => Math.max(max, ch.completedAt || 0), 0);
const maxReadCount = (book) => (book.chapters || []).reduce((max, ch) => Math.max(max, ch.readCount || 1), 1);

/** لون تقييم الدقة: أخضر ممتاز / أصفر متوسط / برتقالي محتاج تحسين */
function accuracyColor(acc) {
  if (acc >= 85) return '#a5d6a7';
  if (acc >= 60) return '#ffd54f';
  return '#ff8a65';
}

/** تدرج لوني لإطار غلاف الكتاب حسب مستوى الإتقان (الدقة) — كل مستوى بلونين متدرجين */
function masteryGradient(acc) {
  if (acc == null) return ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)'];
  if (acc >= 85) return ['#2E8B57', '#a5d6a7']; // إتقان عالي: تدرّج أخضر
  if (acc >= 60) return ['#c9a227', '#ffd54f']; // إتقان متوسط: تدرّج ذهبي
  return ['#a1341f', '#ff8a65'];                // يحتاج مراجعة: تدرّج برتقالي/أحمر
}

function BookDetail({ book, lang, onBack, onGoToStore }) {
  const { bookCovers, ownedStickers, ownedCovers, setBookCover, toggleBookSticker } = useApp();
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showCinema, setShowCinema] = useState(false);
  const [customStep, setCustomStep] = useState('cover'); // 'cover' | 'sticker' — نظام مراحل بدل الازدحام
  const title = lang === 'ar' ? book.trackNameAr : book.trackName;
  const chapters = book.chapters || [];
  const date = new Date(latestCompletedAt(book)).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
  const duration = formatDuration(aggregateTimeSpent(book), lang);
  const words = useMemo(() => aggregateWords(book), [book]);
  const { accuracy, total: answersTotal } = aggregateAccuracy(book);
  const hasAccuracy = typeof accuracy === 'number' && answersTotal > 0;
  const gemsEarned = aggregateGems(book);

  // غلاف/ملصقات الكتاب بقوا لكل مسار (trackId) مش لكل حلقة — كتاب واحد، غلاف واحد
  const custom = bookCovers[book.trackId] || {};
  const selectedCover = BOOK_COVERS.find(c => c.id === custom.coverId);
  const coverColors = selectedCover ? selectedCover.colors : [book.color || '#2E8B57', book.color || '#2E8B57'];
  const coverColor = coverColors[0];
  const appliedStickers = custom.stickers || [];
  const appliedStickerObjs = appliedStickers.map(id => COVER_STICKERS.find(st => st.id === id)).filter(Boolean);

  const handleExport = async () => {
    setExporting(true);
    const ok = await exportBookPDF(book, lang, coverColors, appliedStickerObjs);
    setExporting(false);
    if (!ok) {
      Alert.alert(

        lang === 'ar' ? 'التصدير غير متاح' : 'Export unavailable',
        lang === 'ar' ? 'يتطلب هذا بناءً أصليًا (expo-print) ليعمل، وهو غير متاح في هذه البيئة.' : 'Requires a native build (expo-print) — not available in this environment.'
      );
    }
  };

  const handleShare = async () => {
    setSharing(true);
    const ok = await shareBookAchievement(book, lang, coverColor, appliedStickerObjs);
    setSharing(false);
    if (!ok) {
      Alert.alert(
        lang === 'ar' ? 'المشاركة غير متاحة' : 'Sharing unavailable',
        lang === 'ar' ? 'يتطلب هذا بناءً أصليًا (expo-print) ليعمل، وهو غير متاح في هذه البيئة.' : 'Requires a native build (expo-print) — not available in this environment.'
      );
    }
  };

  const handleStickerTap = (sticker) => {
    toggleBookSticker(book.trackId, sticker.id);
  };

  const handleCoverSelect = (cover) => {
    setBookCover(book.trackId, cover.id);
  };

  return (
    <ThemedSafeArea style={s.safe}>
      <View style={s.detailHeader}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backTxt}>{lang === 'ar' ? '‹ رجوع' : '‹ Back'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.detailBody}>
        <View style={[s.cover, { borderColor: coverColors[1], backgroundColor: coverColors[0] + '14' }]}>
          <Text style={{ fontSize: 46 }}>{book.icon}</Text>
          {appliedStickerObjs.length ? (
            <View style={s.coverStickersRow}>
              {appliedStickerObjs.map(st => st.type === 'text' ? (
                <View key={st.id} style={s.coverTextSticker}><Text style={s.coverTextStickerTxt}>{lang === 'ar' ? st.textAr : st.text}</Text></View>
              ) : (
                <Text key={st.id} style={s.coverStickers}>{st.emoji}</Text>
              ))}
            </View>
          ) : null}
          <Text style={[s.coverTitle, { color: coverColors[0] }]}>{title}</Text>
          <Text style={s.coverSub}>
            {chapters.length} {lang === 'ar' ? (chapters.length === 1 ? 'فصل' : 'فصول') : chapters.length === 1 ? 'chapter' : 'chapters'} · {(lang === 'ar' ? 'آخر تحديث ' : 'Updated ') + date} · {words.length} {lang === 'ar' ? 'كلمة' : 'words'} · +{gemsEarned} 💎
          </Text>
        </View>

        {(duration || hasAccuracy) ? (
          <View style={s.statsCard}>
            <Text style={s.statsTitle}>{lang === 'ar' ? 'إحصائيات الكتاب' : 'Book stats'}</Text>
            <View style={s.statsRow}>
              {duration ? (
                <View style={s.statBox}>
                  <Text style={s.statIcon}>⏱️</Text>
                  <Text style={s.statVal}>{duration}</Text>
                  <Text style={s.statLbl}>{lang === 'ar' ? 'الوقت المستغرق' : 'Time spent'}</Text>
                </View>
              ) : null}
              {hasAccuracy ? (
                <View style={s.statBox}>
                  <Text style={s.statIcon}>🎯</Text>
                  <Text style={[s.statVal, { color: accuracyColor(accuracy) }]}>{accuracy}%</Text>
                  <Text style={s.statLbl}>{lang === 'ar' ? 'دقة الإجابات' : 'Answer accuracy'}</Text>
                </View>
              ) : null}
              {hasAccuracy ? (
                <View style={s.statBox}>
                  <Text style={s.statIcon}>✅</Text>
                  <Text style={s.statVal}>{answersTotal}</Text>
                  <Text style={s.statLbl}>{lang === 'ar' ? 'سؤال مُجاب' : 'Questions answered'}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <Text style={s.sectionTitle}>{lang === 'ar' ? 'فصول الكتاب' : 'Chapters'}</Text>
        <View style={s.chaptersCard}>
          {chapters.map((ch, i) => (
            <View key={String(ch.episodeId)} style={[s.chapterRow, i === chapters.length - 1 ? { borderBottomWidth: 0 } : null]}>
              <View style={s.chapterNumBadge}><Text style={s.chapterNumBadgeTxt}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.chapterTitle} numberOfLines={1}>{lang === 'ar' ? ch.titleAr : ch.title}</Text>
                <Text style={s.chapterMeta}>
                  {(ch.words || []).length} {lang === 'ar' ? 'كلمة' : 'words'}
                  {typeof ch.accuracy === 'number' ? ` · ${ch.accuracy}% ${lang === 'ar' ? 'دقة' : 'accuracy'}` : ''}
                  {ch.readCount > 1 ? ` · ×${ch.readCount}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.customCard}>
          <Text style={s.statsTitle}>🎨 {lang === 'ar' ? 'تخصيص الغلاف' : 'Customize cover'}</Text>

          {/* مؤشر المرحلة */}
          <View style={s.customStepsRow}>
            <TouchableOpacity
              style={[s.customStepBtn, customStep === 'cover' ? s.customStepBtnActive : null]}
              onPress={() => setCustomStep('cover')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={lang === 'ar' ? 'الخطوة الأولى: اختيار الغلاف' : 'Step one: choose cover'}
            >
              <Text style={[s.customStepTxt, customStep === 'cover' ? s.customStepTxtActive : null]}>{lang === 'ar' ? '١. الغلاف' : '1. Cover'}</Text>
            </TouchableOpacity>
            <Text style={s.customStepArrow}>←</Text>
            <TouchableOpacity
              style={[s.customStepBtn, customStep === 'sticker' ? s.customStepBtnActive : null]}
              onPress={() => setCustomStep('sticker')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={lang === 'ar' ? 'الخطوة الثانية: اختيار الملصقات' : 'Step two: choose stickers'}
            >
              <Text style={[s.customStepTxt, customStep === 'sticker' ? s.customStepTxtActive : null]}>{lang === 'ar' ? '٢. الملصقات' : '2. Stickers'}</Text>
            </TouchableOpacity>
          </View>

          {customStep === 'cover' ? (
            <>
              <Text style={s.customLbl}>{lang === 'ar' ? 'اختر غلافًا من أغلفتك المملوكة' : 'Choose from your owned covers'}</Text>
              <View style={s.coverOptionsRow}>
                {BOOK_COVERS.filter(c => ownedCovers.includes(c.id)).map(c => {
                  const active = selectedCover ? selectedCover.id === c.id : c.id === 'cover_green';
                  const name = lang === 'ar' ? c.nameAr : c.name;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[s.colorDot, { backgroundColor: c.colors[0], borderColor: c.colors[1] }, active ? s.colorDotActive : null]}
                      onPress={() => handleCoverSelect(c)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={name + (active ? (lang === 'ar' ? '، مُختار حاليًا' : ', currently selected') : '')}
                      accessibilityState={{ selected: active }}
                    />
                  );
                })}
              </View>
              <TouchableOpacity onPress={onGoToStore} accessible={true} accessibilityRole="button" style={s.moreLink}>
                <Text style={s.moreLinkTxt}>{lang === 'ar' ? '🛍️ المزيد من الأغلفة الاحترافية بالمتجر' : '🛍️ More professional covers in the Store'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.customLbl}>{lang === 'ar' ? 'الملصقات المملوكة (بحد أقصى 3 على الغلاف)' : 'Owned stickers (up to 3 per cover)'}</Text>
              <View style={s.stickerRow}>
                {COVER_STICKERS.filter(st => ownedStickers.includes(st.id)).map(st => {
                  const applied = appliedStickers.includes(st.id);
                  const name = lang === 'ar' ? st.nameAr : st.name;
                  return (
                    <TouchableOpacity
                      key={st.id}
                      style={[s.stickerBox, applied ? s.stickerBoxActive : null]}
                      onPress={() => handleStickerTap(st)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={name + (applied ? (lang === 'ar' ? '، مُطبَّق على الغلاف' : ', applied to cover') : '')}
                      accessibilityState={{ selected: applied }}
                    >
                      {st.type === 'text' ? (
                        <Text style={s.stickerTextBoxTxt} numberOfLines={1}>{lang === 'ar' ? st.textAr : st.text}</Text>
                      ) : (
                        <Text style={s.stickerEmoji}>{st.emoji}</Text>
                      )}
                      <Text style={s.stickerName} numberOfLines={1}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
                {COVER_STICKERS.filter(st => ownedStickers.includes(st.id)).length === 0 ? (
                  <Text style={s.noStickersTxt}>{lang === 'ar' ? 'لسه معندكش ملصقات — تقدر تشتريها من المتجر.' : "You don't own any stickers yet — buy some from the Store."}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={onGoToStore} accessible={true} accessibilityRole="button" style={s.moreLink}>
                <Text style={s.moreLinkTxt}>{lang === 'ar' ? '🛍️ المزيد من الملصقات بالمتجر' : '🛍️ More stickers in the Store'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={s.actionsRow}>
          <TouchableOpacity style={[s.actionBtn, s.actionPrimary]} onPress={handleExport} disabled={exporting}>
            {exporting ? <ActivityIndicator color="#08080f" /> : <Text style={s.actionPrimaryTxt}>📄 {lang === 'ar' ? 'تصدير PDF' : 'Export PDF'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => setShowCinema(true)} accessible={true} accessibilityRole="button">
            <Text style={s.actionTxt}>🔁 {lang === 'ar' ? 'إعادة القراءة' : 'Read again'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing ? <ActivityIndicator color="#fff" /> : <Text style={s.shareBtnTxt}>🎉 {lang === 'ar' ? 'مشاركة الإنجاز' : 'Share achievement'}</Text>}
        </TouchableOpacity>

        <Text style={s.sectionTitle}>{lang === 'ar' ? 'الكلمات التي تعلمتها' : 'Words you learned'}</Text>
        {words.map((w, i) => (
          <View key={String(w.id || i)} style={s.wordRow}>
            <Text style={s.wordEmoji}>{w.emoji || '📖'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.wordEn}>{w.word}</Text>
              <Text style={s.wordPhon}>{w.phonetic}</Text>
            </View>
            <Text style={s.wordAr}>{w.ar}</Text>
          </View>
        ))}
      </ScrollView>

      <CinematicReading
        visible={showCinema}
        chapters={chapters}
        bookTitle={book.trackName}
        bookTitleAr={book.trackNameAr}
        lang={lang}
        trackId={book.trackId}
        onClose={() => { setShowCinema(false); stopAmbient(); }}
      />
    </ThemedSafeArea>
  );
}

export default function Library({ onNav }) {
  const { lang, gems, library, bookCovers } = useApp();
  const T = (k) => t(k, lang);
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <BookDetail
        book={selected}
        lang={lang}
        onBack={() => setSelected(null)}
        onGoToStore={() => onNav('store')}
      />
    );
  }

  return (
    <ThemedSafeArea style={s.safe}>
      <View style={s.header}>
        <Text style={s.pageTitle}>📖 {T('library')}</Text>
        <GemsBadge gems={gems} />
      </View>

      {(!library || library.length === 0) ? (
        <View style={s.emptyWrap}>
          <BiboCharacter
            state="idea"
            size={92}
            message={lang === 'ar' ? 'رفّك فارغ حتى الآن! أكمل حلقتك الأولى لترى أول كتاب لك هنا 📚' : 'Your shelf is empty! Finish your first episode to see your first book here 📚'}
          />
          <TouchableOpacity style={s.emptyBtn} onPress={() => onNav('story')}>
            <Text style={s.emptyBtnTxt}>{lang === 'ar' ? 'ابدأ القراءة' : 'Start Reading'}</Text>
          </TouchableOpacity>
          <View style={[s.grid, { marginTop: 24 }]}>
            <ShelfLinkCard
              icon="📔"
              color="#7b5fd4"
              title={lang === 'ar' ? 'القاموس' : 'Dictionary'}
              subtitle={lang === 'ar' ? 'كلماتك المتقنة' : 'Your mastered words'}
              onPress={() => onNav('dict')}
            />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.shelf}>
          <BiboCharacter
            layout="row"
            size={52}
            style={{ marginBottom: 16 }}
            state="celebrate"
            message={lang === 'ar' ? `لديك ${library.length} كتاب في مكتبتك! نحن فخورون بك 🏆` : `You have ${library.length} book(s) in your library! Proud of you 🏆`}
          />
          <View style={s.grid}>
            <ShelfLinkCard
              icon="📔"
              color="#7b5fd4"
              title={lang === 'ar' ? 'القاموس' : 'Dictionary'}
              subtitle={lang === 'ar' ? 'كلماتك المتقنة' : 'Your mastered words'}
              onPress={() => onNav('dict')}
            />
            {library.map((book) => (
              <BookCard
                key={book.trackId}
                book={book}
                lang={lang}
                custom={bookCovers[book.trackId]}
                onPress={() => setSelected(book)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <BottomNav active="library" onNav={onNav} T={T} />
    </ThemedSafeArea>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#08080f' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 },
  pageTitle:       { fontSize: 20, fontWeight: '800', color: '#fff' },
  emptyWrap:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyBtn:        { marginTop: 18, backgroundColor: '#2E8B57', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28 },
  emptyBtnTxt:     { color: '#fff', fontWeight: '800', fontSize: 14 },
  shelf:           { padding: 18, paddingBottom: 90 },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  bookGradientBorder: { width: '47%', borderRadius: 17, padding: 2, marginBottom: 4 },
  book:            { borderRadius: 15, padding: 14, alignItems: 'center' },
  shelfLinkBook:   { width: '47%', marginBottom: 4, borderStyle: 'dashed', borderWidth: 1.5 },
  bookIcon:        { fontSize: 34, marginBottom: 6 },
  bookTitle:       { color: '#fff', fontWeight: '800', fontSize: 13, textAlign: 'center', marginBottom: 4 },
  bookMeta:        { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  readBadge:       { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  readBadgeTxt:    { color: '#fff', fontSize: 10, fontWeight: '700' },
  accBadge:        { position: 'absolute', top: 8, left: 8, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  accBadgeTxt:     { color: '#0a0a12', fontSize: 10, fontWeight: '800' },
  bookStickers:    { fontSize: 13, marginTop: 4 },
  detailHeader:    { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 4 },
  backBtn:         { paddingVertical: 8 },
  backTxt:         { color: '#a5d6a7', fontSize: 15, fontWeight: '600' },
  detailBody:      { padding: 18, paddingBottom: 60 },
  cover:           { alignItems: 'center', borderWidth: 2, borderRadius: 20, padding: 26, marginBottom: 18 },
  coverTitle:      { fontSize: 20, fontWeight: '800', marginTop: 8 },
  coverSub:        { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6, textAlign: 'center' },
  coverStickers:   { fontSize: 20, marginTop: 6 },
  coverStickersRow:{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 6 },
  coverTextSticker:{ backgroundColor: 'rgba(255,213,79,0.15)', borderWidth: 1, borderColor: 'rgba(255,213,79,0.4)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  coverTextStickerTxt: { color: '#FFD54F', fontSize: 11, fontWeight: '800' },
  statsCard:       { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, marginBottom: 18 },
  statsTitle:      { color: '#fff', fontWeight: '800', fontSize: 13, marginBottom: 10 },
  statsRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  statBox:         { flex: 1, alignItems: 'center' },
  statIcon:        { fontSize: 18, marginBottom: 4 },
  statVal:         { color: '#fff', fontWeight: '800', fontSize: 14 },
  statLbl:         { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2, textAlign: 'center' },
  customCard:      { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, marginBottom: 18 },
  chaptersCard:    { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, marginBottom: 18, overflow: 'hidden' },
  chapterRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  chapterNumBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(46,139,87,0.2)', alignItems: 'center', justifyContent: 'center' },
  chapterNumBadgeTxt: { color: '#a5d6a7', fontWeight: '800', fontSize: 12 },
  chapterTitle:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  chapterMeta:     { color: 'rgba(255,255,255,0.45)', fontSize: 11.5, marginTop: 2 },
  customLbl:       { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 8, fontWeight: '700' },
  customStepsRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  customStepBtn:   { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  customStepBtnActive: { borderColor: '#2E8B57', backgroundColor: 'rgba(46,139,87,0.15)' },
  customStepTxt:   { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' },
  customStepTxtActive: { color: '#a5d6a7' },
  customStepArrow: { color: 'rgba(255,255,255,0.25)', fontSize: 12 },
  coverOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot:        { width: 36, height: 36, borderRadius: 18, borderWidth: 3 },
  colorDotActive:  { borderColor: '#fff', borderWidth: 3, transform: [{ scale: 1.15 }] },
  stickerRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stickerBox:      { width: 62, height: 68, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  stickerBoxActive:{ borderColor: '#a5d6a7', backgroundColor: 'rgba(165,214,167,0.15)' },
  stickerEmoji:    { fontSize: 20 },
  stickerTextBoxTxt: { color: '#FFD54F', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  stickerName:     { color: 'rgba(255,255,255,0.7)', fontSize: 9, marginTop: 2, fontWeight: '600', textAlign: 'center' },
  noStickersTxt:   { color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 17 },
  moreLink:        { marginTop: 14, alignItems: 'center' },
  moreLinkTxt:     { color: '#7fb3f5', fontSize: 12, fontWeight: '700' },
  actionsRow:      { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn:       { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  actionPrimary:   { backgroundColor: '#a5d6a7', borderColor: '#a5d6a7' },
  actionPrimaryTxt:{ color: '#0a0a12', fontWeight: '800', fontSize: 13 },
  actionTxt:       { color: '#fff', fontWeight: '700', fontSize: 13 },
  shareBtn:        { backgroundColor: '#7b5fd4', borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginBottom: 24 },
  shareBtnTxt:     { color: '#fff', fontWeight: '800', fontSize: 13 },
  sectionTitle:    { color: '#fff', fontWeight: '800', fontSize: 15, marginBottom: 10 },
  wordRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  wordEmoji:       { fontSize: 20 },
  wordEn:          { color: '#fff', fontWeight: '700', fontSize: 14 },
  wordPhon:        { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontStyle: 'italic' },
  wordAr:          { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});
