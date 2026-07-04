import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Animated, KeyboardAvoidingView, Platform, SafeAreaView, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { t, GENDERS, COUNTRIES, CITIES, JOBS, AGES, ASSESSMENT, LEVEL_TITLES, getLevel, getPrefix, itemLabel } from '../data';
import WheelPicker, { AgePicker } from '../components/WheelPicker';
import BiboCharacter from '../components/BiboCharacter';
import { playSfx } from '../utils/sfx';

const TOTAL = 8;

export default function Onboarding({ onDone }) {
  const { lang, setUser } = useApp();
  const T = (k) => t(k, lang);

  const [step, setStep]     = useState(0);
  const [err, setErr]       = useState('');
  const [assess, setAssess] = useState({ qIdx: 0, score: 0, done: false, chosen: null });

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const [u, setU] = useState({
    firstName: '', lastName: '', gender: 'Male',
    country: 'Iraq', city: 'Baghdad',
    customCountry: '', customCity: '', customJob: '',
    job: 'Doctor', age: '18',
    levelScore: 0, levelTitle: LEVEL_TITLES[0],
  });

  const set = useCallback((key, val) => {
    setU(prev => ({ ...prev, [key]: val }));
  }, []);

  const onCountry = useCallback((en) => {
    const cities = CITIES[en] || [];
    setU(prev => ({ ...prev, country: en, city: cities[0]?.[0] || '', customCity: '' }));
  }, []);

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1,   duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1,  duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0.4, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 80, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const next = useCallback(() => {
    if (step === 1) {
      if (!u.firstName.trim()) { setErr('Please enter your first name'); return; }
      if (!u.lastName.trim())  { setErr('Please enter your last name');  return; }
    }
    setErr('');
    shake();
    playSfx('pageTurn');
    setTimeout(() => setStep(s => s + 1), 160);
  }, [step, u, shake]);

  const back = useCallback(() => {
    setErr('');
    shake();
    playSfx('pageTurn');
    setTimeout(() => setStep(s => s - 1), 160);
  }, [shake]);

  const answerAssessment = useCallback((optIdx) => {
    if (assess.chosen !== null) return;
    const q       = ASSESSMENT[assess.qIdx];
    const correct = optIdx === q.correct;
    const newScore = assess.score + (correct ? 1 : 0);
    setAssess(a => ({ ...a, chosen: optIdx }));
    setTimeout(() => {
      const nextQ = assess.qIdx + 1;
      if (nextQ >= ASSESSMENT.length) {
        const lvl = getLevel(newScore);
        setU(prev => ({ ...prev, levelScore: newScore, levelTitle: lvl }));
        setAssess({ qIdx: 0, score: newScore, done: true, chosen: null });
      } else {
        setAssess({ qIdx: nextQ, score: newScore, done: false, chosen: null });
      }
    }, 700);
  }, [assess]);

  const birdY = floatAnim.interpolate({ inputRange: [0,1], outputRange: [0,-10] });
  const birdX = shakeAnim.interpolate({ inputRange: [-1,1], outputRange: [-8,8] });
  const pct   = step >= 1 && step <= TOTAL ? Math.round(step / TOTAL * 100) + '%' : '0%';
  const cityList = CITIES[u.country] || [['Other','أخرى']];
  const prefix   = getPrefix(u.customJob.trim() ? 'Other' : u.job);
  const fName    = (prefix ? prefix + ' ' : '') + u.firstName + ' ' + u.lastName;
  const lvl      = u.levelTitle || LEVEL_TITLES[0];
  const genders  = GENDERS[lang] || GENDERS.ar;

  const bibState =
    step === 0 ? 'welcome' :
    step === 7 && !assess.done ? 'thinking' :
    step === 7 && assess.done ? 'celebrate' :
    step === 8 ? 'celebrate' :
    'attention';

  const bibMsg =
    step === 0 ? (lang === 'ar' ? 'يلا نجهز شخصيتك!' : "Let's build your character!") :
    step === 8 ? (lang === 'ar' ? 'بطاقتك جاهزة! 🎉' : 'Your card is ready! 🎉') :
    undefined;

  const Bird = (
    <Animated.View style={[s.birdWrap, { transform: [{ translateY: birdY }, { translateX: birdX }] }]}>
      <BiboCharacter state={bibState} message={bibMsg} size={88} />
    </Animated.View>
  );

  const BackBtn = (
    <TouchableOpacity style={s.backBtn} onPress={back} accessibilityRole="button">
      <Text style={s.backTxt}>{'← ' + T('back')}</Text>
    </TouchableOpacity>
  );

  const finishOnboarding = () => {
    const userData = {
      ...u,
      fullName: fName,
      levelTitle: lvl,
      loginType: 'apple',
    };
    setUser(userData);
    onDone(userData);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          {Bird}

          {step === 0 ? (
            <View style={s.titleWrap}>
              <Text style={s.appName}>Bibo</Text>
              <Text style={s.tagline}>{T('appTagline')}</Text>
            </View>
          ) : null}

          <View style={s.card}>

            {step === 0 ? (
              <View style={s.sw}>
                <View style={s.divider} />
                <Text style={s.desc}>{T('heroDesc')}</Text>
                <View style={s.tracks}>
                  {[['Spy','#aaa'],['Love','#8B0000'],['Family','#8B4513'],['Crime','#1B3A6B'],['Medical','#2E8B57']].map(tr => (
                    <View key={tr[0]} style={[s.chip, { borderColor: tr[1] }]}>
                      <Text style={[s.chipTxt, { color: tr[1] }]}>{tr[0]}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={s.btn} onPress={next} accessibilityRole="button">
                  <Text style={s.btnTxt}>{T('startStory')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {step === 1 ? (
              <View style={s.sw}>
                <Text style={s.stepLbl}>{step + ' / ' + TOTAL}</Text>
                <Text style={s.q}>{T('qName')}</Text>
                <Text style={s.desc}>Your name will appear in the story as you write it</Text>
                <TextInput style={s.inp} placeholder="First name" placeholderTextColor="rgba(255,255,255,0.25)"
                  value={u.firstName} onChangeText={v => { set('firstName', v); setErr(''); }}
                  autoFocus autoCapitalize="words" accessibilityLabel="First name" />
                <TextInput style={s.inp} placeholder="Last name" placeholderTextColor="rgba(255,255,255,0.25)"
                  value={u.lastName} onChangeText={v => { set('lastName', v); setErr(''); }}
                  autoCapitalize="words" accessibilityLabel="Last name" />
                {err ? <Text style={s.errTxt}>{err}</Text> : null}
                <TouchableOpacity style={s.btn} onPress={next} accessibilityRole="button">
                  <Text style={s.btnTxt}>{T('next')}</Text>
                </TouchableOpacity>
                {BackBtn}
              </View>
            ) : null}

            {step === 2 ? (
              <View style={s.sw}>
                <Text style={s.stepLbl}>{step + ' / ' + TOTAL}</Text>
                <Text style={s.q}>{T('qGender')}</Text>
                <WheelPicker items={genders} value={u.gender} onChange={v => set('gender', v)} hint={T('scrollHint')} />
                <TouchableOpacity style={s.btn} onPress={next} accessibilityRole="button">
                  <Text style={s.btnTxt}>{T('next')}</Text>
                </TouchableOpacity>
                {BackBtn}
              </View>
            ) : null}

            {step === 3 ? (
              <View style={s.sw}>
                <Text style={s.stepLbl}>{step + ' / ' + TOTAL}</Text>
                <Text style={s.q}>{T('qCountry')}</Text>
                <WheelPicker items={COUNTRIES} value={u.country} onChange={onCountry} hint={T('scrollHint')} />
                <Text style={s.orType}>{T('orType')}</Text>
                <TextInput style={s.inpSm} placeholder="Type your country..."
                  placeholderTextColor="rgba(255,255,255,0.25)" value={u.customCountry}
                  onChangeText={v => set('customCountry', v)} />
                {u.customCountry.trim() ? <Text style={s.customTag}>✅ {u.customCountry.trim()}</Text> : null}
                <TouchableOpacity style={s.btn} onPress={next} accessibilityRole="button">
                  <Text style={s.btnTxt}>{T('next')}</Text>
                </TouchableOpacity>
                {BackBtn}
              </View>
            ) : null}

            {step === 4 ? (
              <View style={s.sw}>
                <Text style={s.stepLbl}>{step + ' / ' + TOTAL}</Text>
                <Text style={s.q}>{T('qCity')}</Text>
                <WheelPicker items={cityList} value={u.city} onChange={v => { set('city', v); set('customCity', ''); }} hint={T('scrollHint')} />
                <Text style={s.orType}>{T('orType')}</Text>
                <TextInput style={s.inpSm} placeholder="Type your city..."
                  placeholderTextColor="rgba(255,255,255,0.25)" value={u.customCity}
                  onChangeText={v => set('customCity', v)} />
                {u.customCity.trim() ? <Text style={s.customTag}>✅ {u.customCity.trim()}</Text> : null}
                <TouchableOpacity style={s.btn} onPress={next} accessibilityRole="button">
                  <Text style={s.btnTxt}>{T('next')}</Text>
                </TouchableOpacity>
                {BackBtn}
              </View>
            ) : null}

            {step === 5 ? (
              <View style={s.sw}>
                <Text style={s.stepLbl}>{step + ' / ' + TOTAL}</Text>
                <Text style={s.q}>{T('qJob')}</Text>
                <ScrollView style={s.jobScroll} showsVerticalScrollIndicator={false}>
                  {JOBS.map(j => {
                    const isSel = u.job === j.en && !u.customJob.trim();
                    return (
                      <TouchableOpacity key={j.en}
                        style={[s.jobBtn, isSel ? s.jobBtnSel : null]}
                        onPress={() => { set('job', j.en); set('customJob', ''); }}
                        accessibilityRole="button">
                        <View style={s.jobLeft}>
                          {j.prefix ? <View style={s.prefixBadge}><Text style={s.prefixTxt}>{j.prefix}</Text></View> : null}
                          <Text style={[s.jobEn, isSel ? s.jobEnSel : null]}>{j.en}</Text>
                        </View>
                        <Text style={s.jobAr}>{j.ar}</Text>
                        {isSel ? <Text style={s.jobCheck}>✓</Text> : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <Text style={s.orType}>{T('orType')}</Text>
                <TextInput style={s.inpSm} placeholder="Type your profession in English..."
                  placeholderTextColor="rgba(255,255,255,0.25)" value={u.customJob}
                  onChangeText={v => set('customJob', v)} />
                {u.customJob.trim() ? <Text style={s.customTag}>✅ {u.customJob.trim()}</Text> : null}
                <TouchableOpacity style={s.btn} onPress={next} accessibilityRole="button">
                  <Text style={s.btnTxt}>{T('next')}</Text>
                </TouchableOpacity>
                {BackBtn}
              </View>
            ) : null}

            {step === 6 ? (
              <View style={s.sw}>
                <Text style={s.stepLbl}>{step + ' / ' + TOTAL}</Text>
                <Text style={s.q}>{T('qAge')}</Text>
                <AgePicker ages={AGES} value={u.age} onChange={v => set('age', v)} hint={T('scrollHint')} />
                <TouchableOpacity style={s.btn} onPress={next} accessibilityRole="button">
                  <Text style={s.btnTxt}>{T('next')}</Text>
                </TouchableOpacity>
                {BackBtn}
              </View>
            ) : null}

            {step === 7 ? (
              <View style={s.sw}>
                <Text style={s.stepLbl}>{step + ' / ' + TOTAL}</Text>
                <Text style={s.q}>{T('qLevel')}</Text>
                <Text style={s.desc}>{T('levelNote')}</Text>
                {!assess.done ? (
                  <View style={s.assessWrap}>
                    <Text style={s.assessCounter}>Question {assess.qIdx + 1}/{ASSESSMENT.length}</Text>
                    <View style={s.assessBar}>
                      <View style={[s.assessFill, { width: Math.round(assess.qIdx / ASSESSMENT.length * 100) + '%' }]} />
                    </View>
                    <Text style={s.assessQ}>{ASSESSMENT[assess.qIdx].q}</Text>
                    <View style={s.assessOpts}>
                      {ASSESSMENT[assess.qIdx].opts.map((opt, i) => {
                        const isSel = assess.chosen === i;
                        const isOk  = i === ASSESSMENT[assess.qIdx].correct;
                        const bg = !isSel ? 'rgba(255,255,255,0.05)' : isOk ? 'rgba(46,139,87,0.3)' : 'rgba(192,57,43,0.3)';
                        const bc = !isSel ? 'rgba(255,255,255,0.12)' : isOk ? '#2E8B57' : '#c0392b';
                        return (
                          <TouchableOpacity key={String(i)} style={[s.assessOpt, { backgroundColor: bg, borderColor: bc }]}
                            onPress={() => answerAssessment(i)} accessibilityRole="button">
                            <Text style={s.assessOptTxt}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <View style={s.levelResult}>
                    <Text style={{ fontSize: 48 }}>🏆</Text>
                    <Text style={s.levelScore}>{assess.score}/{ASSESSMENT.length}</Text>
                    <View style={[s.levelBadge, { borderColor: lvl.color }]}>
                      <Text style={[s.levelBadgeTxt, { color: lvl.color }]}>{lvl.en}</Text>
                    </View>
                    <Text style={s.levelAr}>{lvl.ar}</Text>
                    <TouchableOpacity style={[s.btn, { backgroundColor: '#8B0000', marginTop: 16 }]}
                      onPress={next} accessibilityRole="button">
                      <Text style={s.btnTxt}>{T('start')} 🎬</Text>
                    </TouchableOpacity>
                    {BackBtn}
                  </View>
                )}
              </View>
            ) : null}

            {step === 8 ? (
              <View style={s.sw}>
                <Text style={s.readyLbl}>{T('ready')}</Text>
                <View style={s.idCard}>
                  <View style={s.idHeader}>
                    <View style={s.idBird}><Text style={{ fontSize: 28 }}>🐦</Text></View>
                    <View>
                      <Text style={s.idAppName}>BIBO</Text>
                      <Text style={s.idCardLabel}>Digital ID Card</Text>
                    </View>
                  </View>
                  <View style={s.idDivider} />
                  {[
                    ['Full Name', fName],
                    ['Profession', u.customJob.trim() || u.job],
                    ['Location', (u.customCity.trim() || u.city) + ', ' + (u.customCountry.trim() || u.country)],
                    ['Age', u.age],
                    ['Level', lvl.en],
                  ].map(row => (
                    <View key={row[0]} style={s.idRow}>
                      <Text style={s.idKey}>{row[0]}</Text>
                      <Text style={[s.idVal, row[0] === 'Level' ? { color: lvl.color } : null]}>{row[1]}</Text>
                    </View>
                  ))}
                  <View style={s.idDivider} />
                  <View style={s.idPreview}>
                    <Text style={s.idPreviewTxt}>
                      {'"Welcome, '}<Text style={s.idBold}>{fName}</Text>
                      {'. As a '}<Text style={s.idBold}>{lvl.en}</Text>
                      {', your first mission begins now..."'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={[s.btn, { backgroundColor: '#8B0000', marginTop: 16 }]}
                  onPress={finishOnboarding} accessibilityRole="button">
                  <Text style={s.btnTxt}>{T('enterStory')} 🎬</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {step >= 1 && step <= TOTAL ? (
              <View style={s.bar}><View style={[s.fill, { width: pct }]} /></View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#08080f' },
  scrollContent:{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  birdWrap:     { marginBottom: 10 },
  titleWrap:    { alignItems: 'center', marginBottom: 12 },
  appName:      { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  tagline:      { fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 4, textAlign: 'center' },
  card:         { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, padding: 22, width: '100%', maxWidth: 360 },
  sw:           { alignItems: 'center' },
  stepLbl:      { fontSize: 11, color: 'rgba(255,255,255,0.25)', alignSelf: 'flex-end', marginBottom: 6 },
  q:            { fontSize: 17, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 26, marginBottom: 10 },
  desc:         { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 18, marginBottom: 10 },
  inp:          { width: '100%', padding: 12, borderRadius: 11, marginBottom: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 15 },
  inpSm:        { width: '100%', padding: 10, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14 },
  customTag:    { color: '#a5d6a7', fontSize: 12, alignSelf: 'flex-start', marginBottom: 6 },
  orType:       { fontSize: 11, color: 'rgba(255,255,255,0.35)', alignSelf: 'flex-start', marginTop: 8, marginBottom: 6 },
  errTxt:       { color: '#ff6b6b', fontSize: 12, marginBottom: 6 },
  btn:          { width: '100%', borderRadius: 12, marginTop: 12, backgroundColor: '#1B3A6B', padding: 13, alignItems: 'center' },
  btnTxt:       { color: '#fff', fontSize: 15, fontWeight: '700' },
  backBtn:      { marginTop: 10, padding: 8 },
  backTxt:      { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
  divider:      { width: 40, height: 2, borderRadius: 2, backgroundColor: '#2E8B57', marginVertical: 8 },
  tracks:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6 },
  chip:         { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)', margin: 3 },
  chipTxt:      { fontSize: 11 },
  bar:          { marginTop: 16, height: 2, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', width: '100%' },
  fill:         { height: '100%', backgroundColor: '#2E8B57', borderRadius: 2 },
  jobScroll:    { width: '100%', maxHeight: 200, marginBottom: 4 },
  jobBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 6 },
  jobBtnSel:    { borderColor: '#2E8B57', backgroundColor: 'rgba(46,139,87,0.12)' },
  jobLeft:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefixBadge:  { backgroundColor: 'rgba(27,58,107,0.5)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  prefixTxt:    { color: '#7fb3f5', fontSize: 11, fontWeight: '700' },
  jobEn:        { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  jobEnSel:     { color: '#a5d6a7' },
  jobAr:        { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  jobCheck:     { color: '#2E8B57', fontSize: 16, fontWeight: '900' },
  assessWrap:   { width: '100%' },
  assessCounter:{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'right', marginBottom: 6 },
  assessBar:    { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  assessFill:   { height: '100%', backgroundColor: '#FFB300' },
  assessQ:      { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 16, lineHeight: 24 },
  assessOpts:   { gap: 8, width: '100%' },
  assessOpt:    { borderWidth: 1, borderRadius: 10, padding: 12 },
  assessOptTxt: { color: '#fff', fontSize: 14 },
  levelResult:  { alignItems: 'center', width: '100%' },
  levelScore:   { fontSize: 32, fontWeight: '900', color: '#fff', marginTop: 8, marginBottom: 12 },
  levelBadge:   { borderWidth: 2, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 6, marginBottom: 6 },
  levelBadgeTxt:{ fontSize: 18, fontWeight: '800' },
  levelAr:      { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  readyLbl:     { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12, textAlign: 'center' },
  idCard:       { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 18 },
  idHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  idBird:       { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0a150a', borderWidth: 2, borderColor: 'rgba(46,139,87,0.5)', alignItems: 'center', justifyContent: 'center' },
  idAppName:    { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  idCardLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  idDivider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },
  idRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  idKey:        { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  idVal:        { fontSize: 13, color: '#fff', fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 12 },
  idPreview:    { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12 },
  idPreviewTxt: { color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 20, fontStyle: 'italic' },
  idBold:       { fontWeight: '800', color: '#a5d6a7' },
});
