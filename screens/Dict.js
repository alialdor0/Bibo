import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useApp } from '../context/AppContext';
import { t } from '../data';
import { PageHeader, GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';

const SECTIONS = [
  { key: 'learned',   label: 'Learned',    labelAr: 'تعلمتها',  icon: '✅', color: '#2E8B57' },
  { key: 'review',    label: 'Review',     labelAr: 'للمراجعة', icon: '🔁', color: '#FFB300' },
  { key: 'forgotten', label: 'Forgotten',  labelAr: 'نسيتها',   icon: '❌', color: '#c0392b' },
];

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

function SectionBlock({ sec, words, lang }) {
  const [open, setOpen] = useState(false);
  if (!words.length) return null;
  return (
    <View style={[bl.section, { borderColor: sec.color + '44' }]}>
      <TouchableOpacity style={bl.header} onPress={() => setOpen(!open)} accessibilityRole="button">
        <View style={bl.left}>
          <Text style={{ fontSize: 16 }}>{sec.icon}</Text>
          <Text style={bl.label}>{lang === 'ar' ? sec.labelAr : sec.label}</Text>
          <View style={[bl.badge, { backgroundColor: sec.color + '22' }]}>
            <Text style={[bl.badgeTxt, { color: sec.color }]}>{words.length}</Text>
          </View>
        </View>
        <Text style={bl.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open ? (
        <View style={bl.words}>
          {words.map(w => (
            <View key={String(w.id)} style={[bl.chip, { borderColor: sec.color + '44', backgroundColor: sec.color + '12' }]}>
              <Text style={{ fontSize: 13 }}>{w.emoji}</Text>
              <Text style={[bl.en, { color: sec.color }]}>{w.en}</Text>
              <Text style={bl.ar}>{w.ar}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const bl = StyleSheet.create({
  section: { borderRadius: 12, borderWidth: 1, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  left:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label:   { color: '#fff', fontSize: 14 },
  badge:   { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  badgeTxt:{ fontSize: 13, fontWeight: '700' },
  chevron: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  words:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12, paddingTop: 0 },
  chip:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  en:      { fontSize: 12, fontWeight: '600' },
  ar:      { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 2 },
});

function Ex1({ words, onDone }) {
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
      <TouchableOpacity style={ex.doneBtn} onPress={onDone}><Text style={ex.doneBtnTxt}>Next →</Text></TouchableOpacity>
    </View>
  );
  return (
    <View style={ex.card}>
      <Text style={ex.label}>English → Arabic ({idx + 1}/{q.length})</Text>
      <Text style={{ fontSize: 48, marginBottom: 8 }}>{cur.emoji}</Text>
      <Text style={ex.bigWord}>{cur.en}</Text>
      <Text style={ex.qTxt}>What does this mean?</Text>
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

function Ex2({ words, onDone }) {
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
      <TouchableOpacity style={ex.doneBtn} onPress={onDone}><Text style={ex.doneBtnTxt}>Done ✓</Text></TouchableOpacity>
    </View>
  );
  return (
    <View style={ex.card}>
      <Text style={ex.label}>Arabic → English ({idx + 1}/{q.length})</Text>
      <Text style={{ fontSize: 48, marginBottom: 8 }}>{cur.emoji}</Text>
      <Text style={ex.bigWordAr}>{cur.ar}</Text>
      <Text style={ex.qTxt}>What is the English word?</Text>
      <View style={ex.opts}>
        {opts.current.map(w => {
          const isSel = chosen === w.id; const isOk = w.id === cur.id;
          return (
            <TouchableOpacity key={String(w.id)} style={[ex.opt, { backgroundColor: !isSel ? 'rgba(255,255,255,0.05)' : isOk ? 'rgba(46,139,87,0.3)' : 'rgba(192,57,43,0.3)', borderColor: !isSel ? 'rgba(255,255,255,0.1)' : isOk ? '#2E8B57' : '#c0392b' }]}
              onPress={() => answer(w)}>
              <Text style={ex.optTxt}>{w.en}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Ex3({ words, onDone }) {
  const pairs   = useRef(shuffle(words).slice(0, 6)).current;
  const enCol   = useRef(shuffle([...pairs])).current;
  const arCol   = useRef(shuffle([...pairs])).current;
  const [selEn,    setSelEn]    = useState(null);
  const [selAr,    setSelAr]    = useState(null);
  const [matched,  setMatched]  = useState([]);
  const [wrong,    setWrong]    = useState([]);
  const [done,     setDone]     = useState(false);

  const check = (enId, arId) => {
    if (enId === arId) {
      const nm = [...matched, enId];
      setMatched(nm); setSelEn(null); setSelAr(null);
      if (nm.length === pairs.length) setTimeout(() => setDone(true), 400);
    } else {
      setWrong([enId, arId]);
      setTimeout(() => { setWrong([]); setSelEn(null); setSelAr(null); }, 700);
    }
  };
  const handleEn = (id) => {
    if (matched.includes(id) || wrong.includes(id)) return;
    const ns = selEn === id ? null : id;
    setSelEn(ns);
    if (ns && selAr) check(ns, selAr);
  };
  const handleAr = (id) => {
    if (matched.includes(id) || wrong.includes(id)) return;
    const ns = selAr === id ? null : id;
    setSelAr(ns);
    if (selEn && ns) check(selEn, ns);
  };

  if (done) return (
    <View style={ex.doneCard}>
      <Text style={{ fontSize: 44 }}>🎉</Text>
      <Text style={ex.doneScore}>{pairs.length}/{pairs.length}</Text>
      <TouchableOpacity style={ex.doneBtn} onPress={onDone}><Text style={ex.doneBtnTxt}>Done ✓</Text></TouchableOpacity>
    </View>
  );
  return (
    <View style={ex.card}>
      <Text style={ex.label}>Matching ({matched.length}/{pairs.length})</Text>
      <Text style={ex.qTxt}>Connect each word with its meaning</Text>
      <View style={ex.matchGrid}>
        <View style={ex.matchCol}>
          {enCol.map(w => {
            const isM = matched.includes(w.id); const isSel = selEn === w.id; const isW = wrong.includes(w.id);
            return (
              <TouchableOpacity key={String(w.id)} style={[ex.matchBtn, { borderColor: isM ? '#2E8B57' : isW ? '#c0392b' : isSel ? '#FFB300' : 'rgba(255,255,255,0.1)', backgroundColor: isM ? 'rgba(46,139,87,0.2)' : isW ? 'rgba(192,57,43,0.2)' : isSel ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.04)', opacity: isM ? 0.45 : 1 }]}
                onPress={() => handleEn(w.id)}>
                <Text style={ex.matchTxtEn}>{w.en}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={ex.matchCol}>
          {arCol.map(w => {
            const isM = matched.includes(w.id); const isSel = selAr === w.id; const isW = wrong.includes(w.id);
            return (
              <TouchableOpacity key={String(w.id)} style={[ex.matchBtn, { borderColor: isM ? '#2E8B57' : isW ? '#c0392b' : isSel ? '#FFB300' : 'rgba(255,255,255,0.1)', backgroundColor: isM ? 'rgba(46,139,87,0.2)' : isW ? 'rgba(192,57,43,0.2)' : isSel ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.04)', opacity: isM ? 0.45 : 1 }]}
                onPress={() => handleAr(w.id)}>
                <Text style={ex.matchTxtAr}>{w.ar}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const ex = StyleSheet.create({
  card:       { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, alignItems: 'center' },
  label:      { fontSize: 11, color: 'rgba(255,255,255,0.35)', alignSelf: 'flex-start', marginBottom: 12 },
  bigWord:    { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bigWordAr:  { fontSize: 24, fontWeight: '800', color: '#a5d6a7', marginBottom: 4 },
  qTxt:       { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 },
  opts:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, width: '100%' },
  opt:        { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, minWidth: '44%', alignItems: 'center' },
  optTxt:     { color: '#fff', fontSize: 14, fontWeight: '600' },
  matchGrid:  { flexDirection: 'row', gap: 10, width: '100%' },
  matchCol:   { flex: 1, gap: 8 },
  matchBtn:   { borderWidth: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  matchTxtEn: { color: '#fff', fontSize: 13, fontWeight: '600' },
  matchTxtAr: { color: '#a5d6a7', fontSize: 13, fontWeight: '600' },
  doneCard:   { backgroundColor: 'rgba(46,139,87,0.1)', borderWidth: 1, borderColor: 'rgba(46,139,87,0.3)', borderRadius: 18, padding: 24, alignItems: 'center' },
  doneScore:  { fontSize: 36, fontWeight: '900', color: '#a5d6a7', marginTop: 8, marginBottom: 16 },
  doneBtn:    { backgroundColor: '#1B3A6B', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  doneBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default function Dict({ onBack }) {
  const { lang, gems, getWordBankWords } = useApp();
  const T = (k) => t(k, lang);
  const [section, setSection] = useState(null);
  const [mode,    setMode]    = useState(null);
  const [exKey,   setExKey]   = useState(0);

  const allWords    = getWordBankWords();
  const reviewWords = allWords.filter(w => w.status === 'review' || w.status === 'forgotten');
  const exWords     = section ? allWords.filter(w => w.status === section) : reviewWords;
  const secData     = SECTIONS.find(s => s.key === section);

  const startEx = (m) => { setExKey(k => k + 1); setMode(m); };
  const endEx   = () => setMode(null);

  if (mode) return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={mode === 'ex1' ? 'English → Arabic' : mode === 'ex2' ? 'Arabic → English' : 'Matching'} onBack={endEx} backLabel={T('back')} />
      <ScrollView contentContainerStyle={s.pageContent}>
        {mode === 'ex1' ? <Ex1 key={String(exKey)} words={exWords} onDone={endEx} /> :
         mode === 'ex2' ? <Ex2 key={String(exKey)} words={exWords} onDone={endEx} /> :
         <Ex3 key={String(exKey)} words={exWords} onDone={endEx} />}
      </ScrollView>
    </SafeAreaView>
  );

  if (allWords.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <PageHeader title="📖 My Dictionary" onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
        <View style={s.emptyWrap}>
          <BiboCharacter
            state="idea"
            size={88}
            message={lang === 'ar' ? 'مفيش كلمات لسه! كل كلمة تتعلمها في القصة هتظهر هنا 📖' : "No words yet! Every word you learn in the story will show up here 📖"}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title="📖 My Dictionary" onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <BiboCharacter
          layout="row"
          size={52}
          style={{ marginBottom: 14 }}
          state="idea"
          message={lang === 'ar' ? 'راجع كلماتك القديمة كل يوم عشان تفتكرها! 💡' : 'Review old words daily so you never forget them! 💡'}
        />
        <View style={s.statsRow}>
          {SECTIONS.map(sec => {
            const count = allWords.filter(w => w.status === sec.key).length;
            return (
              <TouchableOpacity key={sec.key} style={[s.statCard, { borderColor: sec.color + '55' }]}
                onPress={() => setSection(sec.key === section ? null : sec.key)} accessibilityRole="button">
                <Text style={[s.statCount, { color: sec.color }]}>{count}</Text>
                <Text style={s.statLabel}>{lang === 'ar' ? sec.labelAr : sec.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {SECTIONS.map(sec => (
          <SectionBlock key={sec.key} sec={sec} words={allWords.filter(w => w.status === sec.key)} lang={lang} />
        ))}

        <Text style={s.exTitle}>Exercises</Text>
        <Text style={s.exSub}>{section ? 'Exercises for this section' : 'Exercises on review and forgotten words'}</Text>
        {[
          { key: 'ex1', label: 'English → Arabic', icon: '🔤', sub: 'Choose the Arabic meaning' },
          { key: 'ex2', label: 'Arabic → English', icon: '🔡', sub: 'Choose the English word'  },
          { key: 'ex3', label: 'Matching',          icon: '🔗', sub: 'Connect words with meanings' },
        ].map(e => (
          <TouchableOpacity key={e.key} style={s.exCard} onPress={() => startEx(e.key)} accessibilityRole="button">
            <Text style={{ fontSize: 26 }}>{e.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.exLabel}>{e.label}</Text>
              <Text style={s.exSub2}>{e.sub}</Text>
            </View>
            <Text style={s.exArrow}>←</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#08080f' },
  pageContent:{ padding: 16, paddingBottom: 40 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  statsRow:  { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statCount: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3, textAlign: 'center' },
  exTitle:   { fontSize: 15, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 4 },
  exSub:     { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12 },
  exCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 10 },
  exLabel:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  exSub2:    { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  exArrow:   { color: '#2E8B57', fontSize: 18, fontWeight: '700' },
});
