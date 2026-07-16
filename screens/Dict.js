import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, TextInput, Animated, Easing } from 'react-native';
import * as Speech from 'expo-speech';
import { useApp } from '../context/AppContext';
import { t, TRACKS, COVER_STICKERS } from '../data';
import { SEASONS } from '../data/episodes';
import { buildTemplateVars, fillTemplate } from '../utils/templateEngine';
import { PageHeader, GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import BiboIcon from '../components/BiboIcon';
import { playSfx } from '../utils/sfx';

const BIBO_PARTICLE = require('../assets/bibo/welcome.png');

/** إيموجيات صغيرة (أو أيقونة بيبو) تتطاير من نقطة معيّنة وتختفي — تُستخدم كتفاعل بصري خفيف عند لحظات الفوز/الخسارة */
function FlyingEmojis({ burstKey, emojis }) {
  const anims = useRef(emojis.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    anims.forEach(a => a.setValue(0));
    Animated.stagger(60, anims.map(a => Animated.timing(a, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }))).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstKey]);
  return (
    <View pointerEvents="none" style={fe.wrap}>
      {emojis.map((em, i) => {
        const angle = (i / emojis.length) * Math.PI * 2;
        const tx = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * 60] });
        const ty = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * 60 - 20] });
        const op = anims[i].interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
        const sc = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] });
        const transform = [{ translateX: tx }, { translateY: ty }, { scale: sc }];
        if (em === 'bibo') {
          return <Animated.Image key={i} source={BIBO_PARTICLE} style={[fe.biboImg, { opacity: op, transform }]} />;
        }
        return (
          <Animated.Text key={i} style={[fe.emoji, { opacity: op, transform }]}>
            {em}
          </Animated.Text>
        );
      })}
    </View>
  );
}
const fe = StyleSheet.create({
  wrap:   { position: 'absolute', top: '50%', left: '50%', width: 1, height: 1 },
  emoji:  { position: 'absolute', fontSize: 22 },
  biboImg:{ position: 'absolute', width: 22, height: 22, borderRadius: 11 },
});

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

/** ينطق كلمة إنجليزية مباشرة (للتمارين والمطابقة الصوتية) */
function speakEn(text) {
  try { Speech.stop(); Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 0.95 }); } catch (e) {}
}

const SECTIONS = [
  { key: 'learned',   label: 'Learned',    labelAr: 'متقنة',   icon: '✅', color: '#2E8B57' },
  { key: 'review',    label: 'Review',     labelAr: 'للمراجعة', icon: '🔁', color: '#FFB300' },
  { key: 'forgotten', label: 'Forgotten',  labelAr: 'منسية',   icon: '❌', color: '#c0392b' },
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

/** يختار ملصق هدية عشوائي غير مملوك بعد — يُستخدم كمكافأة نادرة من بيبو عند أداء ممتاز */
function pickGiftSticker(ownedStickers) {
  const available = COVER_STICKERS.filter(st => !ownedStickers.includes(st.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
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
              <Text style={[bl.en, { color: sec.color }]}>{w.word}</Text>
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

function Ex1({ words, onDone, lang }) {
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
      <TouchableOpacity style={ex.doneBtn} onPress={onDone}><Text style={ex.doneBtnTxt}>{lang === 'ar' ? 'التالي ←' : 'Next →'}</Text></TouchableOpacity>
    </View>
  );
  return (
    <View style={ex.card}>
      <Text style={ex.label}>{lang === 'ar' ? `إنجليزي ← عربي (${idx + 1}/${q.length})` : `English → Arabic (${idx + 1}/${q.length})`}</Text>
      <Text style={{ fontSize: 48, marginBottom: 8 }}>{cur.emoji}</Text>
      <TouchableOpacity onPress={() => speakEn(cur.word)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityRole="button" accessibilityLabel="Play pronunciation">
        <Text style={ex.bigWord}>{cur.word}</Text>
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

function Ex2({ words, onDone, lang }) {
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
      <TouchableOpacity style={ex.doneBtn} onPress={onDone}><Text style={ex.doneBtnTxt}>{lang === 'ar' ? 'تم ✓' : 'Done ✓'}</Text></TouchableOpacity>
    </View>
  );
  return (
    <View style={ex.card}>
      <Text style={ex.label}>{lang === 'ar' ? `عربي ← إنجليزي (${idx + 1}/${q.length})` : `Arabic → English (${idx + 1}/${q.length})`}</Text>
      <Text style={{ fontSize: 48, marginBottom: 8 }}>{cur.emoji}</Text>
      <Text style={ex.bigWordAr}>{cur.ar}</Text>
      <Text style={ex.qTxt}>{lang === 'ar' ? 'ما الكلمة الإنجليزية؟' : 'What is the English word?'}</Text>
      <View style={ex.opts}>
        {opts.current.map(w => {
          const isSel = chosen === w.id; const isOk = w.id === cur.id;
          return (
            <TouchableOpacity key={String(w.id)} style={[ex.opt, { backgroundColor: !isSel ? 'rgba(255,255,255,0.05)' : isOk ? 'rgba(46,139,87,0.3)' : 'rgba(192,57,43,0.3)', borderColor: !isSel ? 'rgba(255,255,255,0.1)' : isOk ? '#2E8B57' : '#c0392b' }]}
              onPress={() => answer(w)}>
              <Text style={ex.optTxt}>{w.word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Ex3({ words, onDone, lang }) {
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
    const w = enCol.find(x => x.id === id);
    if (w) speakEn(w.word);
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
      <TouchableOpacity style={ex.doneBtn} onPress={onDone}><Text style={ex.doneBtnTxt}>{lang === 'ar' ? 'تم ✓' : 'Done ✓'}</Text></TouchableOpacity>
    </View>
  );
  return (
    <View style={ex.card}>
      <Text style={ex.label}>{lang === 'ar' ? `مطابقة (${matched.length}/${pairs.length})` : `Matching (${matched.length}/${pairs.length})`}</Text>
      <Text style={ex.qTxt}>{lang === 'ar' ? 'اربط كل كلمة بمعناها' : 'Connect each word with its meaning'}</Text>
      <View style={ex.matchGrid}>
        <View style={ex.matchCol}>
          {enCol.map(w => {
            const isM = matched.includes(w.id); const isSel = selEn === w.id; const isW = wrong.includes(w.id);
            return (
              <TouchableOpacity key={String(w.id)} style={[ex.matchBtn, { borderColor: isM ? '#2E8B57' : isW ? '#c0392b' : isSel ? '#FFB300' : 'rgba(255,255,255,0.1)', backgroundColor: isM ? 'rgba(46,139,87,0.2)' : isW ? 'rgba(192,57,43,0.2)' : isSel ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.04)', opacity: isM ? 0.45 : 1 }]}
                onPress={() => handleEn(w.id)}>
                <Text style={ex.matchTxtEn}>{w.word}</Text>
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

const DUEL_ROUNDS = 6;
const DUEL_TIME = 5; // ثواني لكل جولة
// بدل احتمال ثابت، نجاح بيبو بقى يعتمد على صعوبة الكلمة الفعلية (A1/A2/B1) —
// كلمة سهلة يعرفها بيبو غالبًا، وكلمة صعبة ممكن يتلخبط فيها زي أي متعلم حقيقي
const BIBO_SUCCESS_BY_DIFFICULTY = { A1: 0.85, A2: 0.65, B1: 0.5 };
function biboSuccessChance(word) {
  return BIBO_SUCCESS_BY_DIFFICULTY[word?.difficulty] ?? 0.65;
}

/** مبارزة الكلمات — تحدي سريع مع بيبو، الأدوار تتبادل بين "دورك" و"دور بيبو" */
function Duel({ words, onDone, lang, addGems }) {
  const { ownedStickers, grantSticker } = useApp();
  const rounds = useRef(shuffle(words).slice(0, Math.min(DUEL_ROUNDS, words.length))).current;
  const [idx,        setIdx]        = useState(0);
  const [myScore,    setMyScore]    = useState(0);
  const [biboScore,  setBiboScore]  = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(DUEL_TIME);
  const [phase,      setPhase]      = useState('mine'); // mine | bibo-thinking | bibo-result | done
  const [chosen,     setChosen]     = useState(null);
  const [burst,      setBurst]      = useState({ key: 0, emojis: [] });
  const [gift,       setGift]       = useState(null);

  useEffect(() => { playSfx('duelStart'); }, []);

  const cur = rounds[idx];
  const isMyTurn = idx % 2 === 0;
  const opts = useRef(null);
  if (!opts.current || opts.current._for !== cur?.id) {
    opts.current = cur ? shuffle([cur, ...pick(words, cur.id, 3)]) : [];
    if (cur) opts.current._for = cur.id;
  }

  const fireBurst = (emojis) => setBurst(b => ({ key: b.key + 1, emojis }));

  const nextRound = () => {
    setChosen(null);
    if (idx + 1 >= rounds.length) { setPhase('done'); return; }
    setIdx(i => i + 1);
    setTimeLeft(DUEL_TIME);
    setPhase('mine');
  };

  // مؤقت دور المستخدم
  useEffect(() => {
    if (phase !== 'mine' || !isMyTurn || chosen) return;
    if (timeLeft <= 0) { playSfx('wrong'); fireBurst(['⌛']); setTimeout(runOpponentOrNext, 500); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft, isMyTurn, chosen]);

  const runOpponentOrNext = () => nextRound();

  const answerMine = (w) => {
    if (chosen) return;
    setChosen(w.id);
    const ok = w.id === cur.id;
    if (ok) { setMyScore(s => s + 1); playSfx('correct'); fireBurst(['✅', '⭐']); }
    else { playSfx('wrong'); fireBurst(['💥']); }
    setTimeout(nextRound, 700);
  };

  // دور بيبو: يفكر شوي، بعدين يجاوب باحتمال نجاح ثابت
  useEffect(() => {
    if (phase !== 'mine' || isMyTurn) return;
    setPhase('bibo-thinking');
    const t = setTimeout(() => {
      const ok = Math.random() < biboSuccessChance(cur);
      if (ok) { setBiboScore(s => s + 1); playSfx('win'); fireBurst(['bibo', '✨']); }
      else { playSfx('wrong'); fireBurst(['😵‍💫', '💫']); }
      setPhase('bibo-result');
      setTimeout(nextRound, 1400);
    }, 1300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isMyTurn]);

  // هدية من بيبو عند الفوز — مرة وحدة بس لما نوصل لمرحلة "done"
  useEffect(() => {
    if (phase !== 'done') return;
    if (myScore > biboScore) {
      const st = pickGiftSticker(ownedStickers);
      if (st && grantSticker(st.id)) setGift(st);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === 'done') {
    const won = myScore > biboScore;
    const tie = myScore === biboScore;
    return (
      <View style={ex.card}>
        <FlyingEmojis burstKey={burst.key} emojis={burst.emojis} />
        <BiboCharacter
          state={won ? 'idea' : tie ? 'encourage' : 'celebrate'}
          size={72}
          message={
            won
              ? (lang === 'ar' ? 'فزت هذه المرة! 😭' : 'You won this time! 😭')
              : tie
              ? (lang === 'ar' ? 'تعادلنا! مبارزة أخرى؟' : "It's a tie! Another duel?")
              : (lang === 'ar' ? 'فزت هذه المرة! 😋' : 'I won this time! 😋')
          }
        />
        <Text style={duel.finalScore}>{lang === 'ar' ? 'أنت' : 'You'} {myScore} — {biboScore} {lang === 'ar' ? 'بيبو' : 'Bibo'}</Text>
        {gift ? (
          <View style={duel.giftBox}>
            <Text style={duel.giftEmoji}>{gift.emoji}</Text>
            <Text style={duel.giftTxt}>{lang === 'ar' ? `هدية من بيبو: ${gift.nameAr}! 🎁` : `Gift from Bibo: ${gift.name}! 🎁`}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={ex.doneBtn} onPress={() => { addGems(myScore * 2 + 3); onDone(); }}>
          <Text style={ex.doneBtnTxt}>{lang === 'ar' ? `تم ✓ (+${myScore * 2 + 3} 💎)` : `Done ✓ (+${myScore * 2 + 3} 💎)`}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={ex.card}>
      <FlyingEmojis burstKey={burst.key} emojis={burst.emojis} />
      <View style={duel.scoreRow}>
        <Text style={duel.scoreTxt}>{lang === 'ar' ? 'أنت' : 'You'}: {myScore}</Text>
        <Text style={duel.roundTxt}>{idx + 1}/{rounds.length}</Text>
        <View style={duel.scoreBiboRow}><BiboIcon size={14} /><Text style={duel.scoreTxt}> {lang === 'ar' ? 'بيبو' : 'Bibo'}: {biboScore}</Text></View>
      </View>

      {isMyTurn ? (
        <>
          <View style={duel.timerRow}>
            <Text style={[duel.timerTxt, timeLeft <= 2 ? { color: '#c0392b' } : null]}>⏱ {timeLeft}</Text>
          </View>
          <Text style={ex.label}>{lang === 'ar' ? 'دورك!' : 'Your turn!'}</Text>
          <Text style={{ fontSize: 44, marginBottom: 6 }}>{cur.emoji}</Text>
          <Text style={ex.bigWord}>{cur.word}</Text>
          <Text style={ex.qTxt}>{lang === 'ar' ? 'ما معنى هذه الكلمة؟' : 'What does this mean?'}</Text>
          <View style={ex.opts}>
            {opts.current.map(w => {
              const isSel = chosen === w.id; const isOk = w.id === cur.id;
              return (
                <TouchableOpacity key={String(w.id)} style={[ex.opt, { backgroundColor: !isSel ? 'rgba(255,255,255,0.05)' : isOk ? 'rgba(46,139,87,0.3)' : 'rgba(192,57,43,0.3)', borderColor: !isSel ? 'rgba(255,255,255,0.1)' : isOk ? '#2E8B57' : '#c0392b' }]}
                  onPress={() => answerMine(w)}>
                  <Text style={ex.optTxt}>{w.ar}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        <>
          <Text style={ex.label}>{lang === 'ar' ? 'دور بيبو' : "Bibo's turn"}</Text>
          <BiboCharacter
            state={phase === 'bibo-thinking' ? 'thinking' : biboScore > myScore ? 'celebrate' : 'idea'}
            size={72}
          />
          <Text style={{ fontSize: 36, marginTop: 10 }}>{cur.emoji}</Text>
          <Text style={ex.bigWord}>{cur.word}</Text>
          <Text style={duel.biboStatusTxt}>
            {phase === 'bibo-thinking'
              ? (lang === 'ar' ? 'بيبو يفكّر... 🤔' : 'Bibo is thinking... 🤔')
              : cur.ar}
          </Text>
        </>
      )}
    </View>
  );
}

const CLUMSY_ROUNDS = 5;
// نفس فكرة الاحتمال المتغيّر: كلمة صعبة تخلق فرصة أكبر إن بيبو "يغلط عمدًا"
// (فرصة تعليمية للمستخدم يصحّحله)، وكلمة سهلة يندر يغلط فيها
const CLUMSY_MISTAKE_BY_DIFFICULTY = { A1: 0.25, A2: 0.45, B1: 0.65 };
function biboMistakeChance(word) {
  return CLUMSY_MISTAKE_BY_DIFFICULTY[word?.difficulty] ?? 0.45;
}

/** بيبو المشاكس — بيبو يحاول يجاوب أول، وأحيانًا يخطئ عمدًا، وعلى المستخدم ملاحظة الخطأ وتصحيحه */
function ClumsyBibo({ words, onDone, lang, addGems }) {
  const { ownedStickers, grantSticker } = useApp();
  const rounds = useRef(shuffle(words).slice(0, Math.min(CLUMSY_ROUNDS, words.length))).current;
  const [idx,       setIdx]       = useState(0);
  const [phase,      setPhase]     = useState('thinking'); // thinking | bibo-answered | user-turn | round-done
  const [biboPick,   setBiboPick]  = useState(null);
  const [biboWrong,  setBiboWrong] = useState(false);
  const [userPick,   setUserPick]  = useState(null);
  const [earned,     setEarned]    = useState(0);
  const [burst,      setBurst]     = useState({ key: 0, emojis: [] });
  const [gift,       setGift]      = useState(null);

  const cur = rounds[idx];
  const optsRef = useRef(null);
  if (!optsRef.current || optsRef.current._for !== cur?.id) {
    optsRef.current = cur ? shuffle([cur, ...pick(words, cur.id, 3)]) : [];
    if (cur) optsRef.current._for = cur.id;
  }

  const fireBurst = (emojis) => setBurst(b => ({ key: b.key + 1, emojis }));

  // بيبو يفكّر، بعدين يختار (صح أو غلط عمدًا حسب الاحتمال)
  useEffect(() => {
    if (phase !== 'thinking' || !cur) return;
    const t = setTimeout(() => {
      const wrong = Math.random() < biboMistakeChance(cur);
      const choice = wrong ? optsRef.current.find(w => w.id !== cur.id) : cur;
      setBiboPick(choice.id);
      setBiboWrong(wrong);
      if (wrong) { fireBurst(['😵\u200d💫', '💥']); playSfx('mischief'); }
      else { fireBurst(['✨']); playSfx('correct'); }
      setPhase('bibo-answered');
      setTimeout(() => setPhase('user-turn'), wrong ? 1600 : 1200);
    }, 1300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx]);

  const nextRound = () => {
    setBiboPick(null); setBiboWrong(false); setUserPick(null);
    if (idx + 1 >= rounds.length) { setPhase('done'); return; }
    setIdx(i => i + 1);
    setPhase('thinking');
  };

  // لما بيبو يكون صح: المستخدم بس يأكّد
  const confirmBibo = () => {
    setEarned(e => e + 1); fireBurst(['👍']); playSfx('correct');
    setTimeout(nextRound, 700);
  };

  // لما بيبو يكون غلط: المستخدم لازم يختار الإجابة الصحيحة بنفسه
  const correctBibo = (w) => {
    if (userPick) return;
    setUserPick(w.id);
    const ok = w.id === cur.id;
    if (ok) { setEarned(e => e + 2); fireBurst(['❤️', '✨']); playSfx('win'); }
    else { fireBurst(['💭']); playSfx('wrong'); }
    setTimeout(nextRound, 900);
  };

  // هدية من بيبو لو ساعدته كويس (تصحيح أو تأكيد ناجح بمعظم الجولات)
  useEffect(() => {
    if (phase !== 'done') return;
    if (earned >= rounds.length) {
      const st = pickGiftSticker(ownedStickers);
      if (st && grantSticker(st.id)) setGift(st);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!cur || phase === 'done') {
    return (
      <View style={ex.card}>
        <FlyingEmojis burstKey={burst.key} emojis={burst.emojis} />
        <BiboCharacter state="celebrate" size={72} message={lang === 'ar' ? 'شكرًا لمساعدتك! 🙏' : 'Thanks for your help! 🙏'} />
        <Text style={clumsy.finalScore}>{lang === 'ar' ? `كسبت ${earned * 2} 💎` : `You earned ${earned * 2} 💎`}</Text>
        {gift ? (
          <View style={duel.giftBox}>
            <Text style={duel.giftEmoji}>{gift.emoji}</Text>
            <Text style={duel.giftTxt}>{lang === 'ar' ? `هدية من بيبو: ${gift.nameAr}! 🎁` : `Gift from Bibo: ${gift.name}! 🎁`}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={ex.doneBtn} onPress={() => { addGems(earned * 2); onDone(); }}>
          <Text style={ex.doneBtnTxt}>{lang === 'ar' ? 'تم ✓' : 'Done ✓'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={ex.card}>
      <FlyingEmojis burstKey={burst.key} emojis={burst.emojis} />
      <Text style={clumsy.roundTxt}>{idx + 1}/{rounds.length}</Text>
      <BiboCharacter
        state={phase === 'thinking' ? 'thinking' : biboWrong ? 'attention' : 'celebrate'}
        size={68}
      />
      <Text style={{ fontSize: 38, marginTop: 10 }}>{cur.emoji}</Text>
      <Text style={ex.bigWord}>{cur.word}</Text>

      {phase === 'thinking' ? (
        <Text style={clumsy.statusTxt}>{lang === 'ar' ? 'بيبو يفكّر بمعنى الكلمة... 🤔' : "Bibo is thinking about the word's meaning... 🤔"}</Text>
      ) : (
        <>
          <View style={clumsy.optsWrap}>
            {optsRef.current.map(w => {
              const isBiboPick = biboPick === w.id;
              const isUserPick = userPick === w.id;
              const isCorrectAns = w.id === cur.id;
              const showResult = phase === 'user-turn' && userPick;
              let bg = 'rgba(255,255,255,0.05)', bd = 'rgba(255,255,255,0.1)';
              if (isBiboPick) { bg = biboWrong ? 'rgba(192,57,43,0.25)' : 'rgba(46,139,87,0.25)'; bd = biboWrong ? '#c0392b' : '#2E8B57'; }
              if (showResult && isUserPick) { bg = isCorrectAns ? 'rgba(46,139,87,0.3)' : 'rgba(192,57,43,0.3)'; bd = isCorrectAns ? '#2E8B57' : '#c0392b'; }
              return (
                <View key={String(w.id)} style={[clumsy.opt, { backgroundColor: bg, borderColor: bd }]}>
                  <Text style={ex.optTxt}>{w.ar}</Text>
                  {isBiboPick ? <BiboIcon size={16} style={clumsy.biboTag} /> : null}
                </View>
              );
            })}
          </View>

          {phase === 'bibo-answered' ? (
            <Text style={clumsy.statusTxt}>
              {biboWrong ? (lang === 'ar' ? 'بيبو غير متأكد من إجابته... 😳' : "Bibo isn't sure about this one... 😳") : (lang === 'ar' ? 'بيبو يبدو واثقًا! ✨' : 'Bibo looks confident! ✨')}
            </Text>
          ) : biboWrong && !userPick ? (
            <>
              <Text style={clumsy.promptTxt}>{lang === 'ar' ? 'بيبو أخطأ! اختر الإجابة الصحيحة لتصحيحه 👇' : 'Bibo got it wrong! Tap the correct answer to fix it 👇'}</Text>
              <View style={clumsy.fixRow}>
                {optsRef.current.filter(w => w.id !== biboPick).map(w => (
                  <TouchableOpacity key={String(w.id)} style={clumsy.fixBtn} onPress={() => correctBibo(w)}>
                    <Text style={clumsy.fixBtnTxt}>{w.ar}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : !biboWrong && !userPick ? (
            <TouchableOpacity style={clumsy.confirmBtn} onPress={confirmBibo}>
              <Text style={clumsy.confirmBtnTxt}>{lang === 'ar' ? '👍 بيبو صح، تابع' : '👍 Bibo is right, continue'}</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}

const TEACH_ROUNDS = 4;

/** علّم بيبو (تحدي الأدوار المعكوسة) — بيبو نسي كلمة ويطلب مساعدتك، وعليك كتابتها بنفسك لتُعلّمه إياها */
function TeachBibo({ words, onDone, lang, addGems }) {
  const rounds = useRef(shuffle(words).slice(0, Math.min(TEACH_ROUNDS, words.length))).current;
  const [idx,     setIdx]     = useState(0);
  const [typed,   setTyped]   = useState('');
  const [phase,   setPhase]   = useState('asking'); // asking | correct | wrong | done
  const [earned,  setEarned]  = useState(0);
  const [burst,   setBurst]   = useState({ key: 0, emojis: [] });

  const cur = rounds[idx];
  const fireBurst = (emojis) => setBurst(b => ({ key: b.key + 1, emojis }));

  const nextRound = () => {
    setTyped('');
    if (idx + 1 >= rounds.length) { setPhase('done'); return; }
    setIdx(i => i + 1);
    setPhase('asking');
  };

  const submit = () => {
    if (phase !== 'asking') return;
    const ok = typed.trim().toLowerCase() === cur.word.toLowerCase();
    if (ok) { setEarned(e => e + 2); setPhase('correct'); playSfx('correct'); fireBurst(['✨', '🙏']); }
    else { setPhase('wrong'); playSfx('wrong'); fireBurst(['😳']); }
    setTimeout(nextRound, ok ? 1300 : 1800);
  };

  if (!cur || phase === 'done') {
    return (
      <View style={ex.card}>
        <FlyingEmojis burstKey={burst.key} emojis={burst.emojis} />
        <BiboCharacter state="celebrate" size={72} message={lang === 'ar' ? 'شكرًا لأنك علّمتني! 🙏' : 'Thanks for teaching me! 🙏'} />
        <Text style={clumsy.finalScore}>{lang === 'ar' ? `كسبت ${earned} 💎` : `You earned ${earned} 💎`}</Text>
        <TouchableOpacity style={ex.doneBtn} onPress={() => { addGems(earned); onDone(); }}>
          <Text style={ex.doneBtnTxt}>{lang === 'ar' ? 'تم ✓' : 'Done ✓'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={ex.card}>
      <FlyingEmojis burstKey={burst.key} emojis={burst.emojis} />
      <Text style={clumsy.roundTxt}>{idx + 1}/{rounds.length}</Text>
      <BiboCharacter
        state={phase === 'asking' ? 'attention' : phase === 'correct' ? 'celebrate' : 'encourage'}
        size={68}
        message={
          phase === 'asking'
            ? (lang === 'ar' ? 'همم... نسيت هذه الكلمة، ساعدني! 🤔' : "Hmmm... I forgot this word, help me! 🤔")
            : phase === 'correct'
            ? (lang === 'ar' ? 'آها! فهمت، شكرًا! ✨' : 'Aha! Got it, thanks! ✨')
            : (lang === 'ar' ? `أوبس! الكلمة الصح هي "${cur.word}"` : `Oops! The right word was "${cur.word}"`)
        }
      />
      <Text style={{ fontSize: 38, marginTop: 10 }}>{cur.emoji}</Text>
      <Text style={teach.meaningTxt}>{cur.ar}</Text>
      <View style={teach.inputRow}>
        <TextInput
          style={[teach.input, phase === 'correct' ? { borderColor: '#2E8B57' } : phase === 'wrong' ? { borderColor: '#c0392b' } : null]}
          value={typed}
          onChangeText={setTyped}
          editable={phase === 'asking'}
          onSubmitEditing={submit}
          placeholder={lang === 'ar' ? 'اكتب الكلمة بالإنجليزي...' : 'Type the word in English...'}
          placeholderTextColor="rgba(255,255,255,0.25)"
          autoCapitalize="none"
          returnKeyType="done"
        />
        {phase === 'asking' ? (
          <TouchableOpacity style={teach.checkBtn} onPress={submit}>
            <Text style={teach.checkBtnTxt}>✓</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const SENTENCE_ROUNDS = 4;
const SENTENCE_TIME = 20; // ثواني لترتيب الجملة كل جولة
// مفيش بيانات صعوبة لكل كلمة هنا (الجُمل من قصص التعاون)، فبنستخدم طول
// الجملة كمقياس واقعي للصعوبة — جملة قصيرة يرتّبها بيبو غالبًا صح، وجملة
// طويلة فرصة أكبر يتلخبط فيها
function biboSentenceChance(sentence) {
  const wc = sentence.split(' ').filter(Boolean).length;
  if (wc <= 4) return 0.8;
  if (wc <= 7) return 0.6;
  return 0.4;
}

function stripPunct(w) { return w.replace(/[.,!?"']/g, ''); }

/** يجمع جملًا قصيرة (٣-٩ كلمات) من محتوى الحلقات الحقيقي عبر كل المسارات، بعد استبدال متغيرات المستخدم مثل {{user_name}} */
function getRealSentencePool(vars) {
  const all = [];
  Object.values(SEASONS).forEach(season => {
    (season.episodes || []).forEach(ep => {
      (ep.lines || []).forEach(line => {
        if (!line.text) return;
        const filled = fillTemplate(stripPunct(line.text), vars);
        const wc = filled.split(' ').filter(Boolean).length;
        if (wc >= 3 && wc <= 9) all.push(filled);
      });
    });
  });
  return all;
}

/** مبارزة الجمل — نفس فكرة مبارزة الكلمات بس بجمل قصيرة كاملة من محتوى الحلقات الحقيقي، ترتيب بدل اختيار */
function SentenceDuel({ lang, onDone, addGems }) {
  const { user } = useApp();
  const allLines = useRef(
    shuffle(getRealSentencePool(buildTemplateVars(user)))
  ).current;
  const rounds = useRef(allLines.slice(0, Math.min(SENTENCE_ROUNDS, allLines.length))).current;

  const [idx,       setIdx]       = useState(0);
  const [myScore,   setMyScore]   = useState(0);
  const [biboScore, setBiboScore] = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(SENTENCE_TIME);
  const [phase,     setPhase]     = useState('mine'); // mine | bibo-thinking | bibo-result | done
  const [picked,    setPicked]    = useState([]);
  const [burst,     setBurst]     = useState({ key: 0, emojis: [] });

  useEffect(() => { playSfx('duelStart'); }, []);

  const cur = rounds[idx];
  const isMyTurn = idx % 2 === 0;
  const wordsRef = useRef(null);
  const targetWords = cur ? cur.split(' ') : [];
  if (!wordsRef.current || wordsRef.current._for !== idx) {
    wordsRef.current = shuffle(targetWords);
    wordsRef.current._for = idx;
  }

  const fireBurst = (emojis) => setBurst(b => ({ key: b.key + 1, emojis }));

  const nextRound = () => {
    setPicked([]);
    if (idx + 1 >= rounds.length) { setPhase('done'); return; }
    setIdx(i => i + 1);
    setTimeLeft(SENTENCE_TIME);
    setPhase('mine');
  };

  useEffect(() => {
    if (phase !== 'mine' || !isMyTurn) return;
    if (timeLeft <= 0) { playSfx('wrong'); fireBurst(['⌛']); setTimeout(nextRound, 500); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft, isMyTurn, picked]);

  const pickWord = (w, i) => {
    if (picked.some(p => p.i === i)) return;
    const next = [...picked, { w, i }];
    setPicked(next);
    playSfx('writing');
    if (next.length === targetWords.length) {
      const ok = next.every((p, k) => p.w === targetWords[k]);
      if (ok) { setMyScore(s => s + 1); playSfx('correct'); fireBurst(['✅', '⭐']); }
      else { playSfx('wrong'); fireBurst(['💥']); }
      setTimeout(nextRound, 800);
    }
  };

  useEffect(() => {
    if (phase !== 'mine' || isMyTurn) return;
    setPhase('bibo-thinking');
    const t = setTimeout(() => {
      const ok = Math.random() < biboSentenceChance(cur);
      if (ok) { setBiboScore(s => s + 1); playSfx('win'); fireBurst(['bibo', '✨']); }
      else { playSfx('wrong'); fireBurst(['😵‍💫']); }
      setPhase('bibo-result');
      setTimeout(nextRound, 1600);
    }, 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isMyTurn]);

  if (!cur || phase === 'done') {
    const won = myScore > biboScore;
    const tie = myScore === biboScore;
    return (
      <View style={ex.card}>
        <FlyingEmojis burstKey={burst.key} emojis={burst.emojis} />
        <BiboCharacter
          state={won ? 'idea' : tie ? 'encourage' : 'celebrate'}
          size={72}
          message={
            won ? (lang === 'ar' ? 'فزت هذه المرة! 😭' : 'You won this time! 😭') :
            tie ? (lang === 'ar' ? 'تعادلنا! مبارزة أخرى؟' : "It's a tie! Another duel?") :
            (lang === 'ar' ? 'فزت هذه المرة! 😋' : 'I won this time! 😋')
          }
        />
        <Text style={duel.finalScore}>{lang === 'ar' ? 'أنت' : 'You'} {myScore} — {biboScore} {lang === 'ar' ? 'بيبو' : 'Bibo'}</Text>
        <TouchableOpacity style={ex.doneBtn} onPress={() => { addGems(myScore * 4 + 3); onDone(); }}>
          <Text style={ex.doneBtnTxt}>{lang === 'ar' ? `تم ✓ (+${myScore * 4 + 3} 💎)` : `Done ✓ (+${myScore * 4 + 3} 💎)`}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={ex.card}>
      <FlyingEmojis burstKey={burst.key} emojis={burst.emojis} />
      <View style={duel.scoreRow}>
        <Text style={duel.scoreTxt}>{lang === 'ar' ? 'أنت' : 'You'}: {myScore}</Text>
        <Text style={duel.roundTxt}>{idx + 1}/{rounds.length}</Text>
        <View style={duel.scoreBiboRow}><BiboIcon size={14} /><Text style={duel.scoreTxt}> {lang === 'ar' ? 'بيبو' : 'Bibo'}: {biboScore}</Text></View>
      </View>

      {isMyTurn ? (
        <>
          <View style={duel.timerRow}>
            <Text style={[duel.timerTxt, timeLeft <= 5 ? { color: '#c0392b' } : null]}>⏱ {timeLeft}</Text>
          </View>
          <Text style={ex.label}>{lang === 'ar' ? 'رتّب الجملة!' : 'Arrange the sentence!'}</Text>
          <View style={teach.inputRow}>
            <View style={[s.builtRow, { minHeight: 44 }]}>
              {picked.length === 0 ? <Text style={s.builtPlaceholder}>...</Text> : picked.map((p, i) => (
                <View key={String(i)} style={s.builtChip}><Text style={s.builtChipTxt}>{p.w}</Text></View>
              ))}
            </View>
          </View>
          <View style={s.chipsRow}>
            {wordsRef.current.map((w, i) => {
              const used = picked.some(p => p.i === i);
              if (used) return null;
              return (
                <TouchableOpacity key={String(i)} style={s.arrangeChip} onPress={() => pickWord(w, i)}>
                  <Text style={s.arrangeChipTxt}>{w}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        <>
          <Text style={ex.label}>{lang === 'ar' ? 'دور بيبو' : "Bibo's turn"}</Text>
          <BiboCharacter state={phase === 'bibo-thinking' ? 'thinking' : biboScore > myScore ? 'celebrate' : 'idea'} size={72} />
          <Text style={duel.biboStatusTxt}>
            {phase === 'bibo-thinking'
              ? (lang === 'ar' ? 'بيبو يرتّب الجملة... 🤔' : 'Bibo is arranging the sentence... 🤔')
              : cur}
          </Text>
        </>
      )}
    </View>
  );
}

const teach = StyleSheet.create({
  meaningTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 15, marginTop: 8, marginBottom: 16, fontWeight: '600' },
  inputRow:   { flexDirection: 'row', gap: 8, width: '100%' },
  input:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 11, color: '#fff', fontSize: 15 },
  checkBtn:   { width: 46, borderRadius: 10, backgroundColor: '#1B3A6B', alignItems: 'center', justifyContent: 'center' },
  checkBtnTxt:{ color: '#fff', fontSize: 20, fontWeight: '700' },
});

const clumsy = StyleSheet.create({
  roundTxt:    { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6 },
  statusTxt:   { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 10, textAlign: 'center' },
  promptTxt:   { color: '#FFB300', fontSize: 13, fontWeight: '700', marginTop: 10, marginBottom: 10, textAlign: 'center' },
  optsWrap:    { width: '100%', marginTop: 14, gap: 8 },
  opt:         { borderWidth: 1.5, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  biboTag:     { marginLeft: 6 },
  fixRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  fixBtn:      { borderWidth: 1, borderColor: '#2E8B57', backgroundColor: 'rgba(46,139,87,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  fixBtnTxt:   { color: '#a5d6a7', fontSize: 13, fontWeight: '700' },
  confirmBtn:  { backgroundColor: 'rgba(46,139,87,0.25)', borderWidth: 1, borderColor: '#2E8B57', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11, marginTop: 8 },
  confirmBtnTxt:{ color: '#a5d6a7', fontSize: 14, fontWeight: '700' },
  finalScore:  { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 12, marginBottom: 4 },
});

const duel = StyleSheet.create({
  giftBox:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,179,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,179,0,0.4)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8, marginBottom: 4 },
  giftEmoji:      { fontSize: 24 },
  giftTxt:        { color: '#FFB300', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  scoreRow:       { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  scoreTxt:       { color: '#fff', fontSize: 13, fontWeight: '700' },
  scoreBiboRow:   { flexDirection: 'row', alignItems: 'center' },
  roundTxt:       { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  timerRow:       { marginBottom: 8 },
  timerTxt:       { fontSize: 18, fontWeight: '800', color: '#FFB300' },
  biboStatusTxt:  { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8 },
  finalScore:     { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 12, marginBottom: 4 },
});

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

export default function Dict({ onBack, onNav, initialMode }) {
  const { lang, gems, addGems, getWordBankWords } = useApp();
  const T = (k) => t(k, lang);
  const [section, setSection] = useState(null);
  const [mode,    setMode]    = useState(null);
  const [exKey,   setExKey]   = useState(0);
  const [search,      setSearch]      = useState('');
  const [trackFilter, setTrackFilter] = useState('all');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [directLaunch, setDirectLaunch] = useState(false);

  const allWordsRaw = getWordBankWords();

  // لو الشاشة اتفتحت مباشرة بوضع معيّن (مثلاً من "المنافسة مع بيبو")، ابدأ فيه فورًا
  // باستخدام كل الكلمات المتقنة، بدون المرور بشاشة اختيار القسم
  useEffect(() => {
    if (initialMode && (initialMode === 'sentenceDuel' || allWordsRaw.length >= 4)) {
      setDirectLaunch(true);
      setExKey(k => k + 1);
      setMode(initialMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // المسارات التي توجد فيها كلمات فعليًا (لا نعرض فلتر لمسار لا يحتوي كلمات)
  const availableTracks = useMemo(() => {
    const ids = new Set(allWordsRaw.map(w => w.trackId));
    return TRACKS.filter(tr => ids.has(tr.id));
  }, [allWordsRaw]);

  const allWords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allWordsRaw.filter(w => {
      if (trackFilter !== 'all' && w.trackId !== trackFilter) return false;
      if (typeFilter !== 'all' && classifyGrammar(w.grammar) !== typeFilter) return false;
      if (q && !w.word.toLowerCase().includes(q) && !w.ar.includes(q)) return false;
      return true;
    });
  }, [allWordsRaw, search, trackFilter, typeFilter]);

  const hasActiveFilters = search.trim() || trackFilter !== 'all' || typeFilter !== 'all';
  const reviewWords  = allWords.filter(w => w.status === 'review' || w.status === 'forgotten');
  const learnedWords = allWordsRaw.filter(w => w.status === 'learned');
  const exWords = directLaunch
    ? (learnedWords.length >= 4 ? learnedWords : allWordsRaw)
    : (section ? allWords.filter(w => w.status === section) : reviewWords);
  const secData     = SECTIONS.find(s => s.key === section);

  const startEx = (m) => { setExKey(k => k + 1); setMode(m); };
  const endEx   = () => { setMode(null); if (directLaunch) { setDirectLaunch(false); onBack(); } };

  if (mode) return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={mode === 'ex1' ? (lang === 'ar' ? 'إنجليزي ← عربي' : 'English → Arabic') : mode === 'ex2' ? (lang === 'ar' ? 'عربي ← إنجليزي' : 'Arabic → English') : mode === 'duel' ? (lang === 'ar' ? 'مبارزة بالكلمات' : 'Word Duel') : mode === 'sentenceDuel' ? (lang === 'ar' ? 'مبارزة بالجمل' : 'Sentence Duel') : mode === 'clumsy' ? (lang === 'ar' ? 'بيبو المشاكس' : 'Clumsy Bibo') : mode === 'teach' ? (lang === 'ar' ? 'علّم بيبو' : 'Teach Bibo') : (lang === 'ar' ? 'مطابقة' : 'Matching')} onBack={endEx} backLabel={T('back')} />
      <ScrollView contentContainerStyle={s.pageContent}>
        {mode === 'ex1' ? <Ex1 key={String(exKey)} words={exWords} onDone={endEx} lang={lang} /> :
         mode === 'ex2' ? <Ex2 key={String(exKey)} words={exWords} onDone={endEx} lang={lang} /> :
         mode === 'duel' ? <Duel key={String(exKey)} words={exWords} onDone={endEx} lang={lang} addGems={addGems} /> :
         mode === 'sentenceDuel' ? <SentenceDuel key={String(exKey)} onDone={endEx} lang={lang} addGems={addGems} /> :
         mode === 'clumsy' ? <ClumsyBibo key={String(exKey)} words={exWords} onDone={endEx} lang={lang} addGems={addGems} /> :
         mode === 'teach' ? <TeachBibo key={String(exKey)} words={exWords} onDone={endEx} lang={lang} addGems={addGems} /> :
         <Ex3 key={String(exKey)} words={exWords} onDone={endEx} lang={lang} />}
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
        <BiboCharacter
          layout="row"
          size={52}
          style={{ marginBottom: 14 }}
          state="idea"
          message={lang === 'ar' ? 'راجع كلماتك القديمة يوميًا حتى لا تنساها! 💡' : 'Review old words daily so you never forget them! 💡'}
        />
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
              <Text style={s.rescueLinkTitle}>{lang === 'ar' ? 'إنقاذ الكلمات' : 'Word Rescue'}</Text>
              <Text style={s.rescueLinkSub}>{lang === 'ar' ? 'كلمات على وشك النسيان — أنقذها الآن' : 'Words about to be forgotten — rescue them now'}</Text>
            </View>
            <Text style={s.exArrow}>←</Text>
          </TouchableOpacity>
        ) : null}

        {availableTracks.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: 8 }}>
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
          </ScrollView>
        ) : null}

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
            <TouchableOpacity onPress={() => { setSearch(''); setTrackFilter('all'); setTypeFilter('all'); }}>
              <Text style={s.clearFiltersTxt}>{lang === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <>
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

        <Text style={s.exTitle}>{lang === 'ar' ? 'تمارين' : 'Exercises'}</Text>
        <Text style={s.exSub}>{section ? (lang === 'ar' ? 'تمارين لهذا القسم' : 'Exercises for this section') : (lang === 'ar' ? 'تمارين على الكلمات المراجعة والمنسية' : 'Exercises on review and forgotten words')}</Text>
        {exWords.length < 4 ? (
          <Text style={s.exWarnTxt}>
            {lang === 'ar' ? '⚠️ تحتاج 4 كلمات على الأقل لبدء التمرين' : '⚠️ You need at least 4 words in this selection to start an exercise'}
          </Text>
        ) : null}
        {[
          { key: 'ex1', label: lang === 'ar' ? 'إنجليزي ← عربي' : 'English → Arabic', icon: '🔤', sub: lang === 'ar' ? 'اختر المعنى الصحيح بالعربية' : 'Choose the Arabic meaning' },
          { key: 'ex2', label: lang === 'ar' ? 'عربي ← إنجليزي' : 'Arabic → English', icon: '🔡', sub: lang === 'ar' ? 'اختر الكلمة الإنجليزية الصحيحة' : 'Choose the English word'  },
          { key: 'ex3', label: lang === 'ar' ? 'مطابقة' : 'Matching',          icon: '🔗', sub: lang === 'ar' ? 'اربط الكلمات بمعانيها' : 'Connect words with meanings' },
          { key: 'duel', label: lang === 'ar' ? 'مبارزة بالكلمات' : 'Word Duel', icon: '⚔️', sub: lang === 'ar' ? 'تحدٍّ سريع بالوقت — أنت مقابل بيبو' : 'A fast timed challenge — you vs Bibo' },
          { key: 'sentenceDuel', label: lang === 'ar' ? 'مبارزة بالجمل' : 'Sentence Duel', icon: '📝', sub: lang === 'ar' ? 'رتّب جملة كاملة قبل بيبو!' : 'Arrange a full sentence before Bibo!' },
          { key: 'clumsy', label: lang === 'ar' ? 'بيبو المشاكس' : 'Clumsy Bibo', icon: '🤪', sub: lang === 'ar' ? 'بيبو يحاول الإجابة... صحّح له إن أخطأ!' : 'Bibo tries to answer... correct him if he errs!' },
          { key: 'teach', label: lang === 'ar' ? 'علّم بيبو' : 'Teach Bibo', icon: '❓', sub: lang === 'ar' ? 'بيبو نسي كلمة... ساعده يتذكّرها!' : 'Bibo forgot a word... help him remember it!' },
        ].map(e => {
          const gated = e.key !== 'sentenceDuel' && exWords.length < 4;
          return (
          <TouchableOpacity
            key={e.key}
            style={[s.exCard, gated ? { opacity: 0.4 } : null]}
            onPress={() => !gated && startEx(e.key)}
            disabled={gated}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 26 }}>{e.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.exLabel}>{e.label}</Text>
              <Text style={s.exSub2}>{e.sub}</Text>
            </View>
            <Text style={s.exArrow}>←</Text>
          </TouchableOpacity>
          );
        })}
        </>
        )}
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
  exWarnTxt: { color: '#FFB300', fontSize: 12, marginBottom: 10, textAlign: 'center' },
});
