import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, TextInput, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { t, STORY_LINES } from '../data';
import { biboSay } from '../data/biboPhrases';
import { playSfx } from '../utils/sfx';
import { BiboMsg } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import { hasEpisodes } from '../data/episodes';
import StoryEpisode from './StoryEpisode';

var Speech = null;
try { Speech = require('expo-speech'); } catch(e) {}

const speak = (text, onDone) => {
  if (Speech) {
    Speech.stop();
    Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 0.85, onDone: onDone || (() => {}) });
  } else if (onDone) onDone();
};

const stopSpeech = () => { if (Speech) { try { Speech.stop(); } catch(e) {} } };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWrong(word, all, n) {
  return shuffle(all.filter(w => w.id !== word.id)).slice(0, n);
}

function ChoiceOpts({ opts, chosen, correctId, onAnswer }) {
  return (
    <View style={ph.optsGrid}>
      {opts.map(opt => {
        const isSel = chosen === opt.id;
        const isOk  = opt.id === correctId;
        const bg = !isSel ? 'rgba(255,255,255,0.05)' : isOk ? 'rgba(46,139,87,0.3)' : 'rgba(192,57,43,0.3)';
        const bc = !isSel ? 'rgba(255,255,255,0.1)'  : isOk ? '#2E8B57' : '#c0392b';
        return (
          <TouchableOpacity key={String(opt.id)} style={[ph.opt, { backgroundColor: bg, borderColor: bc }]}
            onPress={() => onAnswer(opt)} accessibilityLabel={opt.word || opt.ar}>
            <Text style={ph.optTxt}>{opt.ar || opt.word}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Phase1({ word, onNext }) {
  return (
    <View style={ph.card}>
      <Text style={ph.label}>Phase 1 — Learn the word</Text>
      <TouchableOpacity onPress={() => speak(word.word)} accessibilityLabel="Hear word">
        <Text style={ph.emoji}>{word.emoji}</Text>
      </TouchableOpacity>
      <Text style={ph.wordEn}>{word.word}</Text>
      <Text style={ph.phonetic}>{word.phonetic}</Text>
      <Text style={ph.pron}>{word.pron}</Text>
      <Text style={ph.wordAr}>{word.ar}</Text>
      {word.grammar ? <View style={ph.grammarPill}><Text style={ph.grammarTxt}>📐 {word.grammar}</Text></View> : null}
      <TouchableOpacity style={ph.btn} onPress={onNext} accessibilityRole="button">
        <Text style={ph.btnTxt}>Got it ←</Text>
      </TouchableOpacity>
    </View>
  );
}

function Phase2({ word, lineText, onNext }) {
  const parts = lineText.split(new RegExp('(' + word.word + ')', 'i'));
  return (
    <View style={ph.card}>
      <Text style={ph.label}>Phase 2 — Word in context</Text>
      <Text style={ph.emoji}>{word.emoji}</Text>
      <TouchableOpacity style={ph.sentenceWrap} onPress={() => speak(lineText)}>
        {parts.map((p, i) => (
          <Text key={String(i)} style={p.toLowerCase() === word.word.toLowerCase() ? ph.highlight : ph.sentencePart}>{p}</Text>
        ))}
        <Text style={ph.speakHint}> 🔊</Text>
      </TouchableOpacity>
      <Text style={ph.wordAr}>{word.ar}</Text>
      <TouchableOpacity style={ph.btn} onPress={onNext} accessibilityRole="button">
        <Text style={ph.btnTxt}>Next ←</Text>
      </TouchableOpacity>
    </View>
  );
}

function Phase3({ word, allWords, onNext, onFeedback }) {
  const [chosen, setChosen] = useState(null);
  const opts = useRef(shuffle([word, ...getWrong(word, allWords, 3)])).current;
  const answer = (opt) => {
    setChosen(opt.id);
    if (opt.id === word.id) { onFeedback && onFeedback('correct'); speak(word.word); setTimeout(onNext, 900); }
    else { onFeedback && onFeedback('wrong'); }
  };
  return (
    <View style={ph.card}>
      <Text style={ph.label}>Phase 3 — Listen & Choose</Text>
      <TouchableOpacity style={ph.listenCircle} onPress={() => speak(word.word)}>
        <Text style={{ fontSize: 44 }}>{word.emoji}</Text>
        <Text style={ph.listenHint}>🔊 Tap to hear</Text>
      </TouchableOpacity>
      <Text style={ph.phonetic}>{word.phonetic}</Text>
      <Text style={ph.qTxt}>Which word did you hear?</Text>
      <ChoiceOpts opts={opts} chosen={chosen} correctId={word.id} onAnswer={answer} />
    </View>
  );
}

function Phase4({ word, allWords, onNext, onFeedback }) {
  const [chosen, setChosen] = useState(null);
  const opts = useRef(shuffle([word, ...getWrong(word, allWords, 3)])).current;
  const answer = (opt) => {
    setChosen(opt.id);
    if (opt.id === word.id) { onFeedback && onFeedback('correct'); speak(word.word); setTimeout(onNext, 900); }
    else { onFeedback && onFeedback('wrong'); }
  };
  return (
    <View style={ph.card}>
      <Text style={ph.label}>Phase 4 — Translation</Text>
      <TouchableOpacity onPress={() => speak(word.word)}>
        <Text style={ph.emoji}>{word.emoji}</Text>
      </TouchableOpacity>
      <Text style={ph.wordEn}>{word.word}</Text>
      <Text style={ph.qTxt}>What does this mean in Arabic?</Text>
      <ChoiceOpts opts={opts} chosen={chosen} correctId={word.id} onAnswer={answer} />
    </View>
  );
}

function Phase5({ word, allWords, onNext, onFeedback }) {
  const [chosen, setChosen] = useState(null);
  const opts = useRef(shuffle([word, ...getWrong(word, allWords, 3)])).current;
  const answer = (opt) => {
    setChosen(opt.id);
    if (opt.id === word.id) { onFeedback && onFeedback('correct'); speak(word.word); setTimeout(onNext, 900); }
    else { onFeedback && onFeedback('wrong'); }
  };
  return (
    <View style={ph.card}>
      <Text style={ph.label}>Phase 5 — Reverse</Text>
      <Text style={ph.emoji}>{word.emoji}</Text>
      <Text style={ph.wordAr}>{word.ar}</Text>
      <Text style={ph.qTxt}>What is the English word?</Text>
      <View style={ph.optsGrid}>
        {opts.map(opt => {
          const isSel = chosen === opt.id;
          const isOk  = opt.id === word.id;
          const bg = !isSel ? 'rgba(255,255,255,0.05)' : isOk ? 'rgba(46,139,87,0.3)' : 'rgba(192,57,43,0.3)';
          const bc = !isSel ? 'rgba(255,255,255,0.1)'  : isOk ? '#2E8B57' : '#c0392b';
          return (
            <TouchableOpacity key={String(opt.id)} style={[ph.opt, { backgroundColor: bg, borderColor: bc }]}
              onPress={() => answer(opt)} accessibilityLabel={opt.word}>
              <Text style={ph.optTxt}>{opt.word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Phase6({ word, lineText, onNext, onFeedback }) {
  const [typed, setTyped] = useState('');
  const [done,  setDone]  = useState(false);
  const sentence = lineText.replace(new RegExp(word.word, 'i'), '___');
  const check = () => {
    if (typed.trim().toLowerCase() === word.word.toLowerCase()) {
      onFeedback && onFeedback('correct');
      setDone(true); speak(word.word); setTimeout(onNext, 900);
    } else { onFeedback && onFeedback('wrong'); setTyped(''); }
  };
  return (
    <View style={ph.card}>
      <Text style={ph.label}>Phase 6 — Fill in the blank</Text>
      <Text style={ph.sentenceWrap2}>{sentence}</Text>
      <Text style={ph.hint}>Hint: {word.pron}</Text>
      <View style={ph.inputRow}>
        <TextInput style={[ph.input, done ? ph.inputOk : null]}
          value={typed} onChangeText={(v) => { setTyped(v); playSfx('writing'); }} onSubmitEditing={check}
          placeholder={word.phonetic} placeholderTextColor="rgba(255,255,255,0.2)"
          autoCapitalize="none" returnKeyType="done" editable={!done} />
        <TouchableOpacity style={ph.checkBtn} onPress={check} disabled={done}>
          <Text style={ph.checkBtnTxt}>{done ? '✅' : '✓'}</Text>
        </TouchableOpacity>
      </View>
      {done ? <Text style={ph.correctMsg}>✅ {word.word} = {word.ar}</Text> : null}
    </View>
  );
}

function Phase7({ word, lineText, onNext }) {
  const parts = lineText.split(new RegExp('(' + word.word + ')', 'i'));
  return (
    <View style={ph.card}>
      <Text style={ph.label}>Phase 7 — In the story</Text>
      <Text style={{ fontSize: 32, marginBottom: 12 }}>🎬</Text>
      <TouchableOpacity style={ph.sentenceWrap} onPress={() => speak(lineText)}>
        {parts.map((p, i) => (
          <Text key={String(i)} style={p.toLowerCase() === word.word.toLowerCase() ? ph.highlightFinal : ph.sentencePart}>{p}</Text>
        ))}
        <Text style={ph.speakHint}> 🔊</Text>
      </TouchableOpacity>
      <View style={ph.learnedBadge}>
        <Text style={ph.learnedTxt}>🏆 Learned: {word.word} = {word.ar}</Text>
      </View>
      <TouchableOpacity style={ph.btn} onPress={onNext} accessibilityRole="button">
        <Text style={ph.btnTxt}>Next word ←</Text>
      </TouchableOpacity>
    </View>
  );
}

function PronTest({ lineText, onDone }) {
  const [state, setState] = useState('idle');
  const [score, setScore] = useState(null);
  const LABELS = { 1:'Needs Practice', 2:'Keep Going', 3:'Good Job!', 4:'Great!', 5:'Perfect!' };
  return (
    <View style={pt.card}>
      <Text style={pt.title}>🎤 Pronunciation Test</Text>
      <Text style={pt.subtitle}>Optional — test your pronunciation</Text>
      <TouchableOpacity style={pt.playBtn} onPress={() => { setState('playing'); speak(lineText, () => setState('idle')); }}>
        <Text style={pt.playBtnTxt}>{state === 'playing' ? '🔊 Playing...' : '🔊 Hear the line'}</Text>
      </TouchableOpacity>
      <View style={pt.lineBox}><Text style={pt.lineTxt}>{lineText}</Text></View>
      {state !== 'result' ? (
        <TouchableOpacity style={[pt.recordBtn, state === 'recording' ? pt.recordBtnActive : null]}
          onPress={() => { setState('recording'); setTimeout(() => { setState('result'); setScore(Math.floor(Math.random() * 3) + 3); }, 3000); }}
          disabled={state === 'recording' || state === 'playing'}>
          <Text style={pt.recordIcon}>{state === 'recording' ? '⏺️' : '🎙️'}</Text>
          <Text style={pt.recordTxt}>{state === 'recording' ? 'Listening...' : 'Tap to speak'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={pt.result}>
          <Text style={pt.resultStars}>{'★'.repeat(score) + '☆'.repeat(5 - score)}</Text>
          <Text style={pt.resultLabel}>{LABELS[score]}</Text>
          <Text style={pt.resultNote}>Full speech recognition coming in final app</Text>
        </View>
      )}
      <View style={pt.btns}>
        <TouchableOpacity style={pt.skipBtn} onPress={onDone}>
          <Text style={pt.skipTxt}>Skip →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[pt.doneBtn, state !== 'result' ? { opacity: 0.35 } : null]}
          onPress={state === 'result' ? onDone : () => {}} disabled={state !== 'result'}>
          <Text style={pt.doneTxt}>Continue ←</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Story({ onLeave }) {
  const { track } = useApp();
  const trackId = track?.id || 'spy';
  // لو المسار عنده حلقات بالبنية الجديدة (LinguaDrama)، استخدم المحرك الجديد.
  // غير كده ارجع للنظام القديم (STORY_LINES المسطحة) كما هو.
  if (hasEpisodes(trackId)) return <StoryEpisode onLeave={onLeave} />;
  return <StoryLegacy onLeave={onLeave} />;
}

function StoryLegacy({ onLeave }) {
  const { lang, track, useInk, useEraser, usePage, addGems, addLibraryEntry } = useApp();
  const T = (k) => t(k, lang);

  const trackId   = track?.id || 'spy';
  const hasContent = !!STORY_LINES[trackId];
  const lines     = STORY_LINES[trackId] || STORY_LINES.spy;
  const allWords  = lines.flatMap(l => l.words);

  const [lineIdx,   setLineIdx]   = useState(0);
  const [wordIdx,   setWordIdx]   = useState(0);
  const [phase,     setPhase]     = useState(1);
  const [learned,   setLearned]   = useState([]);
  const [showPron,  setShowPron]  = useState(false);
  const [gameDone,  setGameDone]  = useState(false);
  const [feedback,  setFeedback]  = useState(null); // { type: 'correct'|'wrong', msg } | null
  const [streak,    setStreak]    = useState(0);

  const flashFeedback = (type) => {
    playSfx(type === 'correct' ? 'correct' : 'wrong');
    if (type === 'correct') {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setFeedback({ type, msg: newStreak >= 3 ? biboSay('streak', lang) : biboSay('correct', lang) });
    } else {
      setStreak(0);
      setFeedback({ type, msg: biboSay('wrong', lang) });
    }
    setTimeout(() => setFeedback(null), 900);
  };

  const line = lines[lineIdx];
  const word = line?.words[wordIdx];
  const progress = Math.round((lineIdx / lines.length) * 100);

  useEffect(() => {
    if (!gameDone) return;
    const words = allWords.filter(w => learned.includes(w.word));
    addLibraryEntry({
      trackId: trackId,
      episodeId: 1,
      trackName: track?.name || trackId,
      trackNameAr: track?.nameAr || trackId,
      icon: track?.icon || '📖',
      color: track?.color || '#2E8B57',
      completedAt: Date.now(),
      words,
      gemsEarned: learned.length * 2,
      lines: lines.map(l => ({ text: l.text, ar: l.ar })),
    });
  }, [gameDone]);

  const handleLeave = () => {
    stopSpeech();
    Alert.alert('Leave Lesson?', T('leaveMsg'), [
      { text: T('stayBtn'), style: 'cancel' },
      { text: T('leaveBtn'), style: 'destructive', onPress: () => { stopSpeech(); onLeave(); } },
    ]);
  };

  const nextPhase = () => {
    if (phase < 7) {
      setPhase(phase + 1);
      useInk();
    } else {
      setLearned(prev => [...prev, word.word]);
      addGems(2);
      const nextWord = wordIdx + 1;
      if (nextWord < line.words.length) {
        setWordIdx(nextWord); setPhase(1);
      } else {
        usePage();
        speak(line.text);
        const nextLine = lineIdx + 1;
        if (nextLine >= lines.length) {
          playSfx('win');
          setTimeout(() => setGameDone(true), 500);
        } else {
          setTimeout(() => setShowPron(true), 500);
        }
      }
    }
  };

  const afterPron = () => {
    setShowPron(false);
    const nextLine = lineIdx + 1;
    setLineIdx(nextLine); setWordIdx(0); setPhase(1);
  };

  if (!hasContent) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.doneWrap}>
          <BiboCharacter
            state="sleep"
            size={92}
            message={lang === 'ar'
              ? `قصة مسار "${track?.nameAr || trackId}" لسه بتتكتب... جرّب مسار Spy & Mystery دلوقتي! 📖`
              : `The "${track?.name || trackId}" story isn't ready yet... try Spy & Mystery for now! 📖`}
          />
          <TouchableOpacity style={[s.restartBtn, { marginTop: 18 }]} onPress={onLeave}>
            <Text style={s.restartTxt}>{lang === 'ar' ? 'رجوع' : 'Back'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (gameDone) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.doneWrap}>
          <BiboCharacter state="celebrate" size={96} message={biboSay('episodeComplete', lang)} style={{ marginBottom: 4 }} />
          <Text style={s.doneTitle}>Episode Complete!</Text>
          <Text style={s.doneSub}>You learned {learned.length} words · +{learned.length * 2} gems</Text>
          <View style={s.learnedList}>
            {learned.map((w, i) => {
              const obj = allWords.find(x => x.word === w);
              return (
                <TouchableOpacity key={String(i)} style={s.learnedChip} onPress={() => speak(w)}>
                  <Text style={s.learnedTxt}>{obj?.emoji || ''} {w} 🔊</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={s.restartBtn}
            onPress={() => { stopSpeech(); setLineIdx(0); setWordIdx(0); setPhase(1); setLearned([]); setGameDone(false); }}>
            <Text style={s.restartTxt}>Restart 🔄</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.leaveBtn} onPress={handleLeave}>
          <Text style={s.leaveTxt}>← {T('leave')}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerInfo}>Line {lineIdx + 1}/{lines.length} · Word {wordIdx + 1}/{line?.words.length}</Text>
          <View style={s.progressWrap}>
            <View style={s.progressBg}><View style={[s.progressFill, { width: progress + '%' }]} /></View>
            <Text style={s.progressTxt}>{progress}%</Text>
          </View>
        </View>
        <TouchableOpacity style={s.speakBtn} onPress={() => speak(line?.text || '')}>
          <Text style={{ fontSize: 18 }}>🔊</Text>
        </TouchableOpacity>
      </View>

      <View style={s.phaseDots}>
        {[1,2,3,4,5,6,7].map(p => (
          <View key={String(p)} style={[s.dot, p === phase ? s.dotActive : p < phase ? s.dotDone : null]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.storyCard}>
          <Text style={s.storyAr}>{line?.ar}</Text>
          <TouchableOpacity onPress={() => speak(line?.text || '')}>
            <Text style={s.storyEn}>{line?.text} <Text style={s.storySpeak}>🔊</Text></Text>
          </TouchableOpacity>
        </View>

        <BiboCharacter
          layout="row"
          size={56}
          style={{ marginBottom: 12 }}
          state={feedback?.type === 'correct' ? 'celebrate' : feedback?.type === 'wrong' ? 'encourage' : phase === 7 ? 'celebrate' : 'attention'}
          message={
            feedback ? feedback.msg :
            phase === 1 ? 'Learn the new word!' :
            phase === 2 ? 'See the word in context 📖' :
            phase === 3 ? 'Listen carefully 👂' :
            phase === 4 ? 'What does it mean? 🤔' :
            phase === 5 ? 'Now in reverse! 🔄' :
            phase === 6 ? 'Complete the sentence ✍️' :
            'This word is now part of your story! 🌟'
          }
        />

        {showPron ? (
          <PronTest lineText={line?.text || ''} onDone={afterPron} />
        ) : word ? (
          phase === 1 ? <Phase1 word={word} onNext={nextPhase} /> :
          phase === 2 ? <Phase2 word={word} lineText={line.text} onNext={nextPhase} /> :
          phase === 3 ? <Phase3 word={word} allWords={allWords} onNext={nextPhase} onFeedback={flashFeedback} /> :
          phase === 4 ? <Phase4 word={word} allWords={allWords} onNext={nextPhase} onFeedback={flashFeedback} /> :
          phase === 5 ? <Phase5 word={word} allWords={allWords} onNext={nextPhase} onFeedback={flashFeedback} /> :
          phase === 6 ? <Phase6 word={word} lineText={line.text} onNext={nextPhase} onFeedback={flashFeedback} /> :
          <Phase7 word={word} lineText={line.text} onNext={nextPhase} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const ph = StyleSheet.create({
  card:          { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 16 },
  label:         { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14, alignSelf: 'flex-start' },
  emoji:         { fontSize: 48, marginBottom: 8 },
  wordEn:        { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  phonetic:      { fontSize: 14, color: '#7fb3f5', marginBottom: 4 },
  pron:          { fontSize: 16, color: 'rgba(255,255,255,0.55)', marginBottom: 8 },
  wordAr:        { fontSize: 18, color: '#a5d6a7', fontWeight: '600', marginBottom: 10 },
  grammarPill:   { backgroundColor: 'rgba(27,58,107,0.3)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 14 },
  grammarTxt:    { fontSize: 12, color: '#7fb3f5' },
  btn:           { width: '100%', backgroundColor: '#1B3A6B', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 10 },
  btnTxt:        { color: '#fff', fontSize: 15, fontWeight: '700' },
  sentenceWrap:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 },
  sentencePart:  { fontSize: 15, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 26 },
  speakHint:     { fontSize: 15, color: 'rgba(255,255,255,0.3)', lineHeight: 26 },
  highlight:     { fontSize: 16, color: '#FFB300', fontWeight: '800', fontStyle: 'italic', lineHeight: 26 },
  highlightFinal:{ fontSize: 16, color: '#a5d6a7', fontWeight: '800', fontStyle: 'italic', lineHeight: 26 },
  sentenceWrap2: { fontSize: 15, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', textAlign: 'center', marginBottom: 12, lineHeight: 24 },
  hint:          { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 },
  inputRow:      { flexDirection: 'row', width: '100%', gap: 8 },
  input:         { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 11, color: '#fff', fontSize: 15 },
  inputOk:       { borderColor: '#2E8B57', backgroundColor: 'rgba(46,139,87,0.15)' },
  checkBtn:      { width: 46, backgroundColor: '#1B3A6B', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkBtnTxt:   { color: '#fff', fontSize: 20, fontWeight: '700' },
  correctMsg:    { color: '#a5d6a7', fontSize: 13, marginTop: 10 },
  qTxt:          { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  optsGrid:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, width: '100%' },
  opt:           { borderWidth: 1, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, minWidth: '44%', alignItems: 'center' },
  optTxt:        { color: '#fff', fontSize: 14, fontWeight: '600' },
  listenCircle:  { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(74,144,217,0.15)', borderWidth: 2, borderColor: 'rgba(74,144,217,0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  listenHint:    { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  learnedBadge:  { backgroundColor: 'rgba(46,139,87,0.15)', borderWidth: 1, borderColor: 'rgba(46,139,87,0.3)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, marginVertical: 12 },
  learnedTxt:    { color: '#a5d6a7', fontSize: 13, fontWeight: '600' },
});

const pt = StyleSheet.create({
  card:          { backgroundColor: 'rgba(74,144,217,0.08)', borderWidth: 1, borderColor: 'rgba(74,144,217,0.3)', borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 16 },
  title:         { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle:      { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14, textAlign: 'center' },
  playBtn:       { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 12 },
  playBtnTxt:    { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  lineBox:       { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, width: '100%', marginBottom: 16 },
  lineTxt:       { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', lineHeight: 22, textAlign: 'center' },
  recordBtn:     { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(74,144,217,0.15)', borderWidth: 2, borderColor: 'rgba(74,144,217,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  recordBtnActive:{ backgroundColor: 'rgba(192,57,43,0.2)', borderColor: '#c0392b' },
  recordIcon:    { fontSize: 36, marginBottom: 4 },
  recordTxt:     { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  result:        { alignItems: 'center', marginBottom: 16 },
  resultStars:   { fontSize: 28, color: '#FFB300', marginBottom: 6 },
  resultLabel:   { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6 },
  resultNote:    { fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontStyle: 'italic' },
  btns:          { flexDirection: 'row', gap: 10, width: '100%' },
  skipBtn:       { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 12, alignItems: 'center' },
  skipTxt:       { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  doneBtn:       { flex: 1, backgroundColor: '#1B3A6B', borderRadius: 10, padding: 12, alignItems: 'center' },
  doneTxt:       { color: '#fff', fontSize: 13, fontWeight: '700' },
});

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#08080f' },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  leaveBtn:      { borderWidth: 1, borderColor: 'rgba(192,57,43,0.4)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  leaveTxt:      { color: '#c0392b', fontSize: 12, fontWeight: '600' },
  headerCenter:  { flex: 1, paddingHorizontal: 10 },
  headerInfo:    { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 },
  progressWrap:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressBg:    { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: '#2E8B57' },
  progressTxt:   { fontSize: 10, color: 'rgba(255,255,255,0.35)', width: 28 },
  speakBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  phaseDots:     { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingVertical: 8 },
  dot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
  dotActive:     { backgroundColor: '#FFB300', width: 20 },
  dotDone:       { backgroundColor: '#2E8B57' },
  content:       { padding: 16, paddingBottom: 40 },
  storyCard:     { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, marginBottom: 12 },
  storyAr:       { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'right', marginBottom: 6, lineHeight: 20 },
  storyEn:       { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 22 },
  storySpeak:    { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  doneWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  doneTitle:     { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 16, marginBottom: 6 },
  doneSub:       { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 20 },
  learnedList:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 24 },
  learnedChip:   { backgroundColor: 'rgba(46,139,87,0.15)', borderWidth: 1, borderColor: 'rgba(46,139,87,0.3)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  learnedTxt:    { color: '#a5d6a7', fontSize: 13 },
  restartBtn:    { backgroundColor: '#1B3A6B', borderRadius: 13, paddingHorizontal: 28, paddingVertical: 13 },
  restartTxt:    { color: '#fff', fontSize: 15, fontWeight: '700' },
});
