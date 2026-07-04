import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { t } from '../data';
import { GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import BottomNav from '../components/BottomNav';
import { exportBookPDF } from '../utils/libraryExport';

function BookCard({ book, lang, onPress }) {
  const title = lang === 'ar' ? book.trackNameAr : book.trackName;
  return (
    <TouchableOpacity style={[s.book, { borderColor: (book.color || '#2E8B57') + '55', backgroundColor: (book.color || '#2E8B57') + '14' }]} onPress={onPress}>
      <Text style={s.bookIcon}>{book.icon}</Text>
      <Text style={s.bookTitle} numberOfLines={2}>{title}</Text>
      <Text style={s.bookMeta}>{(book.words || []).length} {lang === 'ar' ? 'كلمة' : 'words'}</Text>
      {book.readCount > 1 ? (
        <View style={s.readBadge}><Text style={s.readBadgeTxt}>×{book.readCount}</Text></View>
      ) : null}
    </TouchableOpacity>
  );
}

function BookDetail({ book, lang, onBack, onReadAgain }) {
  const [exporting, setExporting] = useState(false);
  const title = lang === 'ar' ? book.trackNameAr : book.trackName;
  const date = new Date(book.completedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');

  const handleExport = async () => {
    setExporting(true);
    const ok = await exportBookPDF(book, lang);
    setExporting(false);
    if (!ok) {
      Alert.alert(
        lang === 'ar' ? 'التصدير مش متاح' : 'Export unavailable',
        lang === 'ar' ? 'محتاج بناء native (expo-print) عشان يشتغل — مش متاح في هذه البيئة.' : 'Requires a native build (expo-print) — not available in this environment.'
      );
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.detailHeader}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backTxt}>{lang === 'ar' ? '‹ رجوع' : '‹ Back'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.detailBody}>
        <View style={[s.cover, { borderColor: book.color || '#2E8B57', backgroundColor: (book.color || '#2E8B57') + '14' }]}>
          <Text style={{ fontSize: 46 }}>{book.icon}</Text>
          <Text style={[s.coverTitle, { color: book.color || '#2E8B57' }]}>{title}</Text>
          <Text style={s.coverSub}>
            {(lang === 'ar' ? 'اكتملت في ' : 'Completed on ') + date} · {(book.words || []).length} {lang === 'ar' ? 'كلمة' : 'words'} · +{book.gemsEarned || 0} 💎
          </Text>
        </View>

        <View style={s.actionsRow}>
          <TouchableOpacity style={[s.actionBtn, s.actionPrimary]} onPress={handleExport} disabled={exporting}>
            {exporting ? <ActivityIndicator color="#08080f" /> : <Text style={s.actionPrimaryTxt}>📄 {lang === 'ar' ? 'تصدير PDF' : 'Export PDF'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={onReadAgain}>
            <Text style={s.actionTxt}>🔁 {lang === 'ar' ? 'اقرأ تاني' : 'Read again'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>{lang === 'ar' ? 'الكلمات اللي اتعلمتها' : 'Words you learned'}</Text>
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
  const { lang, gems, library } = useApp();
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
            message={lang === 'ar' ? 'رفك لسه فاضي! خلّص أول حلقة عشان تشوف أول كتاب هنا 📚' : 'Your shelf is empty! Finish your first episode to see your first book here 📚'}
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
            message={lang === 'ar' ? `عندك ${library.length} كتاب في المكتبة! فخور بيك 🏆` : `You have ${library.length} book(s) in your library! Proud of you 🏆`}
          />
          <View style={s.grid}>
            {library.map((book, i) => (
              <BookCard key={String(i)} book={book} lang={lang} onPress={() => setSelected(book)} />
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
  detailHeader:    { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 4 },
  backBtn:         { paddingVertical: 8 },
  backTxt:         { color: '#a5d6a7', fontSize: 15, fontWeight: '600' },
  detailBody:      { padding: 18, paddingBottom: 60 },
  cover:           { alignItems: 'center', borderWidth: 2, borderRadius: 20, padding: 26, marginBottom: 18 },
  coverTitle:      { fontSize: 20, fontWeight: '800', marginTop: 8 },
  coverSub:        { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6, textAlign: 'center' },
  actionsRow:      { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn:       { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  actionPrimary:   { backgroundColor: '#a5d6a7', borderColor: '#a5d6a7' },
  actionPrimaryTxt:{ color: '#08080f', fontWeight: '800', fontSize: 13 },
  actionTxt:       { color: '#fff', fontWeight: '700', fontSize: 13 },
  sectionTitle:    { color: '#fff', fontWeight: '800', fontSize: 15, marginBottom: 10 },
  wordRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  wordEmoji:       { fontSize: 20 },
  wordEn:          { color: '#fff', fontWeight: '700', fontSize: 14 },
  wordPhon:        { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontStyle: 'italic' },
  wordAr:          { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});
