import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { t, TRACKS, COOP_STORY, COOP_WORDS } from '../data';
import { PageHeader, GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import BiboIcon from '../components/BiboIcon';
import { playSfx } from '../utils/sfx';

function TutorialScreen({ lang, onDone }) {
  const [page, setPage] = useState(0);
  const PAGES = [
    { icon: '🤝', title: lang === 'ar' ? 'التعاون مع بيبو' : 'Co-op with Bibo',
      body: lang === 'ar' ? 'أنت وبيبو تكملان قصة واحدة معًا. لكل منكما دور فيها.' : 'You and Bibo complete one story together. Each of you plays a role.' },
    { icon: '👤', title: lang === 'ar' ? 'دورك' : 'Your role',
      body: lang === 'ar' ? 'أنت تكتب جمل البطل الرئيسي. كل جملة تعلّمك كلمات جديدة.' : 'You write the main story lines. Each line teaches you new vocabulary.' },
    { icon: null, iconIsBibo: true, title: lang === 'ar' ? 'دور بيبو' : "Bibo's role",
      body: lang === 'ar' ? 'بيبو يُكمل كل جملة بصوته، ويضيف عمقًا للقصة.' : 'Bibo completes each line with his voice, adding depth to the story.' },
    { icon: '🎵', title: lang === 'ar' ? 'مؤثرات صوتية' : 'Sound Effects',
      body: lang === 'ar' ? 'لكل مسار أصوات مميزة تعمل أثناء القصة.' : 'Each track has unique sounds that play during the story.' },
    { icon: '🏆', title: lang === 'ar' ? 'تعلّم مع بيبو' : 'Learn Together',
      body: lang === 'ar' ? 'تكسب كلمات وجواهر مع كل قصة تكملها مع بيبو!' : 'Earn words and gems with every story you finish with Bibo!' },
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
            <Text style={s.tutNextTxt}>{page === PAGES.length - 1 ? (lang === 'ar' ? 'هيا نبدأ! 🚀' : "Let's go! 🚀") : (lang === 'ar' ? 'التالي →' : 'Next →')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function CoopGame({ trackId, lang, onEnd, addGems }) {
  const track     = TRACKS.find(tr => tr.id === trackId) || TRACKS[0];
  const lines     = COOP_STORY[trackId]   || COOP_STORY.spy;
  const wordLines = COOP_WORDS[trackId]   || COOP_WORDS.spy;

  const [lineIdx,   setLineIdx]   = useState(0);
  const [wordIdx,   setWordIdx]   = useState(0);
  const [typed,     setTyped]     = useState('');
  const [done,      setDone]      = useState([]);
  const [showBibo,  setShowBibo]  = useState(false);
  const [gameOver,  setGameOver]  = useState(false);

  const currentLine = wordLines[lineIdx] || [];
  const currentWord = currentLine[wordIdx] || '';
  const story = lines[lineIdx];

  const checkWord = () => {
    if (typed.trim().toLowerCase() !== currentWord.toLowerCase()) { setTyped(''); playSfx('wrong'); return; }
    setTyped(''); playSfx('correct');
    const nextWord = wordIdx + 1;
    if (nextWord >= currentLine.length) {
      setShowBibo(true); playSfx('pageTurn');
      setTimeout(() => {
        setShowBibo(false);
        setDone(prev => [...prev, lineIdx]);
        const nextLine = lineIdx + 1;
        if (nextLine >= lines.length) { setGameOver(true); playSfx('win'); }
        else { setLineIdx(nextLine); setWordIdx(0); }
      }, 2200);
    } else setWordIdx(nextWord);
  };

  const handleLeave = () => Alert.alert(
    lang === 'ar' ? 'مغادرة القصة؟' : 'Leave Story?',
    lang === 'ar' ? 'سينتظرك بيبو حتى تعود لاحقًا.' : 'Bibo will wait for you to come back later.',
    [
      { text: lang === 'ar' ? 'ابقَ' : 'Stay', style: 'cancel' },
      { text: lang === 'ar' ? 'مغادرة' : 'Leave', style: 'destructive', onPress: onEnd },
    ]
  );

  if (gameOver) return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.doneWrap}>
        <BiboCharacter state="celebrate" size={80} message={lang === 'ar' ? 'قصة رهيبة! 🎉' : 'Amazing story! 🎉'} />
        <Text style={s.doneTitle}>{lang === 'ar' ? 'القصة اكتملت!' : 'Story Complete!'}</Text>
        <Text style={s.doneSub}>+{lines.length * 5} {lang === 'ar' ? 'جوهرة' : 'gems earned'}</Text>
        <View style={[s.trackBadge, { borderColor: track.color }]}>
          <Text style={[s.trackBadgeTxt, { color: track.color }]}>{track.icon} {lang === 'ar' ? track.nameAr : track.name}</Text>
        </View>
        {lines.map((line, i) => (
          <View key={String(i)} style={s.doneLineWrap}>
            <Text style={s.doneHero}>{'👤 ' + line.hero}</Text>
            <View style={s.donePartnerRow}>
              <BiboCharacter state="idea" size={20} silent showCosmetics={false} />
              <Text style={s.donePartner}>{line.partner}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={s.doneBtn} onPress={() => { addGems(lines.length * 5); onEnd(); }}>
          <Text style={s.doneBtnTxt}>{lang === 'ar' ? 'الرجوع للرئيسية' : 'Back to Home'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.gameHeader}>
        <TouchableOpacity style={s.leaveBtn} onPress={handleLeave}>
          <Text style={s.leaveTxt}>{lang === 'ar' ? 'مغادرة' : 'Leave'}</Text>
        </TouchableOpacity>
        <View style={[s.trackMini, { borderColor: track.color + '66' }]}>
          <Text style={[s.trackMiniTxt, { color: track.color }]}>{track.icon} {lineIdx + 1}/{lines.length}</Text>
        </View>
        <View style={s.gameProgressBg}>
          <View style={[s.gameProgressFill, { width: Math.round(lineIdx / lines.length * 100) + '%', backgroundColor: track.color }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.gameContent}>
        {done.map(i => (
          <View key={String(i)} style={s.doneLine}>
            <Text style={s.doneHeroSmall}>{'✅ ' + lines[i].hero}</Text>
            <View style={s.donePartnerSmallRow}>
              <BiboCharacter state="idea" size={16} silent showCosmetics={false} />
              <Text style={s.donePartnerSmall}>{lines[i].partner}</Text>
            </View>
          </View>
        ))}
        <View style={[s.currentCard, { borderColor: track.color + '44' }]}>
          <Text style={[s.currentLabel, { color: track.color }]}>{lang === 'ar' ? 'دورك:' : 'Your turn:'}</Text>
          <Text style={s.currentStory}>{story?.hero}</Text>
          <View style={s.wordsRow}>
            {currentLine.map((w, i) => {
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
        </View>
        {showBibo ? (
          <View style={[s.partnerCard, { borderColor: track.color + '44', backgroundColor: track.color + '12' }]}>
            <BiboCharacter layout="row" size={44} state="encourage" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.partnerLabel, { color: track.color }]}>{lang === 'ar' ? 'بيبو يُكمل...' : 'Bibo completing...'}</Text>
              <Text style={s.partnerText}>{story?.partner}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function Coop({ onBack }) {
  const { lang, gems, addGems, track: userTrack } = useApp();
  const T = (k) => t(k, lang);
  const [screen,  setScreen]  = useState('tutorial');
  const [trackId, setTrackId] = useState(userTrack?.id || 'spy');

  if (screen === 'tutorial') return <TutorialScreen lang={lang} onDone={() => setScreen('home')} />;
  if (screen === 'game')     return <CoopGame trackId={trackId} lang={lang} onEnd={() => setScreen('home')} addGems={addGems} />;

  const track  = TRACKS.find(tr => tr.id === trackId) || TRACKS[0];

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={lang === 'ar' ? 'التعاون مع بيبو' : 'Co-op with Bibo'} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <View style={[s.explainCard, { borderColor: track.color + '44' }]}>
          <BiboCharacter state="welcome" size={64} style={{ marginBottom: 12 }} />
          <Text style={s.explainTitle}>{lang === 'ar' ? 'اكتب قصة مع بيبو!' : 'Write a story with Bibo!'}</Text>
          <Text style={s.explainBody}>
            {lang === 'ar'
              ? 'أكمل قصة واحدة مع بيبو: أنت تكتب جمل البطل، وبيبو يكمّل كل مشهد بصوته.'
              : 'Complete one story together with Bibo: you write the hero lines, Bibo completes each scene with his voice.'}
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
            {lang === 'ar'
              ? 'قصة قصيرة تكملونها سوا خطوة بخطوة، وبيبو معك بكل جملة.'
              : 'A short story you complete step by step, with Bibo alongside you the whole way.'}
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
  donePartnerSmallRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  donePartnerSmall:{ fontSize: 12, color: '#7fb3f5', lineHeight: 18, flexShrink: 1 },
  currentCard:     { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
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
});
