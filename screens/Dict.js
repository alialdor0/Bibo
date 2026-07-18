import React, { useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import * as Speech from 'expo-speech';
import { useApp } from '../context/AppContext';
import { t, TRACKS } from '../data';
import { PageHeader, GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import WordInfoModal from '../components/WordInfoModal';

/** يصنّف نوع الكلمة النحوي التفصيلي إلى 3 فئات بسيطة: اسم / فعل / صفة */
function classifyGrammar(g) {
  if (!g) return 'other';
  const s = g.toLowerCase();
  if (s.includes('noun')) return 'noun';
  if (s.includes('verb')) return 'verb';
  if (s.includes('adjective')) return 'adjective';
  return 'other';
}

const TYPE_FILTERS = [
  { key: 'all',       label: 'All',       labelAr: 'الكل'  },
  { key: 'noun',      label: 'Noun',      labelAr: 'اسم'   },
  { key: 'verb',      label: 'Verb',      labelAr: 'فعل'   },
  { key: 'adjective', label: 'Adjective', labelAr: 'صفة'   },
];

/** ينطق كلمة إنجليزية مباشرة (للتمرين والاستماع من صف الكلمة) */
function speakEn(text) {
  try { Speech.stop(); Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 0.95 }); } catch (e) {}
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, excludeId, n) {
  return shuffle(arr.filter(w => w.id !== excludeId)).slice(0, n);
}

// أربع درجات إتقان — كل كلمة لها لون واحد واضح بدل التصنيف الثلاثي القديم
const TIERS = [
  { key: 'mastered', label: 'Mastered', labelAr: 'متقنة',        icon: '🏆', color: '#FFD54F' },
  { key: 'learned',  label: 'Learned',  labelAr: 'متعلمة',       icon: '✅', color: '#2E8B57' },
  { key: 'review',   label: 'Review',   labelAr: 'تحتاج مراجعة', icon: '🔁', color: '#FF9800' },
  { key: 'rescue',   label: 'Rescue',   labelAr: 'تحتاج إنقاذ',  icon: '🆘', color: '#c0392b' },
];

/** كلمة "متقنة" = متعلمة ومعندهاش أي خطأ مسجّل عليها؛ الباقي حسب حالة الحفظ العادية */
function wordTier(w) {
  if (w.status === 'forgotten') return 'rescue';
  if (w.status === 'review') return 'review';
  if (w.status === 'learned' && (w.misses || 0) === 0) return 'mastered';
  return 'learned';
}
function tierOf(key) { return TIERS.find(t2 => t2.key === key) || TIERS[1]; }

/** صف كلمة واحد بالقاموس — لون حسب درجة الإتقان، نجمة مفضّلة، ودوس عليه لمعلومات الكلمة */
function WordRow({ w, lang, isFav, onToggleFav, onPress }) {
  const tier = tierOf(wordTier(w));
  return (
    <TouchableOpacity
      style={[row.row, { borderColor: tier.color + '44', backgroundColor: tier.color + '0d' }]}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${w.en}, ${w.ar}, ${lang === 'ar' ? tier.labelAr : tier.label}`}
    >
      <View style={[row.dot, { backgroundColor: tier.color }]} />
      <Text style={row.emoji}>{w.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={row.en}>{w.en}</Text>
        <Text style={row.ar}>{w.ar}</Text>
      </View>
      <TouchableOpacity
        onPress={onToggleFav}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isFav ? (lang === 'ar' ? 'إزالة من المفضلة' : 'Remove from favorites') : (lang === 'ar' ? 'إضافة إلى المفضلة' : 'Add to favorites')}
      >
        <Text style={row.star}>{isFav ? '⭐' : '☆'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const row = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 11, marginBottom: 8 },
  dot:   { width: 8, height: 8, borderRadius: 4 },
  emoji: { fontSize: 20 },
  en:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  ar:    { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 1 },
  star:  { fontSize: 18, color: '#FFB300', paddingHorizontal: 4 },
});

/** تمرين المراجعة الوحيد — إنجليزي ← عربي، على قائمة الكلمات المفلترة حاليًا بالقاموس */
function ReviewExercise({ words, onDone, lang }) {
  const q       = useRef(shuffle(words)).current;
  const [idx,    setIdx]    = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score,  setScore]  = useState(0);
  const [done,   setDone]   = useState(false);
  const cur  = q[idx];
  const opts = useRef(null);
  if (!opts.current || opts.current._for !== cur.id) {
    opts.current = shuffle([cur, ...pick(words, cur.id, 3)]);
    opts.current._for = cur.id;
  }
  const answer = (w) => {
    setChosen(w.id);
    if (w.id === cur.id) setScore(s => s + 1);
    setTimeout(() => { setChosen(null); idx + 1 >= q.length ? setDone(true) : setIdx(i => i + 1); }, 700);
  };
  if (done) return (
    <View style={ex.doneCard}>
      <Text style={{ fontSize: 44 }}>🎉</Text>
      <Text style={ex.doneScore}>{score}/{q.length}</Text>
      <TouchableOpacity style={ex.doneBtn} onPress={onDone}><Text style={ex.doneBtnTxt}>{lang === 'ar' ? 'تم ←' : 'Done →'}</Text></TouchableOpacity>
    </View>
  );
  return (
    <View style={ex.card}>
      <Text style={ex.label}>{lang === 'ar' ? `مراجعة (${idx + 1}/${q.length})` : `Review (${idx + 1}/${q.length})`}</Text>
      <Text style={{ fontSize: 48, marginBottom: 8 }}>{cur.emoji}</Text>
      <TouchableOpacity onPress={() => speakEn(cur.en)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityRole="button" accessibilityLabel="Play pronunciation">
        <Text style={ex.bigWord}>{cur.en}</Text>
        <Text style={{ fontSize: 20 }}>🔊</Text>
      </TouchableOpacity>
      <Text style={ex.qTxt}>{lang === 'ar' ? 'ما معنى هذه الكلمة؟' : 'What does this mean?'}</Text>
      <View style={ex.opts}>
        {opts.current.map(w => {
          const isSel = chosen === w.id; const isOk = w.id === cur.id;
          return (
            <TouchableOpacity key={String(w.id)} style={[ex.opt, { backgroundColor: !isSel ? 'rgba(255,255,255,0.05)' : isOk ? 'rgba(46,139,87,0.3)' : 'rgba(192,57,43,0.3)', borderColor: !isSel ? 'rgba(255,255,255,0.1)' : isOk ? '#2E8B57' : '#c0392b' }]}
              onPress={() => answer(w)}>
              <Text style={ex.optTxt}>{w.ar}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const ex = StyleSheet.create({
  card:       { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, alignItems: 'center' },
  label:      { fontSize: 11, color: 'rgba(255,255,255,0.35)', alignSelf: 'flex-start', marginBottom: 12 },
  bigWord:    { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  qTxt:       { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 },
  opts:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, width: '100%' },
  opt:        { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, minWidth: '44%', alignItems: 'center' },
  optTxt:     { color: '#fff', fontSize: 14, fontWeight: '600' },
  doneCard:   { backgroundColor: 'rgba(46,139,87,0.1)', borderWidth: 1, borderColor: 'rgba(46,139,87,0.3)', borderRadius: 18, padding: 24, alignItems: 'center' },
  doneScore:  { fontSize: 36, fontWeight: '900', color: '#a5d6a7', marginTop: 8, marginBottom: 16 },
  doneBtn:    { backgroundColor: '#1B3A6B', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  doneBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default function Dict({ onBack, onNav }) {
  const { lang, gems, getWordBankWords, favoriteWords, toggleFavorite } = useApp();
  const T = (k) => t(k, lang);
  const [mode, setMode] = useState(null); // null | 'exercise'
  const [search,      setSearch]      = useState('');
  const [trackFilter, setTrackFilter] = useState('all');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [tierFilter,  setTierFilter]  = useState('all');
  const [favOnly,     setFavOnly]     = useState(false);
  const [infoWordId,  setInfoWordId]  = useState(null);

  const allWordsRaw = getWordBankWords();

  const availableTracks = useMemo(() => {
    const ids = new Set(allWordsRaw.map(w => w.trackId));
    return TRACKS.filter(tr => ids.has(tr.id));
  }, [allWordsRaw]);

  const allWords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allWordsRaw.filter(w => {
      if (trackFilter !== 'all' && w.trackId !== trackFilter) return false;
      if (typeFilter !== 'all' && classifyGrammar(w.grammar) !== typeFilter) return false;
      if (tierFilter !== 'all' && wordTier(w) !== tierFilter) return false;
      if (favOnly && !favoriteWords.includes(`${w.trackId}::${w.wordId}`)) return false;
      if (q && !w.en.toLowerCase().includes(q) && !w.ar.includes(q)) return false;
      return true;
    }).sort((a, b) => a.en.localeCompare(b.en));
  }, [allWordsRaw, search, trackFilter, typeFilter, tierFilter, favOnly, favoriteWords]);

  const infoWord = allWordsRaw.find(w => w.id === infoWordId) || null;
  const infoWordFav = infoWord ? favoriteWords.includes(`${infoWord.trackId}::${infoWord.wordId}`) : false;

  if (mode === 'exercise') return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={lang === 'ar' ? 'مراجعة الكلمات' : 'Word Review'} onBack={() => setMode(null)} backLabel={T('back')} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <ReviewExercise words={allWords.length >= 4 ? allWords : allWordsRaw} onDone={() => setMode(null)} lang={lang} />
      </ScrollView>
    </SafeAreaView>
  );

  if (allWordsRaw.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <PageHeader title={lang === 'ar' ? '📖 قاموسي' : '📖 My Dictionary'} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
        <View style={s.emptyWrap}>
          <BiboCharacter
            state="idea"
            size={88}
            message={lang === 'ar' ? 'لا توجد كلمات بعد! كل كلمة تتعلمها في القصة ستظهر هنا 📖' : "No words yet! Every word you learn in the story will show up here 📖"}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={lang === 'ar' ? '📖 قاموسي' : '📖 My Dictionary'} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <View style={s.searchBox}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={lang === 'ar' ? 'ابحث عن كلمة...' : 'Search a word...'}
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel={lang === 'ar' ? 'مسح البحث' : 'Clear search'}>
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {onNav ? (
          <TouchableOpacity style={s.rescueLinkCard} onPress={() => onNav('rescue')} accessibilityRole="button">
            <Text style={{ fontSize: 20 }}>🆘</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rescueLinkTitle}>{lang === 'ar' ? 'إنقاذ الكلمات وتحدّي بيبو' : 'Word Rescue & Bibo Challenges'}</Text>
              <Text style={s.rescueLinkSub}>{lang === 'ar' ? 'إنقاذ الكلمات، مبارزات، وتحديات ممتعة' : 'Word rescue, duels, and fun challenges'}</Text>
            </View>
            <Text style={s.exArrow}>←</Text>
          </TouchableOpacity>
        ) : null}

        {/* درجات الإتقان — لكل كلمة لون واحد واضح */}
        <View style={s.tiersRow}>
          {TIERS.map(tr => {
            const count = allWordsRaw.filter(w => wordTier(w) === tr.key).length;
            const active = tierFilter === tr.key;
            return (
              <TouchableOpacity
                key={tr.key}
                style={[s.tierCard, { borderColor: tr.color + (active ? 'ff' : '55') }, active ? { backgroundColor: tr.color + '18' } : null]}
                onPress={() => setTierFilter(active ? 'all' : tr.key)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={(lang === 'ar' ? tr.labelAr : tr.label) + ': ' + count}
              >
                <Text style={[s.tierCount, { color: tr.color }]}>{count}</Text>
                <Text style={s.tierLabel}>{tr.icon} {lang === 'ar' ? tr.labelAr : tr.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity
            style={[s.filterChip, favOnly ? s.filterChipActive : null]}
            onPress={() => setFavOnly(!favOnly)} accessibilityRole="button">
            <Text style={[s.filterChipTxt, favOnly ? s.filterChipTxtActive : null]}>⭐ {lang === 'ar' ? 'المفضّلة' : 'Favorites'}</Text>
          </TouchableOpacity>
          {availableTracks.length > 1 ? (
            <>
              <TouchableOpacity
                style={[s.filterChip, trackFilter === 'all' ? s.filterChipActive : null]}
                onPress={() => setTrackFilter('all')} accessibilityRole="button">
                <Text style={[s.filterChipTxt, trackFilter === 'all' ? s.filterChipTxtActive : null]}>{lang === 'ar' ? 'كل المسارات' : 'All tracks'}</Text>
              </TouchableOpacity>
              {availableTracks.map(tr => (
                <TouchableOpacity
                  key={tr.id}
                  style={[s.filterChip, trackFilter === tr.id ? s.filterChipActive : null]}
                  onPress={() => setTrackFilter(tr.id === trackFilter ? 'all' : tr.id)} accessibilityRole="button">
                  <Text style={[s.filterChipTxt, trackFilter === tr.id ? s.filterChipTxtActive : null]}>{tr.icon} {lang === 'ar' ? tr.nameAr : tr.name}</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : null}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: 8 }}>
          {TYPE_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[s.filterChip, typeFilter === f.key ? s.filterChipActive : null]}
              onPress={() => setTypeFilter(f.key)} accessibilityRole="button">
              <Text style={[s.filterChipTxt, typeFilter === f.key ? s.filterChipTxtActive : null]}>{lang === 'ar' ? f.labelAr : f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {allWords.length === 0 ? (
          <View style={s.noResultsWrap}>
            <Text style={s.noResultsTxt}>{lang === 'ar' ? 'لا توجد نتائج مطابقة' : 'No words match this search/filter'}</Text>
            <TouchableOpacity onPress={() => { setSearch(''); setTrackFilter('all'); setTypeFilter('all'); setTierFilter('all'); setFavOnly(false); }}>
              <Text style={s.clearFiltersTxt}>{lang === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={s.exCard} onPress={() => setMode('exercise')} accessibilityRole="button">
              <Text style={{ fontSize: 26 }}>🔤</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.exLabel}>{lang === 'ar' ? 'مراجعة سريعة' : 'Quick Review'}</Text>
                <Text style={s.exSub2}>
                  {allWords.length >= 4
                    ? (lang === 'ar' ? `تمرين على ${allWords.length} كلمة من القائمة الحالية` : `Practice on ${allWords.length} words from the current list`)
                    : (lang === 'ar' ? 'تمرين على كل كلماتك' : 'Practice on all your words')}
                </Text>
              </View>
              <Text style={s.exArrow}>←</Text>
            </TouchableOpacity>

            <Text style={s.listLabel}>{lang === 'ar' ? `الكلمات (${allWords.length})` : `Words (${allWords.length})`}</Text>
            {allWords.map(w => (
              <WordRow
                key={String(w.id)}
                w={w}
                lang={lang}
                isFav={favoriteWords.includes(`${w.trackId}::${w.wordId}`)}
                onToggleFav={() => toggleFavorite(w.trackId, w.wordId)}
                onPress={() => setInfoWordId(w.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <WordInfoModal
        visible={!!infoWordId}
        word={infoWord}
        lang={lang}
        onClose={() => setInfoWordId(null)}
        onPlay={() => infoWord && speakEn(infoWord.en)}
        isFavorite={infoWordFav}
        onToggleFavorite={() => infoWord && toggleFavorite(infoWord.trackId, infoWord.wordId)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#08080f' },
  pageContent:{ padding: 16, paddingBottom: 40 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  tiersRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tierCard:  { flexBasis: '48%', flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderRadius: 12, padding: 10, alignItems: 'center' },
  tierCount: { fontSize: 20, fontWeight: '800' },
  tierLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, textAlign: 'center', fontWeight: '600' },
  listLabel: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 6, marginBottom: 8 },
  exTitle:   { fontSize: 15, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 4 },
  exCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(46,139,87,0.1)', borderWidth: 1, borderColor: 'rgba(46,139,87,0.3)', borderRadius: 14, padding: 14, marginBottom: 16 },
  exLabel:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  exSub2:    { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  exArrow:   { color: '#2E8B57', fontSize: 18, fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  rescueLinkCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(192,57,43,0.1)', borderWidth: 1, borderColor: 'rgba(192,57,43,0.3)', borderRadius: 12, padding: 12, marginBottom: 14 },
  rescueLinkTitle: { color: '#fff', fontWeight: '700', fontSize: 13 },
  rescueLinkSub:   { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  filterRow: { marginBottom: 10 },
  filterChip: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipActive: { borderColor: '#2E8B57', backgroundColor: 'rgba(46,139,87,0.2)' },
  filterChipTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  filterChipTxtActive: { color: '#a5d6a7' },
  noResultsWrap: { alignItems: 'center', padding: 24 },
  noResultsTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 10 },
  clearFiltersTxt: { color: '#2E8B57', fontSize: 14, fontWeight: '700' },
});
