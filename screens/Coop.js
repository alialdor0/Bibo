import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { t, TRACKS } from '../data';
import { getEpisode, getTotalEpisodes } from '../data/episodes';
import { buildTemplateVars, fillDeep } from '../utils/templateEngine';
import { speakWord } from '../utils/episodeAudio';
import { playTrackAmbient, stopAmbient } from '../utils/ambientMusic';
import { PageHeader, GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import BiboIcon from '../components/BiboIcon';
import { playSfx } from '../utils/sfx';

function TutorialScreen({ lang, onDone }) {
  const [page, setPage] = useState(0);
  const PAGES = [
    { icon: '🤝', title: lang === 'ar' ? 'التعاون مع بيبو' : 'Co-op with Bibo',
      body: lang === 'ar' ? 'تعيشان معًا حلقات قصتك الحقيقية نفسها، ابتداءً من الحلقة الأولى.' : 'You and Bibo go through your real story episodes together, starting from Episode 1.' },
    { icon: '👤', title: lang === 'ar' ? 'دورك' : 'Your role',
      body: lang === 'ar' ? 'في نصف الجمل، تكتب أنت الكلمة المهمة، وهي نفس الكلمات التي تتعلمها في الحلقة.' : 'On half the lines, you type the key word — the same vocabulary from the episode.' },
    { icon: null, iconIsBibo: true, title: lang === 'ar' ? 'دور بيبو' : "Bibo's role",
      body: lang === 'ar' ? 'وفي النصف الآخر، بيبو هو الذي يكتب الكلمة! تشاهده وهو يكتبها، ثم يقرأ الجملة بصوته مع ترجمتها.' : "On the other half, Bibo writes the word himself! Watch him write it, then he reads the line aloud with its translation." },
    { icon: '🎬', title: lang === 'ar' ? 'حلقة بعد حلقة' : 'Episode after episode',
      body: lang === 'ar' ? 'بمجرد أن تنتهيا من حلقة، يمكنكما الانتقال إلى الحلقة التالية فورًا.' : 'As soon as you finish an episode, you can continue straight to the next one.' },
    { icon: '🏆', title: lang === 'ar' ? 'تعلّم مع بيبو' : 'Learn Together',
      body: lang === 'ar' ? 'تكسب الجواهر مع كل جملة وكل حلقة تكملها مع بيبو!' : 'Earn gems with every line and every episode you finish with Bibo!' },
  ];
  const p = PAGES[page];
  return (
    <SafeAreaView style={s.safe}>
      <PageHeader
        title={lang === 'ar' ? 'كيف يعمل' : 'How it works'}
        right={<TouchableOpacity onPress={onDone} style={s.skipBtn}><Text style={s.skipTxt}>{lang === 'ar' ? 'تخطّي' : 'Skip'}</Text></TouchableOpacity>}
      />
      <View style={s.tutWrap}>
        <View style={s.tutDots}>
          {PAGES.map((_, i) => <View key={String(i)} style={[s.tutDot, i === page ? s.tutDotActive : null]} />)}
        </View>
        <View style={s.tutCard}>
          {p.iconIsBibo ? <BiboIcon size={56} /> : <Text style={s.tutIcon}>{p.icon}</Text>}
          <Text style={s.tutTitle}>{p.title}</Text>
          <Text style={s.tutBody}>{p.body}</Text>
        </View>
        <View style={s.tutBtns}>
          {page > 0 ? (
            <TouchableOpacity style={s.tutBackBtn} onPress={() => setPage(page - 1)}>
              <Text style={s.tutBackTxt}>{lang === 'ar' ? '← رجوع' : '← Back'}</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 80 }} />}
          <TouchableOpacity style={s.tutNextBtn} onPress={() => page === PAGES.length - 1 ? onDone() : setPage(page + 1)}>
            <Text style={s.tutNextTxt}>{page === PAGES.length - 1 ? (lang === 'ar' ? 'لنبدأ الآن! 🚀' : "Let's go! 🚀") : (lang === 'ar' ? 'التالي →' : 'Next →')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * وضع التعاون مع بيبو — بيستخدم نفس بيانات الحلقات الحقيقية اللي تستخدمها شاشة
 * القصة (StoryEpisode)، فمفيش قصة وهمية منفصلة ولا شخصيات وهمية (أحمد/خالد..).
 * كل جملة بتتقرأ بصوت بيبو الفعلي (TTS) وبتوريك ترجمتها العربية.
 */
function CoopGame({ trackId, lang, user, onEnd, addGems }) {
  const { addWordToBank } = useApp();
  const track = TRACKS.find(tr => tr.id === trackId) || TRACKS[0];
  const vars = useMemo(() => buildTemplateVars(user), [user]);
  const totalEpisodes = getTotalEpisodes(trackId);
  const progressKey = `coop_progress_${trackId}`;

  const [episodeNum, setEpisodeNum] = useState(1);
  const [restored, setRestored] = useState(false);
  const rawEpisode = getEpisode(trackId, episodeNum);
  const episode = useMemo(() => (rawEpisode ? fillDeep(rawEpisode, vars) : null), [rawEpisode, vars]);
  const lines = episode?.lines || [];
  const vocabById = useMemo(() => {
    const map = {};
    (episode?.vocabulary || []).forEach(v => { map[v.id] = v; });
    return map;
  }, [episode]);

  const [lineIdx,   setLineIdx]   = useState(0);
  const [wordIdx,   setWordIdx]   = useState(0);
  const [typed,     setTyped]     = useState('');
  const [done,      setDone]      = useState([]);
  const [showBibo,  setShowBibo]  = useState(false);
  const [biboWriting, setBiboWriting] = useState(false); // بيبو بيكتب كلمته في دوره
  const [episodeOver, setEpisodeOver] = useState(false);
  const [seasonOver,  setSeasonOver]  = useState(false);
  const autoSkipRef = useRef(new Set());
  const biboTurnRef = useRef(new Set());

  const line = lines[lineIdx] || null;
  const lineWords = (line?.words || []).map(w => w.word);
  const currentWord = lineWords[wordIdx] || '';
  const isBiboTurn = lineIdx % 2 === 1; // تبادل الأدوار: أسطر زوجية لك، أسطر فردية لبيبو

  useEffect(() => { playTrackAmbient(trackId); return () => stopAmbient(); }, [trackId]);

  // استرجاع آخر تقدّم محفوظ لهذا المسار (رقم الحلقة والسطر) — كانت هذه المشكلة
  // المُبلَّغ عنها: التعاون كان بيرجع للحلقة الأولى دايمًا لأنه ماكانش بيحفظ حاجة
  useEffect(() => {
    AsyncStorage.getItem(progressKey)
      .then(raw => {
        if (raw) {
          const saved = JSON.parse(raw);
          if (typeof saved.episodeNum === 'number' && saved.episodeNum >= 1) setEpisodeNum(saved.episodeNum);
          if (typeof saved.lineIdx === 'number' && saved.lineIdx >= 0) setLineIdx(saved.lineIdx);
        }
      })
      .catch(() => {})
      .finally(() => setRestored(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId]);

  useEffect(() => {
    if (!restored) return; // متسجّلش أول قراءة فاضية فوق التقدّم المحفوظ قبل ما نسترجعه
    AsyncStorage.setItem(progressKey, JSON.stringify({ episodeNum, lineIdx })).catch(() => {});
  }, [episodeNum, lineIdx, restored]);

  /** يضيف كل كلمات السطر اللي خلص (بتاعتك أو بتاعة بيبو) لبنك الكلمات — عشان تظهر بالقاموس */
  const saveLineWordsToBank = () => {
    (line?.words || []).forEach(w => {
      const full = vocabById[w.id] || w;
      addWordToBank(
        trackId, w.id,
        { word: full.word, ar: full.ar, phonetic: full.phonetic, pron: full.pron, emoji: full.emoji, grammar: full.grammar, difficulty: full.difficulty },
        episodeNum,
        episode?.word_expiry?.non_protected_expire_after_episode
      );
    });
  };

  const advanceLine = () => {
    setShowBibo(true);
    playSfx('pageTurn');
    speakWord(line.text);
    saveLineWordsToBank();
    setTimeout(() => {
      setShowBibo(false);
      setDone(prev => [...prev, lineIdx]);
      const nextLine = lineIdx + 1;
      if (nextLine >= lines.length) {
        playSfx('coopWin');
        if (episodeNum >= totalEpisodes) setSeasonOver(true);
        else setEpisodeOver(true);
      } else { setLineIdx(nextLine); setWordIdx(0); }
    }, 2400);
  };

  // بعض الجمل ممكن متكونش فيها كلمة مفردات جديدة (سطر ربط سردي) — بيبو يقرأها
  // على طول من غير ما يستنى كتابة (من أي طرف)
  useEffect(() => {
    if (!line) return;
    const key = `${episodeNum}-${lineIdx}`;
    if (lineWords.length === 0 && !autoSkipRef.current.has(key)) {
      autoSkipRef.current.add(key);
      advanceLine();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIdx, episodeNum, episode]);

  // دور بيبو: هو اللي "بيكتب" كلمة السطر ده — بيبيّن مؤشر كتابة لحظات، وبعدين
  // يكتبها فعليًا، بدل ما يكون المستخدم هو الوحيد اللي بيكتب طول الوقت
  useEffect(() => {
    if (!line || lineWords.length === 0 || !isBiboTurn) return;
    const key = `${episodeNum}-${lineIdx}`;
    if (biboTurnRef.current.has(key)) return;
    biboTurnRef.current.add(key);
    setBiboWriting(true);
    setWordIdx(0);
    const t = setTimeout(() => {
      setBiboWriting(false);
      setWordIdx(lineWords.length);
      advanceLine();
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIdx, episodeNum, episode, isBiboTurn]);

  const checkWord = () => {
    if (isBiboTurn || !currentWord) return;
    if (typed.trim().toLowerCase() !== currentWord.toLowerCase()) { setTyped(''); playSfx('wrong'); return; }
    setTyped(''); playSfx('correct');
    const nextWord = wordIdx + 1;
    if (nextWord >= lineWords.length) advanceLine();
    else setWordIdx(nextWord);
  };

  const goNextEpisode = () => {
    setEpisodeNum(n => n + 1);
    setLineIdx(0); setWordIdx(0); setDone([]);
    setEpisodeOver(false);
    playSfx('pageTurn');
  };

  const handleLeave = () => Alert.alert(
    lang === 'ar' ? 'مغادرة الحلقة؟' : 'Leave episode?',
    lang === 'ar' ? 'سينتظرك بيبو حتى تعود لاحقًا.' : 'Bibo will wait for you to come back later.',
    [
      { text: lang === 'ar' ? 'ابقَ' : 'Stay', style: 'cancel' },
      { text: lang === 'ar' ? 'مغادرة' : 'Leave', style: 'destructive', onPress: onEnd },
    ]
  );

  // ── مفيش حلقات لهذا المسار لسه ──
  if (!episode) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.doneWrap}>
          <BiboCharacter state="sleep" size={80} message={lang === 'ar' ? 'حلقات هذا المسار قيد الإعداد... تابعنا قريبًا 📖' : "This track's episodes aren't ready yet... check back soon 📖"} />
          <TouchableOpacity style={s.doneBtn} onPress={onEnd}>
            <Text style={s.doneBtnTxt}>{lang === 'ar' ? 'الرجوع للرئيسية' : 'Back to Home'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── خلصتوا كل حلقات الموسم ──
  if (seasonOver) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.doneWrap}>
          <BiboCharacter state="celebrate" size={80} message={lang === 'ar' ? 'أكملنا الموسم بأكمله معًا! 🏆' : 'We finished the whole season together! 🏆'} />
          <Text style={s.doneTitle}>{lang === 'ar' ? 'الموسم اكتمل!' : 'Season Complete!'}</Text>
          <View style={[s.trackBadge, { borderColor: track.color }]}>
            <Text style={[s.trackBadgeTxt, { color: track.color }]}>{track.icon} {lang === 'ar' ? track.nameAr : track.name}</Text>
          </View>
          <TouchableOpacity style={s.doneBtn} onPress={onEnd}>
            <Text style={s.doneBtnTxt}>{lang === 'ar' ? 'الرجوع للرئيسية' : 'Back to Home'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── الحلقة الحالية خلصت — عرض ملخّص وخيار المتابعة للحلقة الجاية ──
  if (episodeOver) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.doneWrap}>
          <BiboCharacter state="celebrate" size={80} message={lang === 'ar' ? 'حلقة رائعة! 🎉' : 'Great episode! 🎉'} />
          <Text style={s.doneTitle}>
            {lang === 'ar' ? `الحلقة ${episodeNum} اكتملت!` : `Episode ${episodeNum} complete!`}
          </Text>
          <Text style={s.doneSub}>+{lines.length * 5} {lang === 'ar' ? 'جوهرة' : 'gems earned'}</Text>
          <View style={[s.trackBadge, { borderColor: track.color }]}>
            <Text style={[s.trackBadgeTxt, { color: track.color }]}>{track.icon} {lang === 'ar' ? track.nameAr : track.name}</Text>
          </View>
          {lines.map((l, i) => (
            <View key={String(i)} style={s.doneLineWrap}>
              <View style={s.doneTurnRow}>
                {i % 2 === 1 ? <BiboIcon size={14} /> : <Text style={s.doneTurnEmoji}>👤</Text>}
                <Text style={s.doneHero}> {l.text}</Text>
              </View>
              <View style={s.donePartnerRow}>
                <BiboCharacter state="idea" size={20} silent showCosmetics={false} />
                <Text style={s.donePartner}>{l.arabic}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={s.doneBtn}
            onPress={() => { addGems(lines.length * 5); goNextEpisode(); }}
          >
            <Text style={s.doneBtnTxt}>
              {lang === 'ar' ? `المتابعة للحلقة ${episodeNum + 1} ←` : `Continue to Episode ${episodeNum + 1} ←`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.laterBtn} onPress={() => { addGems(lines.length * 5); onEnd(); }}>
            <Text style={s.laterBtnTxt}>{lang === 'ar' ? 'أكمل لاحقًا' : 'Continue later'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── شاشة اللعب ──
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.gameHeader}>
        <TouchableOpacity style={s.leaveBtn} onPress={handleLeave}>
          <Text style={s.leaveTxt}>{lang === 'ar' ? 'مغادرة' : 'Leave'}</Text>
        </TouchableOpacity>
        <View style={[s.trackMini, { borderColor: track.color + '66' }]}>
          <Text style={[s.trackMiniTxt, { color: track.color }]}>
            {track.icon} {lang === 'ar' ? 'الحلقة' : 'Episode'} {episodeNum} · {lineIdx + 1}/{lines.length}
          </Text>
        </View>
        <View style={s.gameProgressBg}>
          <View style={[s.gameProgressFill, { width: Math.round(lineIdx / lines.length * 100) + '%', backgroundColor: track.color }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.gameContent}>
        {done.map(i => (
          <View key={String(i)} style={s.doneLine}>
            <View style={s.doneTurnRow}>
              {i % 2 === 1 ? <BiboIcon size={13} /> : <Text style={s.doneTurnEmoji}>👤</Text>}
              <Text style={s.doneHeroSmall}> {lines[i].text}</Text>
            </View>
            <View style={s.donePartnerSmallRow}>
              <BiboCharacter state="idea" size={16} silent showCosmetics={false} />
              <Text style={s.donePartnerSmall}>{lines[i].arabic}</Text>
            </View>
          </View>
        ))}

        {line && lineWords.length > 0 ? (
          <View style={[s.currentCard, { borderColor: track.color + '44' }]}>
            {isBiboTurn ? (
              <>
                <View style={s.biboTurnHeader}>
                  <BiboIcon size={22} />
                  <Text style={[s.currentLabel, { color: track.color, marginBottom: 0, marginLeft: 8 }]}>
                    {lang === 'ar' ? 'دور بيبو: هو من يكتب في هذه المرة ✍️' : "Bibo's turn: he's writing this time ✍️"}
                  </Text>
                </View>
                <Text style={s.currentStory}>{line.text}</Text>
                <View style={s.wordsRow}>
                  {lineWords.map((w, i) => (
                    <View key={String(i)} style={[s.wordChip, biboWriting ? { borderColor: 'rgba(255,255,255,0.1)' } : { borderColor: track.color, backgroundColor: track.color + '22' }]}>
                      <Text style={[s.wordTxt, biboWriting ? { color: 'rgba(255,255,255,0.25)' } : { color: track.color, fontWeight: '700' }]}>{biboWriting ? '?' : w}</Text>
                    </View>
                  ))}
                </View>
                {biboWriting ? (
                  <Text style={s.biboWritingTxt}>{lang === 'ar' ? 'بيبو يكتب الآن...' : 'Bibo is writing...'}</Text>
                ) : (
                  <Text style={s.biboWrittenTxt}>{lang === 'ar' ? 'بيبو كتبها! ✓' : 'Bibo wrote it! ✓'}</Text>
                )}
              </>
            ) : (
              <>
                <Text style={[s.currentLabel, { color: track.color }]}>{lang === 'ar' ? 'دورك: اكتب الكلمة المضيئة' : 'Your turn: type the highlighted word'}</Text>
                <Text style={s.currentStory}>{line.text}</Text>
                <View style={s.wordsRow}>
                  {lineWords.map((w, i) => {
                    const st = i < wordIdx ? 'done' : i === wordIdx ? 'current' : 'pending';
                    return (
                      <View key={String(i)} style={[s.wordChip, st === 'done' ? { borderColor: '#2E8B57', backgroundColor: 'rgba(46,139,87,0.15)' } : st === 'current' ? { borderColor: track.color, backgroundColor: track.color + '22' } : { borderColor: 'rgba(255,255,255,0.1)' }]}>
                        <Text style={[s.wordTxt, st === 'done' ? { color: '#a5d6a7' } : st === 'current' ? { color: track.color, fontWeight: '700' } : { color: 'rgba(255,255,255,0.3)' }]}>{w}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={s.inputRow}>
                  <TextInput style={s.gameInput} value={typed} onChangeText={setTyped} onSubmitEditing={checkWord}
                    placeholder={currentWord} placeholderTextColor="rgba(255,255,255,0.2)"
                    autoCapitalize="none" returnKeyType="done" />
                  <TouchableOpacity style={[s.checkBtn, { backgroundColor: track.color + 'cc' }]} onPress={checkWord}>
                    <Text style={s.checkBtnTxt}>✓</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ) : null}

        {showBibo ? (
          <View style={[s.partnerCard, { borderColor: track.color + '44', backgroundColor: track.color + '12' }]}>
            <BiboCharacter layout="row" size={44} state="encourage" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.partnerLabel, { color: track.color }]}>{lang === 'ar' ? 'بيبو يقرأ السطر معك 🔊' : 'Bibo reads the line with you 🔊'}</Text>
              <Text style={s.partnerText}>{line?.text}</Text>
              <Text style={s.partnerTextAr}>{line?.arabic}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function Coop({ onBack }) {
  const { lang, gems, addGems, track: userTrack, user } = useApp();
  const T = (k) => t(k, lang);
  const [screen,  setScreen]  = useState('tutorial');
  const [trackId, setTrackId] = useState(userTrack?.id || 'spy');

  if (screen === 'tutorial') return <TutorialScreen lang={lang} onDone={() => setScreen('home')} />;
  if (screen === 'game')     return <CoopGame trackId={trackId} lang={lang} user={user} onEnd={() => setScreen('home')} addGems={addGems} />;

  const track  = TRACKS.find(tr => tr.id === trackId) || TRACKS[0];
  const totalEpisodes = getTotalEpisodes(trackId);

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={lang === 'ar' ? 'التعاون مع بيبو' : 'Co-op with Bibo'} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <View style={[s.explainCard, { borderColor: track.color + '44' }]}>
          <BiboCharacter state="welcome" size={64} style={{ marginBottom: 12 }} />
          <Text style={s.explainTitle}>{lang === 'ar' ? 'عِش قصتك مع بيبو!' : 'Live your story with Bibo!'}</Text>
          <Text style={s.explainBody}>
            {lang === 'ar'
              ? 'نفس حلقات قصتك الحقيقية، تبدأ من الحلقة الأولى — تتبادلان الأدوار: تكتب أنت نصف الجمل، ويكتب بيبو النصف الآخر، ويقرأ كل منكما جمله بصوته مع ترجمتها.'
              : 'The same real story episodes, starting from Episode 1 — you take turns: you write half the lines, Bibo writes the other half, and each of you reads your lines aloud with translation.'}
          </Text>
          <TouchableOpacity style={s.tutBtn} onPress={() => setScreen('tutorial')}>
            <Text style={s.tutBtnTxt}>{lang === 'ar' ? 'كيف يعمل' : 'How it works'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionLabel}>{lang === 'ar' ? 'المسار:' : 'Track:'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {TRACKS.map(tr => (
            <TouchableOpacity key={tr.id}
              style={[s.trackChip, trackId === tr.id ? { borderColor: tr.color, backgroundColor: tr.color + '22' } : { borderColor: 'rgba(255,255,255,0.1)' }]}
              onPress={() => setTrackId(tr.id)}>
              <Text style={{ fontSize: 20 }}>{tr.icon}</Text>
              <Text style={[s.trackChipTxt, trackId === tr.id ? { color: tr.color } : null]}>{lang === 'ar' ? tr.nameAr : tr.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[s.soundsCard, { borderColor: track.color + '33' }]}>
          <Text style={[s.soundsTitle, { color: track.color }]}>{track.icon} {lang === 'ar' ? track.nameAr : track.name}</Text>
          <Text style={s.soundsAmbient}>
            {totalEpisodes > 0
              ? (lang === 'ar'
                  ? `تبدأ من الحلقة 1 من ${totalEpisodes}، وتكمل للحلقة التالية أول ما تخلّص.`
                  : `Starts at Episode 1 of ${totalEpisodes}, and continues to the next as soon as you finish.`)
              : (lang === 'ar' ? 'حلقات هذا المسار قيد الإعداد.' : "This track's episodes are being prepared.")}
          </Text>
        </View>

        <TouchableOpacity style={[s.startBtn, { backgroundColor: track.color + 'cc', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]} onPress={() => setScreen('game')}>
          <BiboIcon size={20} />
          <Text style={s.startBtnTxt}>{lang === 'ar' ? 'ابدأ مع بيبو' : 'Start with Bibo'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#08080f' },
  pageContent:     { padding: 16, paddingBottom: 40 },
  skipBtn:         { padding: 8 },
  skipTxt:         { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  tutWrap:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  tutDots:         { flexDirection: 'row', gap: 8, marginBottom: 32 },
  tutDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  tutDotActive:    { backgroundColor: '#2E8B57', width: 20 },
  tutCard:         { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, width: '100%', marginBottom: 32 },
  tutIcon:         { fontSize: 56, marginBottom: 16 },
  tutTitle:        { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10, textAlign: 'center' },
  tutBody:         { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 24 },
  tutBtns:         { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  tutBackBtn:      { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  tutBackTxt:      { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  tutNextBtn:      { backgroundColor: '#1B3A6B', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  tutNextTxt:      { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionLabel:    { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 10 },
  explainCard:     { alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 20, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  explainTitle:    { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6 },
  explainBody:     { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  tutBtn:          { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  tutBtnTxt:       { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  trackChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  trackChipTxt:    { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  soundsCard:      { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  soundsTitle:     { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  soundsAmbient:   { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12, fontStyle: 'italic' },
  startBtn:        { borderRadius: 13, padding: 14, alignItems: 'center', marginBottom: 10 },
  startBtnTxt:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  gameHeader:      { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  leaveBtn:        { alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(192,57,43,0.4)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  leaveTxt:        { color: '#c0392b', fontSize: 12, fontWeight: '600' },
  trackMini:       { alignSelf: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 3 },
  trackMiniTxt:    { fontSize: 12, fontWeight: '600' },
  gameProgressBg:  { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  gameProgressFill:{ height: '100%', borderRadius: 2 },
  gameContent:     { padding: 16, paddingBottom: 40 },
  doneLine:        { marginBottom: 6, opacity: 0.45 },
  doneHeroSmall:   { fontSize: 12, color: '#a5d6a7', lineHeight: 18 },
  doneTurnRow:     { flexDirection: 'row', alignItems: 'center' },
  doneTurnEmoji:   { fontSize: 12 },
  donePartnerSmallRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  donePartnerSmall:{ fontSize: 12, color: '#7fb3f5', lineHeight: 18, flexShrink: 1 },
  currentCard:     { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  biboTurnHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  biboWritingTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 4 },
  biboWrittenTxt:  { fontSize: 12, color: '#2E8B57', fontWeight: '700', marginTop: 4 },
  currentLabel:    { fontSize: 11, fontWeight: '700', marginBottom: 8 },
  currentStory:    { fontSize: 14, color: '#fff', fontStyle: 'italic', lineHeight: 22, marginBottom: 12 },
  wordsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  wordChip:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  wordTxt:         { fontSize: 13 },
  inputRow:        { flexDirection: 'row', gap: 8 },
  gameInput:       { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 11, color: '#fff', fontSize: 15 },
  checkBtn:        { width: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkBtnTxt:     { color: '#fff', fontSize: 20, fontWeight: '700' },
  partnerCard:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12 },
  partnerLabel:    { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  partnerText:     { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 20 },
  partnerTextAr:   { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 18 },
  doneWrap:        { alignItems: 'center', padding: 24, paddingBottom: 40 },
  doneTitle:       { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 16, marginBottom: 6 },
  doneSub:         { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 12 },
  trackBadge:      { borderWidth: 2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 16 },
  trackBadgeTxt:   { fontSize: 14, fontWeight: '700' },
  doneLineWrap:    { marginBottom: 10, width: '100%' },
  doneHero:        { fontSize: 13, color: '#a5d6a7', lineHeight: 20 },
  donePartnerRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  donePartner:     { fontSize: 13, color: '#7fb3f5', lineHeight: 20, flexShrink: 1 },
  doneBtn:         { backgroundColor: '#1B3A6B', borderRadius: 13, paddingHorizontal: 28, paddingVertical: 13, marginTop: 20 },
  doneBtnTxt:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  laterBtn:        { borderRadius: 13, paddingHorizontal: 28, paddingVertical: 12, marginTop: 10 },
  laterBtnTxt:     { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },
});
