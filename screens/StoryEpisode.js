import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { useApp } from '../context/AppContext';
import { t } from '../data';
import { getEpisode, getTotalEpisodes } from '../data/episodes';
import { buildTemplateVars, fillDeep } from '../utils/templateEngine';
import { biboSay } from '../data/biboPhrases';
import { playSfx } from '../utils/sfx';
import { speakWord, stopWordAudio } from '../utils/episodeAudio';
import BiboCharacter from '../components/BiboCharacter';
import WordInfoModal from '../components/WordInfoModal';
import Avatar from '../components/Avatar';
import CinematicReading from '../components/CinematicReading';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** يبني اختيارات متعددة (الترجمة الصح + 2 مشتتات) لكلمة معينة */
function buildChoices(word, vocabulary) {
  const distractorPool = vocabulary.filter(v => v.id !== word.id && v.arabic !== word.ar);
  const distractors = shuffle(distractorPool).slice(0, 2).map(v => v.arabic);
  return shuffle([word.ar, ...distractors]);
}

export default function StoryEpisode({ onLeave }) {
  const { lang, track, user, addGems, addLibraryEntry, getEpisodeState, completeEpisode, addWordToBank } = useApp();
  const T = (k) => t(k, lang);
  const trackId = track?.id || 'spy';

  const episodeState = getEpisodeState(trackId);
  const episodeNum = episodeState.unlocked || 1;
  const rawEpisode = getEpisode(trackId, episodeNum);
  const totalEpisodes = getTotalEpisodes(trackId);

  const vars = useMemo(() => buildTemplateVars(user), [user]);
  const episode = useMemo(() => rawEpisode ? fillDeep(rawEpisode, vars) : null, [rawEpisode, vars]);

  const [started, setStarted] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [phase, setPhase] = useState('context'); // context | choice | blank | arrange | done
  const [chosen, setChosen] = useState(null);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState(null); // { type, msg }
  const [arrangePicked, setArrangePicked] = useState([]);
  const [gemsThisEpisode, setGemsThisEpisode] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [eliminatedChoice, setEliminatedChoice] = useState(null);
  const [infoWordId, setInfoWordId] = useState(null);
  const [lineHintUsed, setLineHintUsed] = useState(false);
  const [showCinema, setShowCinema] = useState(false);
  const choicesRef = useRef([]);
  const arrangeOptsRef = useRef([]);

  const vocabById = useMemo(() => {
    const map = {};
    (episode?.vocabulary || []).forEach(v => { map[v.id] = v; });
    return map;
  }, [episode]);

  const lines = episode?.lines || [];
  const line = lines[lineIdx];
  const word = line?.words?.[wordIdx];
  const bibo = episode?.bibo_messages || {};

  useEffect(() => { stopWordAudio(); return () => stopWordAudio(); }, []);

  useEffect(() => {
    if (word && phase === 'choice') choicesRef.current = buildChoices(word, episode.vocabulary);
  }, [word, phase]);

  useEffect(() => {
    if (line && phase === 'arrange' && line.arrange_words_exercise) {
      arrangeOptsRef.current = shuffle(line.arrange_words_exercise.words_to_arrange);
      setArrangePicked([]);
    }
  }, [line, phase]);

  // كل ما نتحرك لكلمة/مرحلة جديدة، التلميح يترجع مقفول من الأول
  useEffect(() => {
    setHintVisible(false);
    setEliminatedChoice(null);
  }, [lineIdx, wordIdx, phase]);

  // كل ما نتحرك لسطر جديد، سجل استخدام التلميح يترجع من الأول (لمكافأة "بدون تلميح")
  useEffect(() => { setLineHintUsed(false); }, [lineIdx]);

  const bMsg = (key, fallbackCat) => bibo[key] || biboSay(fallbackCat, lang);

  const flash = (ok, msgKey, fallbackCat) => {
    playSfx(ok ? 'correct' : 'wrong');
    setFeedback({ type: ok ? 'correct' : 'wrong', msg: bMsg(msgKey, fallbackCat) });
    setTimeout(() => setFeedback(null), 900);
  };

  const awardGems = (n) => { addGems(n); setGemsThisEpisode(g => g + n); };

  // بيستخدم بيانات المفردة الكاملة (audio_url الحقيقي) مش نسخة السطر المختصرة
  const playWord = (w) => {
    const full = vocabById[w.id] || w;
    speakWord(full.word, full.audio_url);
  };

  const openWordInfo = (id) => setInfoWordId(id);
  const closeWordInfo = () => setInfoWordId(null);

  // تلميح بيبو الذكي: 50/50 في الاختيار، النطق في إكمال الفراغ، أول كلمة في الترتيب
  const requestHint = () => {
    if (hintVisible || phase === 'context') return;
    playSfx('pageTurn');
    setHintVisible(true);
    setLineHintUsed(true);
    if (phase === 'choice' && !eliminatedChoice) {
      const wrongOpts = choicesRef.current.filter(o => o !== word.ar);
      setEliminatedChoice(wrongOpts[Math.floor(Math.random() * wrongOpts.length)]);
    }
  };

  const hintText = () => {
    if (phase === 'choice') return lang === 'ar' ? 'شيلتلك إجابة غلط 👀' : 'I removed a wrong answer for you 👀';
    if (phase === 'blank')  return (lang === 'ar' ? 'نطقها: ' : 'It sounds like: ') + word.pron;
    if (phase === 'arrange') return (lang === 'ar' ? 'أول كلمة: ' : 'First word: ') + line.arrange_words_exercise.correct_order[0];
    return '';
  };

  const advanceAfterWord = () => {
    const nextWordIdx = wordIdx + 1;
    if (nextWordIdx >= (line.words || []).length) {
      if (line.arrange_words_exercise) { setPhase('arrange'); }
      else finishLine();
    } else {
      setWordIdx(nextWordIdx);
      setPhase('choice');
      setChosen(null); setTyped('');
    }
  };

  const finishLine = () => {
    playSfx('pageTurn');
    const bonusEarned = !lineHintUsed;
    if (bonusEarned) awardGems(2);
    setFeedback({
      type: 'correct',
      msg: bonusEarned
        ? (lang === 'ar' ? 'لعبتها من غير أي تلميح! +2 💎' : 'You did it with no hints! +2 💎')
        : bMsg('line_complete', 'episodeComplete'),
    });
    setTimeout(() => {
      setFeedback(null);
      const nextLine = lineIdx + 1;
      if (nextLine >= lines.length) {
        finishEpisode();
      } else {
        setLineIdx(nextLine);
        setWordIdx(0);
        setPhase('context');
        setChosen(null); setTyped('');
      }
    }, 900);
  };

  const finishEpisode = () => {
    playSfx('win');
    completeEpisode(trackId, episodeNum);
    const allWords = lines.flatMap(l => l.words || []);
    addLibraryEntry({
      trackId,
      episodeId: episodeNum,
      trackName: episode.title,
      trackNameAr: episode.title_arabic,
      icon: track?.icon || '📖',
      color: track?.color || '#2E8B57',
      completedAt: Date.now(),
      words: allWords,
      gemsEarned: gemsThisEpisode,
      lines: (episode.full_episode?.text || lines.map(l => l.text)).map((txt, i) => ({ text: txt, ar: lines[i]?.arabic || '' })),
    });
    setPhase('done');
  };

  const handleChoice = (opt) => {
    if (chosen) return;
    setChosen(opt);
    const ok = opt === word.ar;
    flash(ok, ok ? 'correct_answer' : 'wrong_answer', ok ? 'correct' : 'wrong');
    if (ok) awardGems(1);
    setTimeout(() => {
      if (ok) { setPhase('blank'); setChosen(null); }
      else setChosen(null);
    }, 800);
  };

  const checkBlank = () => {
    const ok = typed.trim().toLowerCase() === word.word.toLowerCase();
    flash(ok, ok ? 'correct_answer' : 'wrong_answer', ok ? 'correct' : 'wrong');
    if (ok) {
      awardGems(1);
      addWordToBank(
        trackId, word.id,
        { word: word.word, ar: word.ar, phonetic: word.phonetic, pron: word.pron, emoji: word.emoji, grammar: word.grammar },
        episodeNum,
        episode.word_expiry?.non_protected_expire_after_episode
      );
      setTimeout(advanceAfterWord, 800);
    } else setTyped('');
  };

  const pickArrangeWord = (w, idx) => {
    if (arrangePicked.some(p => p.idx === idx)) return;
    playSfx('writing');
    setArrangePicked(prev => [...prev, { word: w, idx }]);
  };

  const undoArrangeWord = (idx) => {
    setArrangePicked(prev => prev.filter(p => p.idx !== idx));
  };

  const checkArrange = () => {
    const built = arrangePicked.map(p => p.word);
    const target = line.arrange_words_exercise.correct_order;
    const ok = built.length === target.length && built.every((w, i) => w === target[i]);
    flash(ok, ok ? 'correct_answer' : 'wrong_answer', ok ? 'correct' : 'wrong');
    if (ok) { awardGems(3); setTimeout(finishLine, 800); }
    else { playSfx('eraser'); setTimeout(() => setArrangePicked([]), 500); }
  };

  // ── حلقة مش موجودة (خلصنا الموسم أو مفيش بيانات) ──
  if (!rawEpisode) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <BiboCharacter
            state="celebrate"
            size={92}
            message={lang === 'ar'
              ? (episodeNum > totalEpisodes ? 'خلصت كل حلقات الموسم! مبروك 🏆' : 'الحلقة دي لسه بتتجهز... جرب تاني قريب 📖')
              : (episodeNum > totalEpisodes ? 'You finished the whole season! Congrats 🏆' : "This episode isn't ready yet... check back soon 📖")}
          />
          <TouchableOpacity style={s.restartBtn} onPress={onLeave}>
            <Text style={s.restartTxt}>{lang === 'ar' ? 'رجوع' : 'Back'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── مقدمة الحلقة ──
  if (!started) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.epNum}>{lang === 'ar' ? 'الحلقة' : 'Episode'} {episodeNum}</Text>
          <Text style={s.epTitle}>{lang === 'ar' ? episode.title_arabic : episode.title}</Text>
          <BiboCharacter state="welcome" size={100} message={bMsg('episode_start', 'levelUp')} style={{ marginVertical: 18 }} />
          <TouchableOpacity style={s.startBtn2} onPress={() => { setStarted(true); playSfx('pageTurn'); }}>
            <Text style={s.startBtn2Txt}>▶ {lang === 'ar' ? 'ابدأ' : 'Start'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── خلصت الحلقة ──
  if (phase === 'done') {
    const next = episode.next_episode;
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.center}>
          <BiboCharacter state="celebrate" size={100} message={bMsg('episode_complete', 'episodeComplete')} />
          <View style={s.doneStatsRow}>
            <View style={s.doneStat}><Text style={s.doneStatVal}>{lines.reduce((n, l) => n + (l.words?.length || 0), 0)}</Text><Text style={s.doneStatLbl}>{lang === 'ar' ? 'كلمة' : 'words'}</Text></View>
            <View style={s.doneStat}><Text style={s.doneStatVal}>+{gemsThisEpisode}</Text><Text style={s.doneStatLbl}>💎</Text></View>
          </View>

          <View style={s.wordsSummaryCard}>
            <Text style={s.wordsSummaryTitle}>{lang === 'ar' ? 'الكلمات اللي اتعلمتها 🌟' : 'Words you learned 🌟'}</Text>
            <View style={s.wordsSummaryGrid}>
              {lines.flatMap(l => l.words || []).map((w, i) => (
                <View key={String(w.id) + i} style={s.wordsSummaryChip}>
                  <Text style={s.wordsSummaryEmoji}>{w.emoji}</Text>
                  <Text style={s.wordsSummaryTxt}>{w.word}</Text>
                </View>
              ))}
            </View>
          </View>
          {next ? (
            <View style={s.nextCard}>
              <Text style={s.nextLabel}>{lang === 'ar' ? 'الحلقة الجاية' : 'Next episode'}</Text>
              <Text style={s.nextTitle}>{lang === 'ar' ? next.title_arabic : next.title}</Text>
              <Text style={s.nextPreview}>{next.preview}</Text>
            </View>
          ) : null}
          <TouchableOpacity style={s.cinemaBtn} onPress={() => setShowCinema(true)}>
            <Text style={s.cinemaBtnTxt}>🎬 {lang === 'ar' ? 'اقرأ القصة كاملة' : 'Read the full story'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.restartBtn} onPress={onLeave}>
            <Text style={s.restartTxt}>{lang === 'ar' ? 'رجوع للرئيسية' : 'Back to Home'}</Text>
          </TouchableOpacity>
        </ScrollView>

        <CinematicReading visible={showCinema} episode={episode} lang={lang} onClose={() => setShowCinema(false)} />
      </SafeAreaView>
    );
  }

  // بيدوّر لو السطر الحالي بيتكلم عن شخصية مساعدة (partner) عشان نعرّفها بأفاتار
  const linePartner = (episode.partners || []).find(p => p.name && line.text.includes(p.name));

  // ── مرحلة عرض السطر (context) ──
  const renderContext = () => (
    <View>
      {linePartner ? (
        <View style={s.partnerCard}>
          <Avatar name={linePartner.name} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={s.partnerName}>{linePartner.name}</Text>
            <Text style={s.partnerLoc}>📍 {linePartner.city}, {linePartner.country}</Text>
          </View>
        </View>
      ) : null}
      <View style={s.lineCard}>
        <Text style={s.lineText}>{line.text}</Text>
        <Text style={s.lineAr}>{line.arabic}</Text>
      </View>
      {line.protected_word_ids?.length ? (
        <Text style={s.protectedNote}>{bMsg('protected_word', 'idea')}</Text>
      ) : null}
      <Text style={s.newWordsLabel}>{lang === 'ar' ? 'كلمات جديدة في السطر ده' : 'New words in this line'}</Text>
      <View style={s.chipsRow}>
        {(line.words || []).map((w, i) => (
          <View key={String(w.id) + i} style={s.chipWrap}>
            <TouchableOpacity style={s.chip} onPress={() => playWord(w)}>
              <Text style={s.chipEmoji}>{w.emoji}</Text>
              <Text style={s.chipWord}>{w.word}</Text>
              <Text style={s.chipAr}>{w.ar}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.infoBtn} onPress={() => openWordInfo(w.id)} accessibilityRole="button" accessibilityLabel={lang === 'ar' ? 'معلومات الكلمة' : 'Word info'}>
              <Text style={s.infoBtnTxt}>ℹ️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TouchableOpacity style={s.startBtn2} onPress={() => { setPhase('choice'); setWordIdx(0); }}>
        <Text style={s.startBtn2Txt}>{lang === 'ar' ? 'يلا نتعلم 🎯' : "Let's learn 🎯"}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderChoice = () => (
    <View>
      <View style={s.wordCard}>
        <Text style={s.wordEmojiBig}>{word.emoji}</Text>
        <Text style={s.wordEn}>{word.word}</Text>
        <View style={s.wordCardBtns}>
          <TouchableOpacity onPress={() => playWord(word)} style={s.speakBtn}><Text style={s.speakTxt}>🔊</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => openWordInfo(word.id)} style={s.speakBtn}><Text style={s.speakTxt}>ℹ️</Text></TouchableOpacity>
        </View>
      </View>
      <Text style={s.qLabel}>{lang === 'ar' ? 'اختر الترجمة الصحيحة' : 'Choose the correct meaning'} · {wordIdx + 1}/{line.words.length}</Text>
      {choicesRef.current.filter(opt => opt !== eliminatedChoice).map((opt, i) => {
        const isChosen = chosen === opt;
        const isCorrect = opt === word.ar;
        const showState = chosen && (isChosen || isCorrect);
        return (
          <TouchableOpacity
            key={String(i)}
            style={[s.optBtn, showState ? (isCorrect ? s.optCorrect : s.optWrong) : null]}
            onPress={() => handleChoice(opt)}
            disabled={!!chosen}
          >
            <Text style={s.optTxt}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderBlank = () => {
    const sentence = line.text.replace(new RegExp(word.word, 'i'), '____');
    return (
      <View>
        <View style={s.blankTopRow}>
          <Text style={[s.qLabel, { flex: 1, marginBottom: 0 }]}>{lang === 'ar' ? 'أكمل الجملة من القصة' : 'Complete the sentence'} · {wordIdx + 1}/{line.words.length}</Text>
          <TouchableOpacity onPress={() => openWordInfo(word.id)}><Text style={s.speakTxt}>ℹ️</Text></TouchableOpacity>
        </View>
        <Text style={s.blankSentence}>{sentence}</Text>
        {hintVisible ? <Text style={s.blankHint}>💡 {hintText()}</Text> : null}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={typed}
            onChangeText={(v) => { setTyped(v); playSfx('writing'); }}
            onSubmitEditing={checkBlank}
            placeholder={word.phonetic}
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCapitalize="none"
            returnKeyType="done"
          />
          <TouchableOpacity style={s.checkBtn} onPress={checkBlank}>
            <Text style={s.checkBtnTxt}>✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderArrange = () => {
    const ex = line.arrange_words_exercise;
    return (
      <View>
        <Text style={s.qLabel}>{lang === 'ar' ? 'رتّب الكلمات لتكوين السطر' : 'Arrange the words'}</Text>
        <Text style={s.lineAr}>{ex.arabic}</Text>
        {hintVisible ? <Text style={s.blankHint}>💡 {hintText()}</Text> : null}
        <View style={s.builtRow}>
          {arrangePicked.length === 0 ? <Text style={s.builtPlaceholder}>...</Text> : arrangePicked.map((p, i) => (
            <TouchableOpacity key={String(i)} style={s.builtChip} onPress={() => undoArrangeWord(p.idx)}>
              <Text style={s.builtChipTxt}>{p.word}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.chipsRow}>
          {arrangeOptsRef.current.map((w, i) => {
            const used = arrangePicked.some(p => p.idx === i);
            return (
              <TouchableOpacity key={String(i)} style={[s.arrangeChip, used ? { opacity: 0.25 } : null]} disabled={used} onPress={() => pickArrangeWord(w, i)}>
                <Text style={s.arrangeChipTxt}>{w}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={[s.startBtn2, arrangePicked.length === 0 ? { opacity: 0.4 } : null]} disabled={arrangePicked.length === 0} onPress={checkArrange}>
          <Text style={s.startBtn2Txt}>✓ {lang === 'ar' ? 'تحقق' : 'Check'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.leaveBtn} onPress={onLeave}><Text style={s.leaveTxt}>← {T('leave')}</Text></TouchableOpacity>
        <Text style={s.headerInfo}>{lang === 'ar' ? 'حلقة' : 'Ep'} {episodeNum} · {lineIdx + 1}/{lines.length}</Text>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        <BiboCharacter
          layout="row"
          size={52}
          style={{ marginBottom: 14 }}
          state={feedback?.type === 'correct' ? 'celebrate' : feedback?.type === 'wrong' ? 'encourage' : phase === 'arrange' ? 'thinking' : 'attention'}
          message={
            feedback ? feedback.msg :
            hintVisible ? hintText() :
            ['choice', 'blank', 'arrange'].includes(phase) ? (lang === 'ar' ? 'محتاج مساعدة؟ دوسني 💡' : 'Need help? Tap me 💡') :
            undefined
          }
          onPress={['choice', 'blank', 'arrange'].includes(phase) ? requestHint : undefined}
          hintBadge={['choice', 'blank', 'arrange'].includes(phase) && !hintVisible}
        />
        {phase === 'context' ? renderContext() :
         phase === 'choice' ? renderChoice() :
         phase === 'blank' ? renderBlank() :
         phase === 'arrange' ? renderArrange() : null}
      </ScrollView>

      <WordInfoModal
        visible={!!infoWordId}
        word={vocabById[infoWordId]}
        lang={lang}
        onClose={closeWordInfo}
        onPlay={() => infoWordId && playWord({ id: infoWordId, word: vocabById[infoWordId]?.word })}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#08080f' },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  leaveBtn:        { paddingVertical: 6 },
  leaveTxt:        { color: '#a5d6a7', fontSize: 14, fontWeight: '600' },
  headerInfo:      { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  body:            { padding: 18, paddingBottom: 50 },

  epNum:           { color: '#a5d6a7', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  epTitle:         { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  startBtn2:       { backgroundColor: '#2E8B57', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 10 },
  startBtn2Txt:    { color: '#fff', fontWeight: '800', fontSize: 15, textAlign: 'center' },

  lineCard:        { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 18, marginBottom: 12 },
  partnerCard:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 10, marginBottom: 10 },
  partnerName:     { color: '#fff', fontWeight: '800', fontSize: 13 },
  partnerLoc:      { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 1 },
  lineText:        { color: '#fff', fontSize: 17, lineHeight: 26, marginBottom: 8 },
  lineAr:          { color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 22 },
  protectedNote:   { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12, fontStyle: 'italic' },
  newWordsLabel:   { color: '#fff', fontWeight: '700', fontSize: 13, marginBottom: 8 },
  chipsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chipWrap:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chip:            { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center', minWidth: 70 },
  chipEmoji:       { fontSize: 18 },
  chipWord:        { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 2 },
  chipAr:          { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  infoBtn:         { padding: 6 },
  infoBtnTxt:      { fontSize: 15 },

  wordCard:        { alignItems: 'center', marginBottom: 20 },
  wordEmojiBig:    { fontSize: 46 },
  wordEn:          { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 6 },
  wordCardBtns:    { flexDirection: 'row', gap: 14, marginTop: 8 },
  speakBtn:        { padding: 6 },
  speakTxt:        { fontSize: 22 },
  qLabel:          { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  blankTopRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  optBtn:          { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, marginBottom: 10 },
  optTxt:          { color: '#fff', fontSize: 15, textAlign: 'center' },
  optCorrect:      { borderColor: '#2E8B57', backgroundColor: 'rgba(46,139,87,0.2)' },
  optWrong:        { borderColor: '#c0392b', backgroundColor: 'rgba(192,57,43,0.2)' },

  blankSentence:   { color: '#fff', fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: 10 },
  blankHint:       { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginBottom: 14, fontStyle: 'italic' },
  inputRow:        { flexDirection: 'row', gap: 10 },
  input:           { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15 },
  checkBtn:        { backgroundColor: '#2E8B57', borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  checkBtnTxt:     { color: '#fff', fontSize: 18, fontWeight: '800' },

  builtRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, minHeight: 46, borderBottomWidth: 2, borderBottomColor: 'rgba(255,255,255,0.15)', marginBottom: 18, paddingBottom: 10 },
  builtPlaceholder:{ color: 'rgba(255,255,255,0.25)', fontSize: 14 },
  builtChip:       { backgroundColor: 'rgba(46,139,87,0.25)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  builtChipTxt:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  arrangeChip:     { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  arrangeChipTxt:  { color: '#fff', fontSize: 14 },

  doneStatsRow:    { flexDirection: 'row', gap: 16, marginTop: 18, marginBottom: 20 },
  doneStat:        { alignItems: 'center' },
  doneStatVal:     { color: '#fff', fontSize: 22, fontWeight: '800' },
  doneStatLbl:     { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  wordsSummaryCard:  { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 20 },
  wordsSummaryTitle: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  wordsSummaryGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  wordsSummaryChip:  { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, minWidth: 60 },
  wordsSummaryEmoji: { fontSize: 18 },
  wordsSummaryTxt:   { color: '#fff', fontSize: 10, fontWeight: '600', marginTop: 3 },
  nextCard:        { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 20 },
  nextLabel:       { color: '#a5d6a7', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  nextTitle:       { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  nextPreview:     { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 19 },
  cinemaBtn:       { backgroundColor: 'rgba(255,179,0,0.15)', borderWidth: 1, borderColor: '#FFB300', borderRadius: 13, paddingHorizontal: 26, paddingVertical: 12, marginBottom: 12 },
  cinemaBtnTxt:    { color: '#FFB300', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  restartBtn:      { backgroundColor: '#1B3A6B', borderRadius: 13, paddingHorizontal: 28, paddingVertical: 13 },
  restartTxt:      { color: '#fff', fontSize: 15, fontWeight: '700' },
});
