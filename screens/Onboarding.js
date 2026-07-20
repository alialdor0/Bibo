import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Animated, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import ThemedSafeArea from '../components/Themed';
import { t, GENDERS, COUNTRIES, CITIES, JOBS, MONTHS, LEVEL_TITLES, getPrefix, getZodiac, itemLabel } from '../data';
import WheelPicker from '../components/WheelPicker';
import BiboCharacter from '../components/BiboCharacter';
import LevelTest from '../components/LevelTest';
import BiboIcon from '../components/BiboIcon';
import { playSfx } from '../utils/sfx';

const TOTAL = 8;
const DAYS  = Array.from({ length: 31 }, (_, i) => [String(i + 1), String(i + 1)]);
const CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 90 }, (_, i) => { const y = CUR_YEAR - 13 - i; return [String(y), String(y)]; });

/** يحسب العمر الحالي من تاريخ الميلاد */
function calcAge(day, monthEn, year) {
  const monthIdx = MONTHS.findIndex(m => m[0] === monthEn);
  if (monthIdx < 0 || !day || !year) return '';
  const today = new Date();
  const birth = new Date(parseInt(year, 10), monthIdx, parseInt(day, 10));
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > monthIdx || (today.getMonth() === monthIdx && today.getDate() >= parseInt(day, 10));
  if (!hasHadBirthdayThisYear) age -= 1;
  return String(Math.max(0, age));
}

/** عدد أيام شهر معيّن (يراعي فبراير بالسنة الكبيسة) */
function daysInMonth(monthEn, year) {
  const monthIdx = MONTHS.findIndex(m => m[0] === monthEn);
  if (monthIdx < 0) return 31;
  return new Date(parseInt(year, 10) || CUR_YEAR, monthIdx + 1, 0).getDate();
}

export default function Onboarding({ onDone }) {
  const { lang, user: existingUser, setUser } = useApp();
  const T = (k) => t(k, lang);

  const [step, setStep]     = useState(0);
  const [err, setErr]       = useState('');
  const [levelDone, setLevelDone] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  const [u, setU] = useState({
    firstName: '', lastName: '', gender: 'Male',
    country: 'Iraq', city: 'Baghdad',
    customCountry: '', customCity: '', customJob: '',
    job: 'Doctor',
    birthDay: '1', birthMonth: 'January', birthYear: String(CUR_YEAR - 20),
    levelScore: 0, levelTitle: LEVEL_TITLES[0],
  });

  const set = useCallback((key, val) => {
    setU(prev => ({ ...prev, [key]: val }));
  }, []);

  const onCountry = useCallback((en) => {
    const cities = CITIES[en] || [];
    setU(prev => ({ ...prev, country: en, city: cities[0]?.[0] || '', customCity: '' }));
  }, []);

  const onBirthMonth = useCallback((v) => {
    setU(prev => {
      const maxDay = daysInMonth(v, prev.birthYear);
      const day = parseInt(prev.birthDay, 10) > maxDay ? String(maxDay) : prev.birthDay;
      return { ...prev, birthMonth: v, birthDay: day };
    });
  }, []);

  const onBirthYear = useCallback((v) => {
    setU(prev => {
      const maxDay = daysInMonth(prev.birthMonth, v);
      const day = parseInt(prev.birthDay, 10) > maxDay ? String(maxDay) : prev.birthDay;
      return { ...prev, birthYear: v, birthDay: day };
    });
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
      if (!u.firstName.trim()) {
        const msg = lang === 'ar' ? 'الرجاء إدخال اسمك الأول' : 'Please enter your first name';
        setErr(msg);
        Alert.alert(lang === 'ar' ? 'حقل ناقص' : 'Missing field', msg);
        shake();
        return;
      }
      if (!u.lastName.trim()) {
        const msg = lang === 'ar' ? 'الرجاء إدخال اسمك الأخير' : 'Please enter your last name';
        setErr(msg);
        Alert.alert(lang === 'ar' ? 'حقل ناقص' : 'Missing field', msg);
        shake();
        return;
      }
    }
    setErr('');
    shake();
    playSfx('pageTurn');
    setTimeout(() => setStep(s => s + 1), 160);
  }, [step, u, shake, lang]);

  const back = useCallback(() => {
    setErr('');
    shake();
    playSfx('pageTurn');
    setTimeout(() => setStep(s => s - 1), 160);
  }, [shake]);

  // لمعان متحرك على بطاقة الهوية بخطوة 8
  React.useEffect(() => {
    if (step === 8) {
      shineAnim.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(shineAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
          Animated.timing(shineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [step, shineAnim]);

  const birdY = floatAnim.interpolate({ inputRange: [0,1], outputRange: [0,-10] });
  const birdX = shakeAnim.interpolate({ inputRange: [-1,1], outputRange: [-8,8] });
  const shineX = shineAnim.interpolate({ inputRange: [0,1], outputRange: [-160, 420] });
  const pct   = step >= 1 && step <= TOTAL ? Math.round(step / TOTAL * 100) + '%' : '0%';
  const cityList = CITIES[u.country] || [['Other','أخرى']];
  const prefix   = getPrefix(u.customJob.trim() ? 'Other' : u.job);
  const fName    = (prefix ? prefix + ' ' : '') + u.firstName + ' ' + u.lastName;
  const lvl      = u.levelTitle || LEVEL_TITLES[0];
  const genders  = GENDERS[lang] || GENDERS.ar;
  const age      = calcAge(u.birthDay, u.birthMonth, u.birthYear);
  const zodiac   = getZodiac(u.birthDay, u.birthMonth);

  const bibState =
    step === 0 ? 'welcome' :
    step === 7 && !levelDone ? 'thinking' :
    step === 7 && levelDone ? 'celebrate' :
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
      age,
      zodiac,
      levelTitle: lvl,
      loginCode: existingUser?.loginCode,
    };
    setUser(userData);
    onDone(userData);
  };

  return (
    <ThemedSafeArea style={s.safe}>
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
                <ScrollView style={s.jobScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
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
                <View style={s.dobRow}>
                  <View style={s.dobCol}>
                    <WheelPicker items={DAYS.slice(0, daysInMonth(u.birthMonth, u.birthYear))} value={u.birthDay} onChange={v => set('birthDay', v)} hint={lang === 'ar' ? 'اليوم' : 'Day'} />
                  </View>
                  <View style={s.dobColWide}>
                    <WheelPicker items={MONTHS} value={u.birthMonth} onChange={onBirthMonth} hint={lang === 'ar' ? 'الشهر' : 'Month'} />
                  </View>
                  <View style={s.dobCol}>
                    <WheelPicker items={YEARS} value={u.birthYear} onChange={onBirthYear} hint={lang === 'ar' ? 'السنة' : 'Year'} />
                  </View>
                </View>
                <View style={s.zodiacCard}>
                  <Text style={{ fontSize: 26 }}>{zodiac.emoji}</Text>
                  <Text style={s.zodiacTxt}>
                    {lang === 'ar' ? `برجك: ${zodiac.ar}` : `Your zodiac: ${zodiac.en}`}
                  </Text>
                </View>
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
                <LevelTest
                  lang={lang}
                  ctaLabel={T('start') + ' 🎬'}
                  onQuizFinished={() => setLevelDone(true)}
                  onComplete={(score, lvlObj) => {
                    setU(prev => ({ ...prev, levelScore: score, levelTitle: lvlObj }));
                    next();
                  }}
                />
                {levelDone ? BackBtn : null}
              </View>
            ) : null}

            {step === 8 ? (
              <View style={s.sw}>
                <Text style={s.readyLbl}>{T('ready')}</Text>
                <View style={s.idCard}>
                  <Animated.View
                    pointerEvents="none"
                    style={[s.idShine, { transform: [{ rotate: '20deg' }, { translateX: shineX }] }]}
                  />
                  <View style={s.idHeader}>
                    <View style={s.idBird}><BiboIcon size={32} /></View>
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
                    ['Age', age],
                    ['Zodiac', `${zodiac.emoji} ${zodiac.en}`],
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
    </ThemedSafeArea>
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
  dobRow:       { flexDirection: 'row', width: '100%', gap: 6 },
  dobCol:       { flex: 1 },
  dobColWide:   { flex: 1.4 },
  zodiacCard:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginTop: 10, marginBottom: 4 },
  zodiacTxt:    { color: '#fff', fontSize: 14, fontWeight: '700' },
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
  readyLbl:     { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12, textAlign: 'center' },
  idCard:       { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 18, overflow: 'hidden', position: 'relative' },
  idShine:      { position: 'absolute', top: -80, bottom: -80, left: -40, width: 70, backgroundColor: 'rgba(255,255,255,0.16)' },
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
