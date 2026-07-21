import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import ThemedSafeArea from '../components/Themed';
import { t, BIBO_PACE } from '../data';
import { PageHeader, GemsBadge } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import BiboIcon from '../components/BiboIcon';

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
        <View style={s.raceWhoRow}><BiboIcon size={14} /><Text style={s.raceWhoTxt}> {lang === 'ar' ? 'بيبو' : 'Bibo'}</Text></View>
        <View style={s.raceBarBg}>
          <View style={[s.raceBarFill, { width: biboPct + '%', backgroundColor: '#FFB300' }]} />
        </View>
        <Text style={s.raceVal}>{biboVal}</Text>
      </View>

      <Text style={[s.raceStatus, { color: winning ? '#a5d6a7' : '#FFB300' }]}>
        {winning
          ? (lang === 'ar' ? `أنت متقدم على بيبو بـ ${myVal - biboVal} ${unit}! 🎉` : `You're ahead of Bibo by ${myVal - biboVal} ${unit}! 🎉`)
          : (lang === 'ar' ? `باقي ${biboVal - myVal} ${unit} لتلحق ببيبو` : `${biboVal - myVal} ${unit} to catch up with Bibo`)}
      </Text>
    </View>
  );
}

function GameCard({ icon, title, subtitle, color, onPress }) {
  return (
    <TouchableOpacity style={[s.gameCard, { borderColor: color + '44' }]} onPress={onPress} accessibilityRole="button">
      <View style={[s.gameIconWrap, { backgroundColor: color + '22' }]}>
        <Text style={{ fontSize: 26 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.gameTitle}>{title}</Text>
        <Text style={s.gameSub}>{subtitle}</Text>
      </View>
      <Text style={s.gameArrow}>←</Text>
    </TouchableOpacity>
  );
}

export default function Leaderboard({ onBack, onNav }) {
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
    : (lang === 'ar' ? 'تحدٍّ ممتع... لنرَ من يصل أولًا! 🏁' : "Fun challenge... let's see who gets there first! 🏁");

  const goChallenge = (mode) => onNav && onNav('rescue', { initialChallenge: mode });

  return (
    <ThemedSafeArea style={s.safe}>
      <PageHeader title={lang === 'ar' ? 'سباقك مع بيبو' : 'Your race with Bibo'} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <BiboCharacter state={biboState} message={biboMsg} size={80} style={{ marginBottom: 18, alignSelf: 'center' }} />

        <Text style={s.sectionTitle}>{lang === 'ar' ? 'ألعاب المنافسة' : 'Competition games'}</Text>
        <GameCard
          icon="⚔️"
          color="#FFB300"
          title={lang === 'ar' ? 'مبارزة بالكلمات' : 'Word Duel'}
          subtitle={lang === 'ar' ? 'تحدٍّ سريع بالوقت — أنت مقابل بيبو' : 'A fast timed challenge — you vs Bibo'}
          onPress={() => goChallenge('duel')}
        />
        <GameCard
          icon="📝"
          color="#7fb3f5"
          title={lang === 'ar' ? 'مبارزة بالجمل' : 'Sentence Duel'}
          subtitle={lang === 'ar' ? 'رتّب جملة كاملة قبل بيبو!' : 'Arrange a full sentence before Bibo!'}
          onPress={() => goChallenge('sentenceDuel')}
        />
        <GameCard
          icon="🤪"
          color="#a5d6a7"
          title={lang === 'ar' ? 'بيبو المشاكس' : 'Clumsy Bibo'}
          subtitle={lang === 'ar' ? 'بيبو يحاول الإجابة... صحّح له إن أخطأ!' : 'Bibo tries to answer... correct him if he errs!'}
          onPress={() => goChallenge('clumsy')}
        />

        <Text style={[s.sectionTitle, { marginTop: 10 }]}>{lang === 'ar' ? 'معدّل بيبو الأسبوعي' : "Bibo's weekly pace"}</Text>
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
              ? 'ℹ️ كل هذا منافسة ودّية مع بيبو نفسه لتحفيزك، وليست ترتيبًا بين مستخدمين حقيقيين.'
              : 'ℹ️ All of this is a friendly competition against Bibo himself to keep you motivated, not a ranking against real users.'}
          </Text>
        </View>
      </ScrollView>
    </ThemedSafeArea>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#08080f' },
  content:     { padding: 16, paddingBottom: 40 },
  sectionTitle:{ color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 10 },
  gameCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  gameIconWrap:{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  gameTitle:   { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  gameSub:     { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  gameArrow:   { color: 'rgba(255,255,255,0.25)', fontSize: 20 },
  introTxt:    { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 8 },
  raceCard:    { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 14 },
  raceLabel:   { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 12 },
  raceLine:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  raceWho:     { width: 56, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  raceWhoRow:  { width: 56, flexDirection: 'row', alignItems: 'center' },
  raceWhoTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  raceBarBg:   { flex: 1, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  raceBarFill: { height: '100%', borderRadius: 5 },
  raceVal:     { width: 30, textAlign: 'right', fontSize: 12, color: '#fff', fontWeight: '700' },
  raceStatus:  { fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  noteCard:    { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginTop: 6 },
  noteTxt:     { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', lineHeight: 17 },
});
