import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, SafeAreaView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { t } from '../data';
import { PageHeader, BiboMsg, GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import BiboIcon from '../components/BiboIcon';
import { playSfx } from '../utils/sfx';

const DIFFICULTIES = [
  { key: 'easy',   labelAr: 'سهل',   labelEn: 'Easy',   seconds: 20, icon: '🐢' },
  { key: 'medium', labelAr: 'متوسط', labelEn: 'Medium', seconds: 12, icon: '🐇' },
  { key: 'hard',   labelAr: 'صعب',   labelEn: 'Hard',   seconds: 6,  icon: '🐆' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getOpts(word, all) {
  return shuffle([word, ...shuffle(all.filter(w => w.id !== word.id)).slice(0, 3)]);
}

function WordCard({ word, lang }) {
  const color = word.episodesLeft <= 0 ? '#c0392b' : word.episodesLeft <= 1 ? '#FFB300' : '#2E8B57';
  const label = word.episodesLeft <= 0
    ? (lang === 'ar' ? 'خطر الآن!' : 'At risk now!')
    : (lang === 'ar' ? `بعد ${word.episodesLeft} حلقة` : `In ${word.episodesLeft} episode${word.episodesLeft === 1 ? '' : 's'}`);
  return (
    <View style={[wc.card, { borderColor: color + '55' }]}>
      <Text style={{ fontSize: 28 }}>{word.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={wc.en}>{word.en}</Text>
        <Text style={wc.ar}>{word.ar} · {word.pron}</Text>
      </View>
      <View style={[wc.badge, { backgroundColor: color + '22' }]}>
        <Text style={[wc.badgeTxt, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const wc = StyleSheet.create({
  card:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  en:       { fontSize: 15, fontWeight: '700', color: '#fff' },
  ar:       { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  badge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontWeight: '600' },
});

function RescueGame({ words, onDone, addGems, onRescue, difficulty, lang }) {
  const T = (k) => t(k, lang);
  const diff = DIFFICULTIES.find(d => d.key === difficulty) || DIFFICULTIES[1];
  const q       = useRef(shuffle(words)).current;
  const [idx,    setIdx]    = useState(0);
  const [chosen, setChosen] = useState(null);
  const [typed,  setTyped]  = useState('');
  const [typedResult, setTypedResult] = useState(null); // null | 'ok' | 'bad'
  const [score,  setScore]  = useState(0);
  const [done,   setDone]   = useState(false);
  const [timeLeft, setTimeLeft] = useState(diff.seconds);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const celebAnim = useRef(new Animated.Value(1)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;
  const [combo, setCombo] = useState(0);

  const cur  = q[idx];
  const exType = idx % 2 === 0 ? 'choice' : 'type';
  const opts = useRef(null);
  if (!opts.current || opts.current._for !== cur.id) {
    opts.current = getOpts(cur, words);
    opts.current._for = cur.id;
  }

  // صفارة إنذار خفيفة عند بدء مهمة الإنقاذ
  useEffect(() => { playSfx('rescueStart'); }, []);

  // مؤقت زمني يعتمد على مستوى الصعوبة المختار
  useEffect(() => {
    if (chosen || typedResult) return;
    setTimeLeft(diff.seconds);
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        if (t <= 4) {
          Animated.sequence([
            Animated.timing(timerPulse, { toValue: 1.35, duration: 150, useNativeDriver: true }),
            Animated.timing(timerPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]).start();
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const celebrate = () => {
    Animated.sequence([Animated.timing(celebAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }), Animated.timing(celebAnim, { toValue: 1, duration: 150, useNativeDriver: true })]).start();
  };

  const advance = (correct) => {
    setTimeout(() => {
      setChosen(null); setTyped(''); setTypedResult(null);
      const isLast = idx + 1 >= q.length;
      if (isLast) {
        playSfx(score + (correct ? 1 : 0) >= q.length / 2 ? 'win' : 'lose');
        setDone(true);
      } else setIdx(i => i + 1);
    }, 800);
  };

  const handleTimeout = () => {
    playSfx('wrong');
    shake();
    setCombo(0);
    if (exType === 'choice') setChosen('__timeout__'); else setTypedResult('bad');
    advance(false);
  };

  const answer = (opt) => {
    if (chosen) return;
    setChosen(opt.id);
    const correct = opt.id === cur.id;
    if (correct) {
      playSfx('rescueSuccess');
      setScore(s => s + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      addGems(newCombo >= 3 ? 5 : 3);
      onRescue && onRescue(cur.trackId, cur.wordId);
      celebrate();
    } else {
      playSfx('wrong'); shake(); setCombo(0);
    }
    advance(correct);
  };

  const submitTyped = () => {
    if (typedResult) return;
    const correct = typed.trim().toLowerCase() === cur.en.toLowerCase();
    setTypedResult(correct ? 'ok' : 'bad');
    if (correct) {
      playSfx('rescueSuccess');
      setScore(s => s + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      addGems(newCombo >= 3 ? 5 : 3);
      onRescue && onRescue(cur.trackId, cur.wordId);
      celebrate();
    } else {
      playSfx('wrong'); shake(); setCombo(0);
    }
    advance(correct);
  };

  if (done) return (
    <View style={rg.doneWrap}>
      {score === q.length ? <Text style={{ fontSize: 56 }}>🦅</Text> :
       score >= q.length / 2 ? <BiboIcon size={56} /> :
       <Text style={{ fontSize: 56 }}>😢</Text>}
      <Text style={rg.doneTitle}>
        {score === q.length
          ? (lang === 'ar' ? 'تم إنقاذ كل الكلمات! 🎉' : 'All words rescued!')
          : (lang === 'ar' ? `تم إنقاذ ${score} من ${q.length}` : `Rescued ${score} of ${q.length}`)}
      </Text>
      <Text style={rg.doneSub}>{score}/{q.length} · +{score * 3} {lang === 'ar' ? 'جوهرة' : 'gems'}</Text>
      <View style={rg.doneBar}><View style={[rg.doneFill, { width: Math.round(score / q.length * 100) + '%' }]} /></View>
      <TouchableOpacity style={rg.doneBtn} onPress={onDone} accessibilityRole="button" accessibilityLabel={lang === 'ar' ? 'رجوع' : 'Back'}><Text style={rg.doneBtnTxt}>{lang === 'ar' ? 'رجوع ←' : 'Back ←'}</Text></TouchableOpacity>
    </View>
  );

  const timerPct = Math.round((timeLeft / diff.seconds) * 100);
  const timerColor = timerPct > 50 ? '#2E8B57' : timerPct > 20 ? '#FFB300' : '#c0392b';

  return (
    <View style={rg.wrap}>
      <View style={rg.progress}><View style={[rg.progressFill, { width: Math.round(idx / q.length * 100) + '%' }]} /></View>
      <View style={rg.topRow}>
        <Text style={rg.counter}>{idx + 1}/{q.length}</Text>
        {combo >= 2 ? (
          <View style={rg.comboWrap}>
            <Text style={rg.comboTxt}>🔥 x{combo}</Text>
          </View>
        ) : null}
        <View style={rg.timerWrap}>
          <Animated.Text style={[rg.timerTxt, { color: timerColor, transform: [{ scale: timerPulse }] }]}>⏱ {timeLeft}s</Animated.Text>
        </View>
      </View>
      <Animated.View style={[rg.wordCard, { transform: [{ translateX: shakeAnim }, { scale: celebAnim }] }]}>
        <Text style={rg.wordEmoji}>{cur.emoji}</Text>
        {exType === 'choice' ? (
          <>
            <Text style={rg.wordEn}>{cur.en}</Text>
            <Text style={rg.wordPron}>{cur.pron}</Text>
          </>
        ) : (
          <>
            <Text style={rg.wordEn}>{cur.ar}</Text>
            <Text style={rg.wordPron}>{cur.pron}</Text>
          </>
        )}
      </Animated.View>

      {exType === 'choice' ? (
        <>
          <Text style={rg.qTxt}>{lang === 'ar' ? 'ما معنى هذه الكلمة؟' : 'What does this mean?'}</Text>
          <View style={rg.opts}>
            {opts.current.map(opt => {
              const isSel = chosen === opt.id; const isOk = opt.id === cur.id;
              const showState = chosen && (isSel || (chosen === '__timeout__' && isOk));
              return (
                <TouchableOpacity key={String(opt.id)} style={[rg.opt, { backgroundColor: !showState ? 'rgba(255,255,255,0.05)' : isOk ? 'rgba(46,139,87,0.3)' : 'rgba(192,57,43,0.3)', borderColor: !showState ? 'rgba(255,255,255,0.12)' : isOk ? '#2E8B57' : '#c0392b' }]}
                  onPress={() => answer(opt)} disabled={!!chosen}>
                  <Text style={rg.optEmoji}>{opt.emoji}</Text>
                  <Text style={rg.optTxt}>{opt.ar}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        <>
          <Text style={rg.qTxt}>{lang === 'ar' ? 'اكتب الكلمة الإنجليزية' : 'Type the English word'}</Text>
          <TextInput
            style={[rg.typeInput, typedResult === 'ok' ? { borderColor: '#2E8B57' } : typedResult === 'bad' ? { borderColor: '#c0392b' } : null]}
            value={typed}
            onChangeText={setTyped}
            editable={!typedResult}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            onSubmitEditing={submitTyped}
          />
          {typedResult === 'bad' ? <Text style={rg.correctAnswerTxt}>{cur.en}</Text> : null}
          <TouchableOpacity style={[rg.submitBtn, typedResult ? { opacity: 0.5 } : null]} onPress={submitTyped} disabled={!!typedResult}>
            <Text style={rg.submitBtnTxt}>{lang === 'ar' ? 'تحقّق' : 'Check'}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const rg = StyleSheet.create({
  wrap:        { width: '100%' },
  progress:    { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressFill:{ height: '100%', backgroundColor: '#c0392b' },
  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  counter:     { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  timerWrap:   { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  timerTxt:    { fontSize: 13, fontWeight: '800' },
  comboWrap:   { backgroundColor: 'rgba(255,179,0,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  comboTxt:    { fontSize: 13, fontWeight: '800', color: '#FFB300' },
  typeInput:   { borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 20, textAlign: 'center', fontWeight: '700', marginBottom: 12 },
  submitBtn:   { backgroundColor: '#c0392b', borderRadius: 13, paddingVertical: 13, alignItems: 'center' },
  submitBtnTxt:{ color: '#fff', fontSize: 15, fontWeight: '700' },
  correctAnswerTxt: { color: '#2E8B57', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  wordCard:    { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 18, padding: 24, alignItems: 'center', marginBottom: 20 },
  wordEmoji:   { fontSize: 52, marginBottom: 10 },
  wordEn:      { fontSize: 30, fontWeight: '900', color: '#fff', marginBottom: 4 },
  wordPron:    { fontSize: 16, color: 'rgba(255,255,255,0.45)' },
  qTxt:        { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 16 },
  opts:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  opt:         { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, minWidth: '44%', alignItems: 'center', gap: 4 },
  optEmoji:    { fontSize: 20 },
  optTxt:      { color: '#fff', fontSize: 14, fontWeight: '600' },
  doneWrap:    { alignItems: 'center', padding: 24 },
  doneTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 16, marginBottom: 6, textAlign: 'center' },
  doneSub:     { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 16 },
  doneBar:     { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 24 },
  doneFill:    { height: '100%', backgroundColor: '#2E8B57' },
  doneBtn:     { backgroundColor: '#1B3A6B', borderRadius: 13, paddingHorizontal: 28, paddingVertical: 13 },
  doneBtnTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default function Rescue({ onBack }) {
  const { lang, gems, addGems, getWordBankWords, rescueWord } = useApp();
  const T = (k) => t(k, lang);
  const [screen, setScreen] = useState('home');
  const [filter, setFilter] = useState('all');
  const [difficulty, setDifficultyState] = useState('medium');
  useEffect(() => {
    AsyncStorage.getItem('rescue_difficulty').then(v => { if (v) setDifficultyState(v); }).catch(() => {});
  }, []);
  const setDifficulty = (key) => {
    setDifficultyState(key);
    AsyncStorage.setItem('rescue_difficulty', key).catch(() => {});
  };

  const allWords = getWordBankWords();
  const urgent = allWords.filter(w => w.episodesLeft <= 0);
  const soon   = allWords.filter(w => w.episodesLeft > 0 && w.episodesLeft <= 1);
  const later  = allWords.filter(w => w.episodesLeft > 1);
  const gameWords = filter === 'urgent' ? urgent : filter === 'soon' ? soon : allWords;

  if (screen === 'game') return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={lang === 'ar' ? 'تمرين الإنقاذ' : 'Rescue Exercise'} onBack={() => setScreen('home')} backLabel={T('back')} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <RescueGame words={gameWords} onDone={() => setScreen('home')} addGems={addGems} onRescue={rescueWord} difficulty={difficulty} lang={lang} />
      </ScrollView>
    </SafeAreaView>
  );

  if (allWords.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <PageHeader title={lang === 'ar' ? 'إنقاذ الكلمات' : 'Word Rescue'} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
        <View style={s.emptyWrap}>
          <BiboCharacter
            state="sleep"
            size={88}
            message={lang === 'ar' ? 'لا توجد كلمات تحتاج إلى إنقاذ بعد! أكمل قصتك أولًا 🐦' : "No words to rescue yet! Keep going with your story first 🐦"}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={lang === 'ar' ? 'إنقاذ الكلمات' : 'Word Rescue'} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <BiboMsg text={
          urgent.length > 0
            ? (lang === 'ar' ? `عندك ${urgent.length} كلمة معرّضة للخطر! أنقذها الآن!` : 'You have ' + urgent.length + ' word(s) at risk! Rescue them now!')
            : (lang === 'ar' ? 'عمل رائع! ما فيه كلمات معرّضة للخطر حاليًا. استمر بالمراجعة للحفاظ على تقدّمك 🌟' : 'Great job! No words at risk right now. Keep reviewing to stay sharp 🌟')
        } color={urgent.length > 0 ? '#c0392b' : '#2E8B57'} />

        <View style={s.statsRow}>
          {[
            { label: lang === 'ar' ? 'اليوم' : 'Today', count: urgent.length, color: '#c0392b', key: 'urgent' },
            { label: lang === 'ar' ? 'قريبًا' : 'Soon',  count: soon.length,   color: '#FFB300', key: 'soon'   },
            { label: lang === 'ar' ? 'لاحقًا' : 'Later', count: later.length,  color: '#2E8B57', key: 'later'  },
          ].map(st => (
            <TouchableOpacity key={st.key}
              style={[s.statCard, { borderColor: st.color + '55', backgroundColor: filter === st.key ? st.color + '22' : 'rgba(255,255,255,0.03)' }]}
              onPress={() => setFilter(filter === st.key ? 'all' : st.key)}
              accessibilityRole="button"
              accessibilityLabel={st.label + ': ' + st.count}>
              <Text style={[s.statCount, { color: st.color }]}>{st.count}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.diffLabel}>{lang === 'ar' ? 'مستوى الصعوبة' : 'Difficulty'}</Text>
        <View style={s.diffRow}>
          {DIFFICULTIES.map(d => (
            <TouchableOpacity
              key={d.key}
              style={[s.diffChip, difficulty === d.key ? s.diffChipActive : null]}
              onPress={() => setDifficulty(d.key)}
              accessibilityRole="button"
              accessibilityLabel={lang === 'ar' ? d.labelAr : d.labelEn}
            >
              <Text style={{ fontSize: 16 }}>{d.icon}</Text>
              <Text style={[s.diffChipTxt, difficulty === d.key ? s.diffChipTxtActive : null]}>{lang === 'ar' ? d.labelAr : d.labelEn}</Text>
              <Text style={s.diffChipSeconds}>{d.seconds}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[s.startBtn, { opacity: urgent.length > 0 ? 1 : 0.4 }]}
          onPress={() => { setFilter('urgent'); setScreen('game'); }}
          disabled={urgent.length === 0}
          accessibilityRole="button"
          accessibilityLabel={lang === 'ar' ? 'أنقذ الكلمات العاجلة' : 'Rescue Urgent Words'}>
          <Text style={{ fontSize: 28 }}>🚨</Text>
          <View>
            <Text style={s.startBtnLabel}>{lang === 'ar' ? 'أنقذ الكلمات العاجلة' : 'Rescue Urgent Words'}</Text>
            <Text style={s.startBtnSub}>{urgent.length} {lang === 'ar' ? 'كلمة معرّضة للخطر' : 'words at risk'}</Text>
          </View>
          <Text style={s.startBtnArrow}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.startBtnSecond} onPress={() => { setFilter('all'); setScreen('game'); }} accessibilityRole="button" accessibilityLabel={lang === 'ar' ? 'تمرين شامل' : 'Full Practice'}>
          <Text style={{ fontSize: 28 }}>🏋️</Text>
          <View>
            <Text style={s.startBtnLabel2}>{lang === 'ar' ? 'تمرين شامل' : 'Full Practice'}</Text>
            <Text style={s.startBtnSub}>{allWords.length} {lang === 'ar' ? 'كلمة' : 'words'}</Text>
          </View>
          <Text style={s.startBtnArrow}>←</Text>
        </TouchableOpacity>

        {urgent.length > 0 ? <Text style={s.listLabel}>{lang === 'ar' ? 'اليوم' : 'Today'}</Text> : null}
        {urgent.map(w => <WordCard key={String(w.id)} word={w} lang={lang} />)}
        {soon.length > 0 ? <Text style={s.listLabel}>{lang === 'ar' ? 'قريبًا' : 'Coming Soon'}</Text> : null}
        {soon.map(w => <WordCard key={String(w.id)} word={w} lang={lang} />)}
        {later.length > 0 ? <Text style={s.listLabel}>{lang === 'ar' ? 'لاحقًا' : 'Later'}</Text> : null}
        {later.map(w => <WordCard key={String(w.id)} word={w} lang={lang} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#08080f' },
  pageContent:   { padding: 16, paddingBottom: 40 },
  emptyWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  statsRow:      { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: 12 },
  statCard:      { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  statCount:     { fontSize: 22, fontWeight: '800' },
  statLabel:     { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  diffLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 },
  diffRow:       { flexDirection: 'row', gap: 8, marginBottom: 16 },
  diffChip:      { flex: 1, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, paddingVertical: 10 },
  diffChipActive:{ borderColor: '#c0392b', backgroundColor: 'rgba(192,57,43,0.15)' },
  diffChipTxt:   { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  diffChipTxtActive: { color: '#fff' },
  diffChipSeconds: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  startBtn:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(192,57,43,0.15)', borderWidth: 1, borderColor: 'rgba(192,57,43,0.4)', borderRadius: 14, padding: 16, marginBottom: 10 },
  startBtnSecond:{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, marginBottom: 20 },
  startBtnLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  startBtnLabel2:{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  startBtnSub:   { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  startBtnArrow: { marginLeft: 'auto', color: '#c0392b', fontSize: 18, fontWeight: '700' },
  listLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, marginTop: 4 },
});
