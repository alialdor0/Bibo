import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import ThemedSafeArea from '../components/Themed';
import { t, COVER_STICKERS } from '../data';
import { SEASONS } from '../data/episodes';
import { buildTemplateVars, fillTemplate } from '../utils/templateEngine';
import { PageHeader, BiboMsg, GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import BiboIcon from '../components/BiboIcon';
import { playSfx } from '../utils/sfx';
import { playMoodAmbient, stopAmbient } from '../utils/ambientMusic';
import { speakWord } from '../utils/episodeAudio';

// كل مستوى صعوبة بقى يأثر على ٣ حاجات مش بس الوقت: مزيج أنواع التمارين
// (كل ما الصعوبة زادت، قلّ تمرين الاختيار السهل وزاد الكتابة/الاستماع)
const DIFFICULTIES = [
  { key: 'easy',   labelAr: 'سهل',   labelEn: 'Easy',   seconds: 20, icon: '🐢', mix: { choice: 0.55, reverseChoice: 0.15, listening: 0.15, type: 0.15 } },
  { key: 'medium', labelAr: 'متوسط', labelEn: 'Medium', seconds: 12, icon: '🐇', mix: { choice: 0.30, reverseChoice: 0.25, listening: 0.20, type: 0.25 } },
  { key: 'hard',   labelAr: 'صعب',   labelEn: 'Hard',   seconds: 6,  icon: '🐆', mix: { choice: 0.15, reverseChoice: 0.20, listening: 0.25, type: 0.40 } },
];

/** يختار نوع تمرين عشوائي بشكل مرجَّح حسب مزيج الصعوبة */
function pickWeighted(mix) {
  const r = Math.random();
  let acc = 0;
  for (const [k, w] of Object.entries(mix)) {
    acc += w;
    if (r <= acc) return k;
  }
  return Object.keys(mix)[0];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * ترتيب الكلمات بشكل عشوائي، لكن مرجَّح: الكلمات اللي المستخدم بيغلط فيها كتير
 * (misses) بتميل تظهر بدري في تمرين الإنقاذ عشان تاخد مراجعة أكتر — بدل
 * الاعتماد على عامل الوقت بس كمصدر وحيد للصعوبة.
 */
function weightedShuffleByMisses(words) {
  return words
    .map(w => ({ w, key: Math.pow(Math.random(), 1 / (1 + Math.min(w.misses || 0, 5))) }))
    .sort((a, b) => b.key - a.key)
    .map(x => x.w);
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

function pick(arr, excludeId, n) {
  return shuffle(arr.filter(w => w.id !== excludeId)).slice(0, n);
}

/** يختار ملصق هدية عشوائي غير مملوك بعد — يُستخدم كمكافأة نادرة من بيبو عند أداء ممتاز */
function pickGiftSticker(ownedStickers) {
  const available = COVER_STICKERS.filter(st => !ownedStickers.includes(st.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
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
              <Text style={clumsy.confirmBtnTxt}>{lang === 'ar' ? '👍 بيبو مُصيب، تابع' : '👍 Bibo is right, continue'}</Text>
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
            : (lang === 'ar' ? `الكلمة الصحيحة هي "${cur.word}"` : `Oops! The right word was "${cur.word}"`)
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

function RescueGame({ words, onDone, addGems, onRescue, onResult, difficulty, lang }) {
  const T = (k) => t(k, lang);
  const diff = DIFFICULTIES.find(d => d.key === difficulty) || DIFFICULTIES[1];
  const q       = useRef(weightedShuffleByMisses(shuffle(words))).current;
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
  const exTypeRef = useRef(null);
  if (!exTypeRef.current || exTypeRef.current._for !== cur.id) {
    exTypeRef.current = { type: pickWeighted(diff.mix), _for: cur.id };
  }
  const exType = exTypeRef.current.type; // choice | reverseChoice | listening | type
  const opts = useRef(null);
  if (!opts.current || opts.current._for !== cur.id) {
    opts.current = getOpts(cur, words);
    opts.current._for = cur.id;
  }

  // صفارة إنذار خفيفة عند بدء مهمة الإنقاذ
  useEffect(() => { playSfx('rescueGameStart'); playMoodAmbient('rescueStart'); return () => stopAmbient(); }, []);

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

  // كل ما نتحرك لسؤال جديد بتمرين استماع، ننطق الكلمة تلقائيًا أول مرة
  useEffect(() => {
    if (exType === 'listening') speakWord(cur.en);
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
        const finalScore = score + (correct ? 1 : 0);
        playSfx(finalScore >= q.length / 2 ? 'win' : 'gameOver');
        if (finalScore >= q.length / 2) playMoodAmbient('rescueSuccess'); else stopAmbient();
        setDone(true);
      } else setIdx(i => i + 1);
    }, correct ? 800 : 1700); // وقت أطول بعد الغلط عشان يقدر يقرأ التغذية الراجعة المفصّلة
  };

  const handleTimeout = () => {
    playSfx('wrong');
    shake();
    setCombo(0);
    onResult && onResult(cur.trackId, cur.wordId, false);
    if (exType === 'choice' || exType === 'reverseChoice' || exType === 'listening') setChosen('__timeout__'); else setTypedResult('bad');
    advance(false);
  };

  const answer = (opt) => {
    if (chosen) return;
    setChosen(opt.id);
    const correct = opt.id === cur.id;
    onResult && onResult(cur.trackId, cur.wordId, correct);
    if (correct) {
      playSfx('collect');
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
    onResult && onResult(cur.trackId, cur.wordId, correct);
    if (correct) {
      playSfx('collect');
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
        ) : exType === 'listening' ? (
          <>
            <TouchableOpacity
              onPress={() => speakWord(cur.en)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={lang === 'ar' ? 'استمع للكلمة مرة أخرى' : 'Listen to the word again'}
            >
              <Text style={rg.listenBtn}>🔊</Text>
            </TouchableOpacity>
            <Text style={rg.wordEn}>{chosen ? cur.en : '••••••'}</Text>
            {chosen ? <Text style={rg.wordPron}>{cur.pron}</Text> : null}
          </>
        ) : (
          <>
            <Text style={rg.wordEn}>{cur.ar}</Text>
            <Text style={rg.wordPron}>{cur.pron}</Text>
          </>
        )}
      </Animated.View>

      {exType === 'choice' || exType === 'listening' ? (
        <>
          <Text style={rg.qTxt}>
            {exType === 'listening'
              ? (lang === 'ar' ? 'استمع واختر المعنى الصحيح' : 'Listen and pick the right meaning')
              : (lang === 'ar' ? 'ما معنى هذه الكلمة؟' : 'What does this mean?')}
          </Text>
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
      ) : exType === 'reverseChoice' ? (
        <>
          <Text style={rg.qTxt}>{lang === 'ar' ? 'اختر الكلمة الإنجليزية الصحيحة' : 'Pick the matching English word'}</Text>
          <View style={rg.opts}>
            {opts.current.map(opt => {
              const isSel = chosen === opt.id; const isOk = opt.id === cur.id;
              const showState = chosen && (isSel || (chosen === '__timeout__' && isOk));
              return (
                <TouchableOpacity key={String(opt.id)} style={[rg.opt, { backgroundColor: !showState ? 'rgba(255,255,255,0.05)' : isOk ? 'rgba(46,139,87,0.3)' : 'rgba(192,57,43,0.3)', borderColor: !showState ? 'rgba(255,255,255,0.12)' : isOk ? '#2E8B57' : '#c0392b' }]}
                  onPress={() => answer(opt)} disabled={!!chosen}>
                  <Text style={rg.optEmoji}>{opt.emoji}</Text>
                  <Text style={rg.optTxt}>{opt.en}</Text>
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
          <TouchableOpacity style={[rg.submitBtn, typedResult ? { opacity: 0.5 } : null]} onPress={submitTyped} disabled={!!typedResult}>
            <Text style={rg.submitBtnTxt}>{lang === 'ar' ? 'تحقّق' : 'Check'}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* تغذية راجعة مفصّلة بعد أي إجابة خاطئة (مش مجرد لون أحمر) — تفيد بكل أنواع التمارين */}
      {(chosen === '__timeout__' || typedResult === 'bad' || (chosen && chosen !== cur.id)) ? (
        <View style={rg.feedbackPanel}>
          <Text style={rg.feedbackTitle}>{lang === 'ar' ? 'الكلمة الصحيحة' : 'Correct word'}</Text>
          <View style={rg.feedbackRow}>
            <Text style={rg.feedbackEmoji}>{cur.emoji}</Text>
            <View>
              <Text style={rg.feedbackEn}>{cur.en} <Text style={rg.feedbackPron}>({cur.pron})</Text></Text>
              <Text style={rg.feedbackAr}>{cur.ar}</Text>
            </View>
          </View>
        </View>
      ) : null}
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
  listenBtn:   { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  feedbackPanel: { backgroundColor: 'rgba(46,139,87,0.08)', borderWidth: 1, borderColor: 'rgba(46,139,87,0.3)', borderRadius: 12, padding: 12, marginTop: 14 },
  feedbackTitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  feedbackRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackEmoji: { fontSize: 26 },
  feedbackEn:    { fontSize: 16, fontWeight: '800', color: '#2E8B57' },
  feedbackPron:  { fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.4)' },
  feedbackAr:    { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
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

export default function Rescue({ onBack, initialChallenge }) {
  const { lang, gems, addGems, getWordBankWords, rescueWord, recordWordResult } = useApp();
  const T = (k) => t(k, lang);
  const [screen, setScreen] = useState('home');
  const [filter, setFilter] = useState('all');
  const [challengeMode, setChallengeMode] = useState(initialChallenge || null); // duel | clumsy | teach | sentenceDuel
  const [challengeKey, setChallengeKey] = useState(0);
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
  const learnedWords = allWords.filter(w => w.status === 'learned');

  const startChallenge = (m) => { setChallengeKey(k => k + 1); setChallengeMode(m); };
  const endChallenge = () => setChallengeMode(null);

  if (challengeMode) return (
    <ThemedSafeArea style={s.safe}>
      <PageHeader
        title={
          challengeMode === 'duel' ? (lang === 'ar' ? 'مبارزة بالكلمات' : 'Word Duel') :
          challengeMode === 'clumsy' ? (lang === 'ar' ? 'بيبو المشاكس' : 'Clumsy Bibo') :
          challengeMode === 'teach' ? (lang === 'ar' ? 'علّم بيبو' : 'Teach Bibo') :
          (lang === 'ar' ? 'مبارزة بالجمل' : 'Sentence Duel')
        }
        onBack={endChallenge}
        backLabel={T('back')}
      />
      <ScrollView contentContainerStyle={s.pageContent}>
        {challengeMode === 'duel' ? <Duel key={String(challengeKey)} words={learnedWords} onDone={endChallenge} lang={lang} addGems={addGems} /> :
         challengeMode === 'clumsy' ? <ClumsyBibo key={String(challengeKey)} words={learnedWords} onDone={endChallenge} lang={lang} addGems={addGems} /> :
         challengeMode === 'teach' ? <TeachBibo key={String(challengeKey)} words={learnedWords} onDone={endChallenge} lang={lang} addGems={addGems} /> :
         <SentenceDuel key={String(challengeKey)} onDone={endChallenge} lang={lang} addGems={addGems} />}
      </ScrollView>
    </ThemedSafeArea>
  );

  if (screen === 'game') return (
    <ThemedSafeArea style={s.safe}>
      <PageHeader title={lang === 'ar' ? 'تمرين الإنقاذ' : 'Rescue Exercise'} onBack={() => setScreen('home')} backLabel={T('back')} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <RescueGame words={gameWords} onDone={() => setScreen('home')} addGems={addGems} onRescue={rescueWord} onResult={recordWordResult} difficulty={difficulty} lang={lang} />
      </ScrollView>
    </ThemedSafeArea>
  );

  if (allWords.length === 0) {
    return (
      <ThemedSafeArea style={s.safe}>
        <PageHeader title={lang === 'ar' ? 'إنقاذ الكلمات' : 'Word Rescue'} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
        <View style={s.emptyWrap}>
          <BiboCharacter
            state="sleep"
            size={88}
            message={lang === 'ar' ? 'لا توجد كلمات تحتاج إلى إنقاذ بعد! أكمل قصتك أولًا 🐦' : "No words to rescue yet! Keep going with your story first 🐦"}
          />
        </View>
      </ThemedSafeArea>
    );
  }

  return (
    <ThemedSafeArea style={s.safe}>
      <PageHeader title={lang === 'ar' ? 'إنقاذ الكلمات' : 'Word Rescue'} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <BiboMsg text={
          urgent.length > 0
            ? (lang === 'ar' ? `لديك ${urgent.length} كلمة معرّضة للخطر! أنقذها الآن!` : 'You have ' + urgent.length + ' word(s) at risk! Rescue them now!')
            : (lang === 'ar' ? 'عمل رائع! لا توجد كلمات معرّضة للخطر حاليًا. استمر بالمراجعة للحفاظ على تقدّمك 🌟' : 'Great job! No words at risk right now. Keep reviewing to stay sharp 🌟')
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
        <Text style={s.diffSubLabel}>
          {lang === 'ar' ? 'لكل مستوى وقت ونوع تمارين مختلف' : 'Each level changes both the time and the exercise mix'}
        </Text>
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

        <Text style={s.listLabel}>{lang === 'ar' ? 'تحدَّ بيبو 🎮' : 'Challenge Bibo 🎮'}</Text>
        <Text style={s.diffSubLabel}>
          {learnedWords.length >= 4
            ? (lang === 'ar' ? 'تحديات ممتعة تختبر كلماتك المتقنة ضد بيبو' : 'Fun challenges that test your mastered words against Bibo')
            : (lang === 'ar' ? '⚠️ تحتاج 4 كلمات متقنة على الأقل لبدء التحديات' : '⚠️ You need at least 4 mastered words to start challenges')}
        </Text>
        {[
          { key: 'duel',         label: lang === 'ar' ? 'مبارزة بالكلمات' : 'Word Duel',     icon: '⚔️', sub: lang === 'ar' ? 'تحدٍّ سريع بالوقت — أنت مقابل بيبو' : 'A fast timed challenge — you vs Bibo', gated: learnedWords.length < 4 },
          { key: 'sentenceDuel', label: lang === 'ar' ? 'مبارزة بالجمل' : 'Sentence Duel',   icon: '📝', sub: lang === 'ar' ? 'رتّب جملة كاملة قبل بيبو!' : 'Arrange a full sentence before Bibo!', gated: false },
          { key: 'clumsy',       label: lang === 'ar' ? 'بيبو المشاكس' : 'Clumsy Bibo',       icon: '🤪', sub: lang === 'ar' ? 'بيبو يحاول الإجابة... صحّح له إن أخطأ!' : 'Bibo tries to answer... correct him if he errs!', gated: learnedWords.length < 4 },
          { key: 'teach',        label: lang === 'ar' ? 'علّم بيبو' : 'Teach Bibo',           icon: '❓', sub: lang === 'ar' ? 'بيبو نسي كلمة... ساعده على تذكّرها!' : 'Bibo forgot a word... help him remember it!', gated: learnedWords.length < 4 },
        ].map(ch => (
          <TouchableOpacity
            key={ch.key}
            style={[s.challengeCard, ch.gated ? { opacity: 0.4 } : null]}
            onPress={() => !ch.gated && startChallenge(ch.key)}
            disabled={ch.gated}
            accessibilityRole="button"
            accessibilityLabel={ch.label}
          >
            <Text style={{ fontSize: 24 }}>{ch.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.challengeLabel}>{ch.label}</Text>
              <Text style={s.challengeSub}>{ch.sub}</Text>
            </View>
            <Text style={s.startBtnArrow}>←</Text>
          </TouchableOpacity>
        ))}

        {urgent.length > 0 ? <Text style={s.listLabel}>{lang === 'ar' ? 'اليوم' : 'Today'}</Text> : null}
        {urgent.map(w => <WordCard key={String(w.id)} word={w} lang={lang} />)}
        {soon.length > 0 ? <Text style={s.listLabel}>{lang === 'ar' ? 'قريبًا' : 'Coming Soon'}</Text> : null}
        {soon.map(w => <WordCard key={String(w.id)} word={w} lang={lang} />)}
        {later.length > 0 ? <Text style={s.listLabel}>{lang === 'ar' ? 'لاحقًا' : 'Later'}</Text> : null}
        {later.map(w => <WordCard key={String(w.id)} word={w} lang={lang} />)}
      </ScrollView>
    </ThemedSafeArea>
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
  diffSubLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 8, marginTop: -4 },
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
  challengeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 10 },
  challengeLabel:{ fontSize: 14, fontWeight: '700', color: '#fff' },
  challengeSub:  { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});
