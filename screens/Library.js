import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { t, COVER_COLORS, COVER_STICKERS } from '../data';
import { GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import BottomNav from '../components/BottomNav';
import { exportBookPDF, shareBookAchievement } from '../utils/libraryExport';

function BookCard({ book, lang, custom, onPress }) {
  const title = lang === 'ar' ? book.trackNameAr : book.trackName;
  const hasAccuracy = typeof book.accuracy === 'number' && book.totalAnswers > 0;
  const color = custom?.color || book.color || '#2E8B57';
  const stickers = custom?.stickers || [];
  return (
    <TouchableOpacity style={[s.book, { borderColor: color + '55', backgroundColor: color + '14' }]} onPress={onPress}>
      {hasAccuracy ? (
        <View style={[s.accBadge, { backgroundColor: accuracyColor(book.accuracy) }]}>
          <Text style={s.accBadgeTxt}>{book.accuracy}%</Text>
        </View>
      ) : null}
      <Text style={s.bookIcon}>{book.icon}</Text>
      <Text style={s.bookTitle} numberOfLines={2}>{title}</Text>
      <Text style={s.bookMeta}>{(book.words || []).length} {lang === 'ar' ? 'كلمة' : 'words'}</Text>
      {stickers.length ? (
        <Text style={s.bookStickers}>{stickers.map(id => COVER_STICKERS.find(st => st.id === id)?.emoji || '').join(' ')}</Text>
      ) : null}
      {book.readCount > 1 ? (
        <View style={s.readBadge}><Text style={s.readBadgeTxt}>×{book.readCount}</Text></View>
      ) : null}
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

/** لون تقييم الدقة: أخضر ممتاز / أصفر متوسط / برتقالي محتاج تحسين */
function accuracyColor(acc) {
  if (acc >= 85) return '#a5d6a7';
  if (acc >= 60) return '#ffd54f';
  return '#ff8a65';
}

function BookDetail({ book, lang, onBack, onReadAgain }) {
  const { gems, bookCovers, ownedStickers, buySticker, setBookCoverColor, toggleBookSticker } = useApp();
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const title = lang === 'ar' ? book.trackNameAr : book.trackName;
  const date = new Date(book.completedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
  const duration = formatDuration(book.timeSpentSec, lang);
  const hasAccuracy = typeof book.accuracy === 'number' && book.totalAnswers > 0;

  const coverKey = `${book.trackId}::${book.episodeId}`;
  const custom = bookCovers[coverKey] || {};
  const coverColor = custom.color || book.color || '#2E8B57';
  const appliedStickers = custom.stickers || [];
  const appliedEmojis = appliedStickers.map(id => COVER_STICKERS.find(st => st.id === id)?.emoji).filter(Boolean);

  const handleExport = async () => {
    setExporting(true);
    const ok = await exportBookPDF(book, lang);
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
    const ok = await shareBookAchievement(book, lang, coverColor, appliedEmojis);
    setSharing(false);
    if (!ok) {
      Alert.alert(
        lang === 'ar' ? 'المشاركة غير متاحة' : 'Sharing unavailable',
        lang === 'ar' ? 'يتطلب هذا بناءً أصليًا (expo-print) ليعمل، وهو غير متاح في هذه البيئة.' : 'Requires a native build (expo-print) — not available in this environment.'
      );
    }
  };

  const handleStickerTap = (sticker) => {
    const owned = ownedStickers.includes(sticker.id);
    if (owned) {
      toggleBookSticker(book.trackId, book.episodeId, sticker.id);
      return;
    }
    if (gems < sticker.price) {
      Alert.alert(
        lang === 'ar' ? 'الجواهر غير كافية' : 'Not enough gems',
        lang === 'ar' ? `تحتاج إلى ${sticker.price} 💎 لشراء هذا الملصق.` : `You need ${sticker.price} 💎 to buy this sticker.`
      );
      return;
    }
    const bought = buySticker(sticker.id, sticker.price);
    if (bought) toggleBookSticker(book.trackId, book.episodeId, sticker.id);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.detailHeader}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backTxt}>{lang === 'ar' ? '‹ رجوع' : '‹ Back'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.detailBody}>
        <View style={[s.cover, { borderColor: coverColor, backgroundColor: coverColor + '14' }]}>
          <Text style={{ fontSize: 46 }}>{book.icon}</Text>
          {appliedEmojis.length ? <Text style={s.coverStickers}>{appliedEmojis.join(' ')}</Text> : null}
          <Text style={[s.coverTitle, { color: coverColor }]}>{title}</Text>
          <Text style={s.coverSub}>
            {(lang === 'ar' ? 'اكتملت في ' : 'Completed on ') + date} · {(book.words || []).length} {lang === 'ar' ? 'كلمة' : 'words'} · +{book.gemsEarned || 0} 💎
          </Text>
        </View>

        {(duration || hasAccuracy) ? (
          <View style={s.statsCard}>
            <Text style={s.statsTitle}>{lang === 'ar' ? 'إحصائيات الحلقة' : 'Episode stats'}</Text>
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
                  <Text style={[s.statVal, { color: accuracyColor(book.accuracy) }]}>{book.accuracy}%</Text>
                  <Text style={s.statLbl}>{lang === 'ar' ? 'دقة الإجابات' : 'Answer accuracy'}</Text>
                </View>
              ) : null}
              {hasAccuracy ? (
                <View style={s.statBox}>
                  <Text style={s.statIcon}>✅</Text>
                  <Text style={s.statVal}>{book.correctAnswers}/{book.totalAnswers}</Text>
                  <Text style={s.statLbl}>{lang === 'ar' ? 'إجابات صحيحة' : 'Correct answers'}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={s.customCard}>
          <Text style={s.statsTitle}>🎨 {lang === 'ar' ? 'تخصيص الغلاف' : 'Customize cover'}</Text>

          <Text style={s.customLbl}>{lang === 'ar' ? 'لون الغلاف' : 'Cover color'}</Text>
          <View style={s.colorRow}>
            {COVER_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.colorDot, { backgroundColor: c }, coverColor === c ? s.colorDotActive : null]}
                onPress={() => setBookCoverColor(book.trackId, book.episodeId, c)}
              />
            ))}
          </View>

          <Text style={[s.customLbl, { marginTop: 14 }]}>{lang === 'ar' ? 'الملصقات (بحد أقصى 3)' : 'Stickers (up to 3)'}</Text>
          <View style={s.stickerRow}>
            {COVER_STICKERS.map(st => {
              const owned = ownedStickers.includes(st.id);
              const applied = appliedStickers.includes(st.id);
              return (
                <TouchableOpacity
                  key={st.id}
                  style={[s.stickerBox, applied ? s.stickerBoxActive : null]}
                  onPress={() => handleStickerTap(st)}
                >
                  <Text style={s.stickerEmoji}>{st.emoji}</Text>
                  <Text style={s.stickerName} numberOfLines={1}>{lang === 'ar' ? st.nameAr : st.name}</Text>
                  {!owned ? <Text style={s.stickerPrice}>{st.price}💎</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={s.actionsRow}>
          <TouchableOpacity style={[s.actionBtn, s.actionPrimary]} onPress={handleExport} disabled={exporting}>
            {exporting ? <ActivityIndicator color="#08080f" /> : <Text style={s.actionPrimaryTxt}>📄 {lang === 'ar' ? 'تصدير PDF' : 'Export PDF'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={onReadAgain}>
            <Text style={s.actionTxt}>🔁 {lang === 'ar' ? 'إعادة القراءة' : 'Read again'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing ? <ActivityIndicator color="#fff" /> : <Text style={s.shareBtnTxt}>🎉 {lang === 'ar' ? 'مشاركة الإنجاز' : 'Share achievement'}</Text>}
        </TouchableOpacity>

        <Text style={s.sectionTitle}>{lang === 'ar' ? 'الكلمات التي تعلمتها' : 'Words you learned'}</Text>
        {(book.words || []).map((w, i) => (
          <View key={String(i)} style={s.wordRow}>
            <Text style={s.wordEmoji}>{w.emoji || '📖'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.wordEn}>{w.word}</Text>
              <Text style={s.wordPhon}>{w.phonetic}</Text>
            </View>
            <Text style={s.wordAr}>{w.ar}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
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
        onReadAgain={() => onNav('story')}
      />
    );
  }

  return (
    <SafeAreaView style={s.safe}>
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
            {library.map((book, i) => (
              <BookCard
                key={String(i)}
                book={book}
                lang={lang}
                custom={bookCovers[`${book.trackId}::${book.episodeId}`]}
                onPress={() => setSelected(book)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <BottomNav active="library" onNav={onNav} T={T} />
    </SafeAreaView>
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
  book:            { width: '47%', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 4, alignItems: 'center' },
  bookIcon:        { fontSize: 34, marginBottom: 6 },
  bookTitle:       { color: '#fff', fontWeight: '800', fontSize: 13, textAlign: 'center', marginBottom: 4 },
  bookMeta:        { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  readBadge:       { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  readBadgeTxt:    { color: '#fff', fontSize: 10, fontWeight: '700' },
  accBadge:        { position: 'absolute', top: 8, left: 8, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  accBadgeTxt:     { color: '#08080f', fontSize: 10, fontWeight: '800' },
  bookStickers:    { fontSize: 13, marginTop: 4 },
  detailHeader:    { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 4 },
  backBtn:         { paddingVertical: 8 },
  backTxt:         { color: '#a5d6a7', fontSize: 15, fontWeight: '600' },
  detailBody:      { padding: 18, paddingBottom: 60 },
  cover:           { alignItems: 'center', borderWidth: 2, borderRadius: 20, padding: 26, marginBottom: 18 },
  coverTitle:      { fontSize: 20, fontWeight: '800', marginTop: 8 },
  coverSub:        { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6, textAlign: 'center' },
  coverStickers:   { fontSize: 20, marginTop: 6, letterSpacing: 4 },
  statsCard:       { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, marginBottom: 18 },
  statsTitle:      { color: '#fff', fontWeight: '800', fontSize: 13, marginBottom: 10 },
  statsRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  statBox:         { flex: 1, alignItems: 'center' },
  statIcon:        { fontSize: 18, marginBottom: 4 },
  statVal:         { color: '#fff', fontWeight: '800', fontSize: 14 },
  statLbl:         { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2, textAlign: 'center' },
  customCard:      { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, marginBottom: 18 },
  customLbl:       { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 8, fontWeight: '700' },
  colorRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot:        { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive:  { borderColor: '#fff' },
  stickerRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stickerBox:      { width: 62, height: 68, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  stickerBoxActive:{ borderColor: '#a5d6a7', backgroundColor: 'rgba(165,214,167,0.15)' },
  stickerEmoji:    { fontSize: 20 },
  stickerName:     { color: 'rgba(255,255,255,0.7)', fontSize: 9, marginTop: 2, fontWeight: '600', textAlign: 'center' },
  stickerPrice:    { color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 1, fontWeight: '700' },
  actionsRow:      { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn:       { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  actionPrimary:   { backgroundColor: '#a5d6a7', borderColor: '#a5d6a7' },
  actionPrimaryTxt:{ color: '#08080f', fontWeight: '800', fontSize: 13 },
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

