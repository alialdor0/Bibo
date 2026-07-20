import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import ThemedSafeArea from '../components/Themed';
import { t, COSMETIC_ITEMS } from '../data';
import { PageHeader, GemsBadge } from '../components/BiboCard';
import BiboCharacter, { STATE_META } from '../components/BiboCharacter';
import { playBiboSound } from '../utils/sounds';

const STATE_ORDER = ['welcome', 'celebrate', 'attention', 'encourage', 'thinking', 'idea', 'sleep'];

export default function BiboProfile({ onBack }) {
  const { lang, gems, library, companion, getWordBankWords, equippedCosmetics, user } = useApp();
  const T = (k) => t(k, lang);
  const [previewState, setPreviewState] = useState('welcome');

  const episodesDone   = library.length;
  const wordsTogether  = useMemo(() => getWordBankWords().filter(w => w.status === 'learned').length, [getWordBankWords]);
  const streak         = companion?.streak || 0;

  // مستوى بيبو هو نفس مستوى المستخدم بالضبط — بيبو رفيق تعلّم معك، مو نظام منفصل
  const level     = user?.levelTitle || null;
  const levelName = level ? (lang === 'ar' ? level.ar : level.en) : (lang === 'ar' ? 'بلا مستوى بعد' : 'No level yet');
  const levelColor = level?.color || '#2E8B57';

  const equippedList = ['hat', 'glasses', 'ring']
    .map(slot => equippedCosmetics?.[slot])
    .filter(Boolean)
    .map(id => COSMETIC_ITEMS.find(c => c.id === id))
    .filter(Boolean);

  const previewBibo = (state) => {
    setPreviewState(state);
    playBiboSound(state);
  };

  return (
    <ThemedSafeArea style={s.safe}>
      <PageHeader title={lang === 'ar' ? 'بطاقة بيبو' : "Bibo's Card"} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* بطاقة تعريفية مضغوطة — نفس حجم بيبو الصغير المستخدم بباقي التطبيق، وليست صورة بروفايل كبيرة */}
        <View style={s.idCard}>
          <BiboCharacter state={previewState} size={64} silent />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.biboName}>Bibo</Text>
            <View style={[s.levelPill, { borderColor: levelColor, alignSelf: 'flex-start' }]}>
              <Text style={[s.levelPillTxt, { color: levelColor }]}>{levelName}</Text>
            </View>
          </View>
        </View>

        {/* شريط إحصائيات رفيع، وليس كروتًا كبيرة */}
        <View style={s.statsStrip}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{episodesDone}</Text>
            <Text style={s.statLbl}>{lang === 'ar' ? 'حلقة سوا' : 'Episodes'}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{wordsTogether}</Text>
            <Text style={s.statLbl}>{lang === 'ar' ? 'كلمة سوا' : 'Words'}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>🔥{streak}</Text>
            <Text style={s.statLbl}>{lang === 'ar' ? 'يوم متتالي' : 'Streak'}</Text>
          </View>
        </View>

        <Text style={s.levelNote}>
          {lang === 'ar'
            ? 'بيبو يتعلّم معك خطوة بخطوة — مستواه هو نفس مستواك اللغوي بالضبط. 🌱'
            : "Bibo learns alongside you step by step — his level is exactly your own language level. 🌱"}
        </Text>

        {equippedList.length > 0 ? (
          <View style={s.cosmeticsRow}>
            {equippedList.map(item => (
              <View key={item.id} style={s.cosmeticChip}>
                {item.color ? <View style={[s.cosmeticSwatch, { backgroundColor: item.color }]} /> : <Text style={{ fontSize: 16 }}>{item.emoji}</Text>}
                <Text style={s.cosmeticChipTxt}>{lang === 'ar' ? item.nameAr : item.name}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={s.sectionTitle}>{lang === 'ar' ? 'اسمع صوت بيبو' : "Hear Bibo's voice"}</Text>
        <View style={s.voiceGrid}>
          {STATE_ORDER.map(st => {
            const meta = STATE_META[st];
            const active = previewState === st;
            return (
              <TouchableOpacity
                key={st}
                style={[s.voiceBtn, active ? { borderColor: meta.color, backgroundColor: meta.color + '1a' } : null]}
                onPress={() => previewBibo(st)}
                accessibilityRole="button"
                accessibilityLabel={lang === 'ar' ? meta.labelAr : meta.labelEn}
              >
                <BiboCharacter state={st} size={28} silent showCosmetics={false} />
                <Text style={s.voiceBtnTxt}>{lang === 'ar' ? meta.labelAr : meta.labelEn}</Text>
              </TouchableOpacity>
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
  idCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, marginBottom: 14 },
  biboName:        { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  levelPill:       { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 3 },
  levelPillTxt:    { fontSize: 11, fontWeight: '700' },
  statsStrip:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, paddingVertical: 12, marginBottom: 8 },
  statItem:        { flex: 1, alignItems: 'center' },
  statDivider:     { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  statVal:         { color: '#fff', fontWeight: '800', fontSize: 15 },
  statLbl:         { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 },
  levelNote:       { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginBottom: 16, lineHeight: 16 },
  cosmeticsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  cosmeticChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  cosmeticSwatch:  { width: 14, height: 14, borderRadius: 7 },
  cosmeticChipTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  sectionTitle:    { color: '#fff', fontWeight: '800', fontSize: 13, marginBottom: 10 },
  voiceGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  voiceBtn:        { width: '31%', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 10, gap: 4 },
  voiceBtnTxt:     { color: '#fff', fontSize: 10, fontWeight: '600' },
});
