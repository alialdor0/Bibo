import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useApp } from '../context/AppContext';
import { t, BIBO_PACE } from '../data';
import { PageHeader, GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';

/** صف مقارنة واحد: أنت مقابل بيبو على نفس المقياس */
function RaceRow({ label, myVal, biboVal, unit, lang }) {
  const max = Math.max(myVal, biboVal, 1);
  const myPct   = Math.round((myVal / max) * 100);
  const biboPct = Math.round((biboVal / max) * 100);
  const winning = myVal >= biboVal;

  return (
    <View style={s.raceCard}>
      <Text style={s.raceLabel}>{label}</Text>

      <View style={s.raceLine}>
        <Text style={s.raceWho}>{lang === 'ar' ? 'أنت' : 'You'}</Text>
        <View style={s.raceBarBg}>
          <View style={[s.raceBarFill, { width: myPct + '%', backgroundColor: winning ? '#2E8B57' : '#7fb3f5' }]} />
        </View>
        <Text style={s.raceVal}>{myVal}</Text>
      </View>

      <View style={s.raceLine}>
        <Text style={s.raceWho}>🐦 {lang === 'ar' ? 'بيبو' : 'Bibo'}</Text>
        <View style={s.raceBarBg}>
          <View style={[s.raceBarFill, { width: biboPct + '%', backgroundColor: '#FFB300' }]} />
        </View>
        <Text style={s.raceVal}>{biboVal}</Text>
      </View>

      <Text style={[s.raceStatus, { color: winning ? '#a5d6a7' : '#FFB300' }]}>
        {winning
          ? (lang === 'ar' ? `أنت متقدم على بيبو بـ ${myVal - biboVal} ${unit}! 🎉` : `You're ahead of Bibo by ${myVal - biboVal} ${unit}! 🎉`)
          : (lang === 'ar' ? `باقي ${biboVal - myVal} ${unit} تلحق بيبو` : `${biboVal - myVal} ${unit} to catch up with Bibo`)}
      </Text>
    </View>
  );
}

export default function Leaderboard({ onBack }) {
  const { lang, gems, weeklyProgress, getWordBankWords } = useApp();
  const T = (k) => t(k, lang);

  const myWeeklyWords = weeklyProgress?.wordsLearned || 0;
  const myTotalWords  = useMemo(() => getWordBankWords().filter(w => w.status === 'learned').length, [getWordBankWords]);

  const weeklyWin = myWeeklyWords >= BIBO_PACE.weeklyWords;
  const totalWin  = myTotalWords  >= BIBO_PACE.totalWords;
  const overallLead = weeklyWin && totalWin;

  const biboState = overallLead ? 'celebrate' : weeklyWin ? 'encourage' : 'idea';
  const biboMsg = overallLead
    ? (lang === 'ar' ? 'أنت أسرع مني! رهيب 🏆' : "You're faster than me! Amazing 🏆")
    : (lang === 'ar' ? 'سباق ممتع... يلا نشوف مين بيوصل أول! 🏁' : "Fun race... let's see who gets there first! 🏁");

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={lang === 'ar' ? 'سباق مع بيبو' : 'Race with Bibo'} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <BiboCharacter state={biboState} message={biboMsg} size={80} style={{ marginBottom: 18, alignSelf: 'center' }} />

        <Text style={s.introTxt}>
          {lang === 'ar'
            ? 'بيبو يتعلّم الإنجليزية مثلك تمامًا، وله معدّل ثابت كل أسبوع — شاهد أين أنت منه!'
            : "Bibo is learning English too, at a steady pace every week — see how you compare!"}
        </Text>

        <RaceRow
          label={lang === 'ar' ? 'كلمات هذا الأسبوع' : "This week's words"}
          myVal={myWeeklyWords}
          biboVal={BIBO_PACE.weeklyWords}
          unit={lang === 'ar' ? 'كلمة' : 'words'}
          lang={lang}
        />

        <RaceRow
          label={lang === 'ar' ? 'إجمالي الكلمات المتقنة' : 'Total words mastered'}
          myVal={myTotalWords}
          biboVal={BIBO_PACE.totalWords}
          unit={lang === 'ar' ? 'كلمة' : 'words'}
          lang={lang}
        />

        <View style={s.noteCard}>
          <Text style={s.noteTxt}>
            {lang === 'ar'
              ? 'ℹ️ هذا سباق ودّي مع بيبو نفسه لتحفيزك، وليس ترتيبًا بين مستخدمين حقيقيين.'
              : 'ℹ️ This is a friendly race against Bibo himself to keep you motivated, not a ranking against real users.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#08080f' },
  content:     { padding: 16, paddingBottom: 40 },
  introTxt:    { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 8 },
  raceCard:    { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 14 },
  raceLabel:   { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 12 },
  raceLine:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  raceWho:     { width: 56, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  raceBarBg:   { flex: 1, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  raceBarFill: { height: '100%', borderRadius: 5 },
  raceVal:     { width: 30, textAlign: 'right', fontSize: 12, color: '#fff', fontWeight: '700' },
  raceStatus:  { fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  noteCard:    { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginTop: 6 },
  noteTxt:     { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', lineHeight: 17 },
});
