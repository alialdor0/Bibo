import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Animated, SafeAreaView, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { t, TRACKS, TRACK_SOUNDS, COOP_STORY, COOP_WORDS, FRIENDS } from '../data';
import { PageHeader, BiboMsg, GemsBadge } from '../components/BiboCard';
import { playSfx } from '../utils/sfx';

function TutorialScreen({ onDone }) {
  const [page, setPage] = useState(0);
  const PAGES = [
    { icon:'🤝', title:'Co-op Learning',  body:'You and a partner complete one story together. Each of you plays a role.' },
    { icon:'👤', title:'The Hero',         body:'You write the main story lines. Each line teaches you new vocabulary.' },
    { icon:'🤝', title:'The Partner',      body:'Your partner completes each line, adding depth to the story.' },
    { icon:'🎵', title:'Sound Effects',    body:'Each track has unique sounds that play during the story.' },
    { icon:'🏆', title:'Learn Together',   body:'Both players earn words and gems. The more you cooperate, the faster you both progress!' },
  ];
  const p = PAGES[page];
  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title="How it works" right={<TouchableOpacity onPress={onDone} style={s.skipBtn}><Text style={s.skipTxt}>Skip</Text></TouchableOpacity>} />
      <View style={s.tutWrap}>
        <View style={s.tutDots}>
          {PAGES.map((_, i) => <View key={String(i)} style={[s.tutDot, i === page ? s.tutDotActive : null]} />)}
        </View>
        <View style={s.tutCard}>
          <Text style={s.tutIcon}>{p.icon}</Text>
          <Text style={s.tutTitle}>{p.title}</Text>
          <Text style={s.tutBody}>{p.body}</Text>
        </View>
        <View style={s.tutBtns}>
          {page > 0 ? <TouchableOpacity style={s.tutBackBtn} onPress={() => setPage(page - 1)}><Text style={s.tutBackTxt}>← Back</Text></TouchableOpacity> : <View style={{ width: 80 }} />}
          <TouchableOpacity style={s.tutNextBtn} onPress={() => page === PAGES.length - 1 ? onDone() : setPage(page + 1)}>
            <Text style={s.tutNextTxt}>{page === PAGES.length - 1 ? "Let's go! 🚀" : 'Next →'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function WaitingScreen({ trackId, onCancel }) {
  const [dots, setDots] = useState('.');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const track = TRACKS.find(tr => tr.id === trackId) || TRACKS[0];
  const sounds = TRACK_SOUNDS[trackId] || TRACK_SOUNDS.spy;

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500);
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
    ])).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => clearInterval(t);
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.waitCenter}>
        <Animated.View style={[s.waitBird, { transform: [{ scale: pulseAnim }], borderColor: track.color + '88' }]}>
          <Text style={{ fontSize: 44 }}>🐦</Text>
        </Animated.View>
        <Text style={s.waitTxt}>{'Searching for a partner' + dots}</Text>
        <View style={[s.trackPillWait, { borderColor: track.color + '66' }]}>
          <Text style={[s.trackPillWaitTxt, { color: track.color }]}>{track.icon} {track.name}</Text>
        </View>
        <Text style={s.waitHint}>Looking for a partner at your level</Text>
        <View style={s.waitSounds}>
          <Text style={s.waitSoundsLabel}>Track sounds:</Text>
          <Text style={s.waitAmbient}>{sounds.ambient}</Text>
        </View>
        <TouchableOpacity style={s.cancelBtn}
          onPress={() => Alert.alert('Cancel Search?', 'Stop looking for a partner?', [{ text: 'Stay', style: 'cancel' }, { text: 'Cancel', style: 'destructive', onPress: onCancel }])}>
          <Text style={s.cancelTxt}>Cancel Search</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function CoopGame({ trackId, onEnd, addGems }) {
  const track    = TRACKS.find(tr => tr.id === trackId) || TRACKS[0];
  const sounds   = TRACK_SOUNDS[trackId] || TRACK_SOUNDS.spy;
  const lines    = COOP_STORY[trackId]   || COOP_STORY.spy;
  const wordLines= COOP_WORDS[trackId]   || COOP_WORDS.spy;

  const [lineIdx,     setLineIdx]     = useState(0);
  const [wordIdx,     setWordIdx]     = useState(0);
  const [typed,       setTyped]       = useState('');
  const [done,        setDone]        = useState([]);
  const [showPartner, setShowPartner] = useState(false);
  const [gameOver,    setGameOver]    = useState(false);
  const [soundLog,    setSoundLog]    = useState([]);

  const currentLine = wordLines[lineIdx] || [];
  const currentWord = currentLine[wordIdx] || '';
  const story = lines[lineIdx];

  const addSound = (trigger) => {
    const match = sounds.sounds.find(s => s.trigger === trigger);
    if (!match) return;
    const id = Date.now();
    setSoundLog(prev => [{ ...match, id }, ...prev.slice(0, 2)]);
    setTimeout(() => setSoundLog(prev => prev.filter(s => s.id !== id)), 2000);
  };

  const checkWord = () => {
    if (typed.trim().toLowerCase() !== currentWord.toLowerCase()) { setTyped(''); addSound('danger moment'); playSfx('wrong'); return; }
    setTyped(''); addSound('correct answer'); playSfx('correct');
    const nextWord = wordIdx + 1;
    if (nextWord >= currentLine.length) {
      setShowPartner(true); addSound('mission start'); playSfx('pageTurn');
      setTimeout(() => {
        setShowPartner(false);
        setDone(prev => [...prev, lineIdx]);
        const nextLine = lineIdx + 1;
        if (nextLine >= lines.length) { setGameOver(true); playSfx('win'); }
        else { setLineIdx(nextLine); setWordIdx(0); }
      }, 2200);
    } else setWordIdx(nextWord);
  };

  const handleLeave = () => Alert.alert('Leave Session?', 'Your partner will be disconnected.', [
    { text: 'Stay', style: 'cancel' },
    { text: 'Leave', style: 'destructive', onPress: onEnd },
  ]);

  if (gameOver) return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.doneWrap}>
        <Text style={{ fontSize: 60 }}>🎉</Text>
        <Text style={s.doneTitle}>Story Complete!</Text>
        <Text style={s.doneSub}>+{lines.length * 5} gems earned</Text>
        <View style={[s.trackBadge, { borderColor: track.color }]}>
          <Text style={[s.trackBadgeTxt, { color: track.color }]}>{track.icon} {track.name}</Text>
        </View>
        {lines.map((line, i) => (
          <View key={String(i)} style={s.doneLineWrap}>
            <Text style={s.doneHero}>{'👤 ' + line.hero}</Text>
            <Text style={s.donePartner}>{'🤝 ' + line.partner}</Text>
          </View>
        ))}
        <TouchableOpacity style={s.doneBtn} onPress={() => { addGems(lines.length * 5); onEnd(); }}>
          <Text style={s.doneBtnTxt}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.gameHeader}>
        <TouchableOpacity style={s.leaveBtn} onPress={handleLeave}>
          <Text style={s.leaveTxt}>Leave</Text>
        </TouchableOpacity>
        <View style={[s.trackMini, { borderColor: track.color + '66' }]}>
          <Text style={[s.trackMiniTxt, { color: track.color }]}>{track.icon} {lineIdx + 1}/{lines.length}</Text>
        </View>
        <View style={s.gameProgressBg}>
          <View style={[s.gameProgressFill, { width: Math.round(lineIdx / lines.length * 100) + '%', backgroundColor: track.color }]} />
        </View>
      </View>

      {soundLog.length > 0 ? (
        <View style={s.soundLog}>
          {soundLog.map(sl => (
            <View key={String(sl.id)} style={[s.soundLogItem, { borderColor: track.color + '66' }]}>
              <Text style={s.soundLogIcon}>{sl.icon}</Text>
              <Text style={[s.soundLogTxt, { color: track.color }]}>{sl.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <ScrollView contentContainerStyle={s.gameContent}>
        {done.map(i => (
          <View key={String(i)} style={s.doneLine}>
            <Text style={s.doneHeroSmall}>{'✅ ' + lines[i].hero}</Text>
            <Text style={s.donePartnerSmall}>{'🤝 ' + lines[i].partner}</Text>
          </View>
        ))}
        <View style={[s.currentCard, { borderColor: track.color + '44' }]}>
          <Text style={[s.currentLabel, { color: track.color }]}>Your turn:</Text>
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
        {showPartner ? (
          <View style={[s.partnerCard, { borderColor: track.color + '44', backgroundColor: track.color + '12' }]}>
            <Text style={[s.partnerLabel, { color: track.color }]}>🤝 Partner completing...</Text>
            <Text style={s.partnerText}>{story?.partner}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function Coop({ onBack }) {
  const { lang, gems, addGems, track: userTrack } = useApp();
  const T = (k) => t(k, lang);
  const [screen,    setScreen]    = useState('tutorial');
  const [role,      setRole]      = useState(null);
  const [trackId,   setTrackId]   = useState(userTrack?.id || 'spy');
  const [search,    setSearch]    = useState('');

  if (screen === 'tutorial') return <TutorialScreen onDone={() => setScreen('home')} />;
  if (screen === 'waiting')  return <WaitingScreen trackId={trackId} onCancel={() => setScreen('home')} />;
  if (screen === 'game')     return <CoopGame trackId={trackId} onEnd={() => setScreen('home')} addGems={addGems} />;

  if (screen === 'friends') {
    const filtered = FRIENDS.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.city.toLowerCase().includes(search.toLowerCase()));
    return (
      <SafeAreaView style={s.safe}>
        <PageHeader title="Friends" onBack={() => setScreen('home')} backLabel={T('back')} />
        <View style={s.searchWrap}>
          <TextInput style={s.searchInput} placeholder="Search friends..." placeholderTextColor="rgba(255,255,255,0.25)"
            value={search} onChangeText={setSearch} />
        </View>
        <ScrollView contentContainerStyle={s.pageContent}>
          {filtered.map(f => (
            <View key={String(f.id)} style={s.friendCard}>
              <View style={s.friendAvatar}>
                <Text style={{ fontSize: 22 }}>🐦</Text>
                {f.online ? <View style={s.onlineDot} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.friendName}>{f.name}</Text>
                <Text style={s.friendMeta}>{f.city} · {f.track} · {f.level}</Text>
              </View>
              <TouchableOpacity style={[s.inviteBtn, !f.online ? s.inviteBtnOff : null]}
                onPress={() => f.online ? Alert.alert('Invite sent!', 'Waiting for ' + f.name + '...') : Alert.alert('Offline', f.name + ' is offline.')}>
                <Text style={[s.inviteBtnTxt, !f.online ? s.inviteBtnTxtOff : null]}>{f.online ? 'Invite' : 'Offline'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const track = TRACKS.find(tr => tr.id === trackId) || TRACKS[0];
  const sounds = TRACK_SOUNDS[trackId] || TRACK_SOUNDS.spy;

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title="Co-op" onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <View style={[s.explainCard, { borderColor: track.color + '44' }]}>
          <View style={[s.explainBird, { borderColor: track.color + '66' }]}><Text style={{ fontSize: 30 }}>🐦</Text></View>
          <Text style={s.explainTitle}>Play with a friend!</Text>
          <Text style={s.explainBody}>Complete one story together. You write hero lines, your partner completes each scene.</Text>
          <TouchableOpacity style={s.tutBtn} onPress={() => setScreen('tutorial')}>
            <Text style={s.tutBtnTxt}>How it works</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionLabel}>Track:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {TRACKS.map(tr => (
            <TouchableOpacity key={tr.id}
              style={[s.trackChip, trackId === tr.id ? { borderColor: tr.color, backgroundColor: tr.color + '22' } : { borderColor: 'rgba(255,255,255,0.1)' }]}
              onPress={() => setTrackId(tr.id)}>
              <Text style={{ fontSize: 20 }}>{tr.icon}</Text>
              <Text style={[s.trackChipTxt, trackId === tr.id ? { color: tr.color } : null]}>{tr.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[s.soundsCard, { borderColor: track.color + '33' }]}>
          <Text style={[s.soundsTitle, { color: track.color }]}>{track.icon} {track.name} Sounds</Text>
          <Text style={s.soundsAmbient}>{sounds.ambient}</Text>
          <View style={s.soundsGrid}>
            {sounds.sounds.map(snd => (
              <View key={snd.label} style={[s.soundItem, { borderColor: track.color + '33' }]}>
                <Text style={{ fontSize: 20 }}>{snd.icon}</Text>
                <Text style={s.soundLabel}>{snd.label}</Text>
                <Text style={s.soundTrigger}>{snd.trigger}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={s.sectionLabel}>Your role:</Text>
        {[{ id:'hero', icon:'👤', label:'The Hero', desc:'Write the main sentences' }, { id:'partner', icon:'🤝', label:'The Partner', desc:'Complete your partner lines' }].map(r => (
          <TouchableOpacity key={r.id}
            style={[s.roleBtn, role === r.id ? { borderColor: track.color, backgroundColor: track.color + '18' } : null]}
            onPress={() => setRole(r.id)}>
            <Text style={s.roleIcon}>{r.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.roleLabel, role === r.id ? { color: track.color } : null]}>{r.label}</Text>
              <Text style={s.roleDesc}>{r.desc}</Text>
            </View>
            {role === r.id ? <Text style={[s.roleCheck, { color: track.color }]}>✓</Text> : null}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={s.friendsBtn} onPress={() => setScreen('friends')}>
          <Text style={{ fontSize: 22 }}>👥</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.friendsBtnLabel}>Friends</Text>
            <Text style={s.friendsBtnSub}>{FRIENDS.filter(f => f.online).length} online now</Text>
          </View>
          <Text style={s.friendsBtnArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.startBtn, { opacity: role ? 1 : 0.3, backgroundColor: track.color + 'cc' }]}
          onPress={() => role && setScreen('waiting')} disabled={!role}>
          <Text style={s.startBtnTxt}>{role ? 'Find a Partner ←' : 'Choose your role first'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.demoBtn} onPress={() => setScreen('game')}>
          <Text style={s.demoBtnTxt}>Try Demo Mode</Text>
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
  explainBird:     { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0a150a', borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  explainTitle:    { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6 },
  explainBody:     { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  tutBtn:          { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  tutBtnTxt:       { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  trackChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  trackChipTxt:    { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  soundsCard:      { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  soundsTitle:     { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  soundsAmbient:   { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12, fontStyle: 'italic' },
  soundsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  soundItem:       { borderWidth: 1, borderRadius: 10, padding: 8, alignItems: 'center', width: '30%' },
  soundLabel:      { fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 3 },
  soundTrigger:    { fontSize: 9, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 2 },
  roleBtn:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 10 },
  roleIcon:        { fontSize: 26 },
  roleLabel:       { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  roleDesc:        { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  roleCheck:       { fontSize: 20, fontWeight: '900' },
  friendsBtn:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 14 },
  friendsBtnLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  friendsBtnSub:   { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  friendsBtnArrow: { color: 'rgba(255,255,255,0.3)', fontSize: 18 },
  startBtn:        { borderRadius: 13, padding: 14, alignItems: 'center', marginBottom: 10 },
  startBtnTxt:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  demoBtn:         { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 13, padding: 12, alignItems: 'center' },
  demoBtnTxt:      { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  waitCenter:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  waitBird:        { width: 96, height: 96, borderRadius: 48, backgroundColor: '#0a150a', borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  waitTxt:         { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 10 },
  trackPillWait:   { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 8 },
  trackPillWaitTxt:{ fontSize: 13, fontWeight: '600' },
  waitHint:        { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 20 },
  waitSounds:      { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, width: '100%', marginBottom: 24 },
  waitSoundsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 },
  waitAmbient:     { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' },
  cancelBtn:       { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  cancelTxt:       { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  gameHeader:      { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  leaveBtn:        { alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(192,57,43,0.4)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  leaveTxt:        { color: '#c0392b', fontSize: 12, fontWeight: '600' },
  trackMini:       { alignSelf: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 3 },
  trackMiniTxt:    { fontSize: 12, fontWeight: '600' },
  gameProgressBg:  { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  gameProgressFill:{ height: '100%', borderRadius: 2 },
  soundLog:        { paddingHorizontal: 16, paddingBottom: 8, gap: 4 },
  soundLogItem:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  soundLogIcon:    { fontSize: 16 },
  soundLogTxt:     { fontSize: 11, fontWeight: '600' },
  gameContent:     { padding: 16, paddingBottom: 40 },
  doneLine:        { marginBottom: 6, opacity: 0.45 },
  doneHeroSmall:   { fontSize: 12, color: '#a5d6a7', lineHeight: 18 },
  donePartnerSmall:{ fontSize: 12, color: '#7fb3f5', lineHeight: 18 },
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
  partnerCard:     { borderWidth: 1, borderRadius: 12, padding: 14 },
  partnerLabel:    { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  partnerText:     { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 22 },
  doneWrap:        { alignItems: 'center', padding: 24, paddingBottom: 40 },
  doneTitle:       { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 16, marginBottom: 6 },
  doneSub:         { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 12 },
  trackBadge:      { borderWidth: 2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 16 },
  trackBadgeTxt:   { fontSize: 14, fontWeight: '700' },
  doneLineWrap:    { marginBottom: 10, width: '100%' },
  doneHero:        { fontSize: 13, color: '#a5d6a7', lineHeight: 20 },
  donePartner:     { fontSize: 13, color: '#7fb3f5', lineHeight: 20 },
  doneBtn:         { backgroundColor: '#1B3A6B', borderRadius: 13, paddingHorizontal: 28, paddingVertical: 13, marginTop: 20 },
  doneBtnTxt:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  searchWrap:      { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  searchInput:     { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 11, color: '#fff', fontSize: 14 },
  friendCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 12, marginBottom: 8 },
  friendAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0a150a', borderWidth: 1, borderColor: 'rgba(46,139,87,0.4)', alignItems: 'center', justifyContent: 'center', marginRight: 12, position: 'relative' },
  onlineDot:       { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E8B57', borderWidth: 2, borderColor: '#08080f' },
  friendName:      { fontSize: 14, fontWeight: '700', color: '#fff' },
  friendMeta:      { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  inviteBtn:       { backgroundColor: '#1B3A6B', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  inviteBtnOff:    { backgroundColor: 'rgba(255,255,255,0.06)' },
  inviteBtnTxt:    { color: '#fff', fontSize: 12, fontWeight: '700' },
  inviteBtnTxtOff: { color: 'rgba(255,255,255,0.3)' },
});
