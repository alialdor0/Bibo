import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import ThemedSafeArea from '../components/Themed';
import { t, ACHIEVEMENTS } from '../data';
import { PageHeader, GemsBadge } from '../components/BiboCard';

export default function Achievements({ onBack }) {
  const { lang, gems, unlockedAchievements, getAchievementProgress } = useApp();
  const T = (k) => t(k, lang);
  const progress = getAchievementProgress();
  const unlockedCount = unlockedAchievements.length;

  return (
    <ThemedSafeArea style={s.safe}>
      <PageHeader
        title={lang === 'ar' ? 'الإنجازات' : 'Achievements'}
        onBack={onBack}
        backLabel={T('back')}
        right={<GemsBadge gems={gems} />}
      />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.summaryCard}>
          <Text style={s.summaryEmoji}>🏅</Text>
          <Text style={s.summaryVal}>{unlockedCount} / {ACHIEVEMENTS.length}</Text>
          <Text style={s.summaryLbl}>{lang === 'ar' ? 'شارة مفتوحة' : 'badges unlocked'}</Text>
        </View>

        <View style={s.grid}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedAchievements.includes(a.id);
            const current = Math.min(progress[a.type] ?? 0, a.goal);
            const pct = Math.round((current / a.goal) * 100);
            return (
              <View key={a.id} style={[s.card, !unlocked ? s.cardLocked : null]}>
                <Text style={[s.cardIcon, !unlocked ? s.cardIconLocked : null]}>{unlocked ? a.icon : '🔒'}</Text>
                <Text style={[s.cardName, !unlocked ? s.cardNameLocked : null]}>{lang === 'ar' ? a.nameAr : a.name}</Text>
                <Text style={s.cardDesc}>{lang === 'ar' ? a.descAr : a.desc}</Text>
                {!unlocked ? (
                  <>
                    <View style={s.progressBar}>
                      <View style={[s.progressFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={s.progressTxt}>{current}/{a.goal}</Text>
                  </>
                ) : (
                  <Text style={s.unlockedTxt}>{lang === 'ar' ? 'مفتوحة ✓' : 'Unlocked ✓'}</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ThemedSafeArea>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#08080f' },
  content:         { padding: 16, paddingBottom: 40 },
  summaryCard:     { alignItems: 'center', backgroundColor: 'rgba(255,179,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,179,0,0.25)', borderRadius: 16, padding: 18, marginBottom: 18 },
  summaryEmoji:    { fontSize: 36, marginBottom: 6 },
  summaryVal:      { color: '#FFB300', fontSize: 22, fontWeight: '900' },
  summaryLbl:      { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card:            { width: '47%', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,179,0,0.3)', borderRadius: 14, padding: 12, alignItems: 'center' },
  cardLocked:      { borderColor: 'rgba(255,255,255,0.1)', opacity: 0.7 },
  cardIcon:        { fontSize: 30, marginBottom: 6 },
  cardIconLocked:  { opacity: 0.5 },
  cardName:        { color: '#fff', fontSize: 12, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  cardNameLocked:  { color: 'rgba(255,255,255,0.5)' },
  cardDesc:        { color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'center', marginBottom: 8, lineHeight: 14 },
  progressBar:     { width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 4 },
  progressFill:    { height: '100%', backgroundColor: '#FFB300', borderRadius: 2 },
  progressTxt:     { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
  unlockedTxt:     { color: '#2E8B57', fontSize: 11, fontWeight: '800' },
});
