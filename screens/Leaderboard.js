import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useApp } from '../context/AppContext';
import { t, LEADERBOARD } from '../data';
import { PageHeader, GemsBadge } from '../components/BiboCard';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

function RankRow({ player, maxWords }) {
  const barW = Math.max(6, Math.round((player.words / maxWords) * 100));
  return (
    <View style={[s.row, player.isMe ? s.rowMe : null]}>
      <Text style={[s.rank, player.isMe ? s.rankMe : null]}>{MEDAL[player.rank] || String(player.rank)}</Text>
      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={[s.name, player.isMe ? s.nameMe : null]}>{player.name}</Text>
          <Text style={s.track}>{player.track}</Text>
        </View>
        <Text style={s.city}>{player.city}</Text>
        <View style={s.barBg}>
          <View style={[s.barFill, { width: barW + '%' }, player.isMe ? s.barFillMe : null]} />
        </View>
      </View>
      <View style={s.stats}>
        <Text style={[s.words, player.isMe ? s.wordsMe : null]}>{player.words}</Text>
        <Text style={s.wordsLabel}>words</Text>
        <Text style={s.streak}>🔥{player.streak}</Text>
      </View>
    </View>
  );
}

export default function Leaderboard({ onBack }) {
  const { lang, gems, user, track, library, companion } = useApp();
  const T = (k) => t(k, lang);
  const [tab, setTab] = useState('weekly');

  const myWords  = new Set((library || []).flatMap(b => (b.words || []).map(w => w.word))).size;
  const myStreak = companion?.streak || 1;
  const myName   = user?.fullName || (lang === 'ar' ? 'أنا' : 'Me');
  const myCity   = user?.city || (lang === 'ar' ? 'غير محدد' : 'Unknown');
  const myTrack  = track?.icon || '🕵️';

  const data = useMemo(() => {
    const others = LEADERBOARD[tab].filter(p => !p.isMe);
    const me = { name: myName, city: myCity, words: myWords, streak: myStreak, track: myTrack, isMe: true };
    return [...others, me]
      .sort((a, b) => b.words - a.words)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [tab, myWords, myStreak, myName, myCity, myTrack]);
  const maxWords = data[0].words;
  const myRank  = data.find(p => p.isMe);

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title="Leaderboard" onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />

      {myRank ? (
        <View style={s.myCard}>
          <View style={s.myLeft}>
            <Text style={s.myLabel}>My Rank</Text>
            <Text style={s.myRank}>{MEDAL[myRank.rank] || '#' + myRank.rank}</Text>
          </View>
          <View style={s.myDivider} />
          <View style={s.myMid}>
            <Text style={s.myName}>{myRank.name}</Text>
            <Text style={s.myCity}>{myRank.city} · {myRank.track}</Text>
          </View>
          <View style={s.myRight}>
            <Text style={s.myWords}>{myRank.words}</Text>
            <Text style={s.myWordsLabel}>words</Text>
            <Text style={s.myStreak}>🔥 {myRank.streak}</Text>
          </View>
        </View>
      ) : null}

      <View style={s.tabs}>
        {[['weekly','This Week'],['alltime','All Time']].map(([key, label]) => (
          <TouchableOpacity key={key}
            style={[s.tab, tab === key ? s.tabActive : null]}
            onPress={() => setTab(key)}
            accessibilityRole="button">
            <Text style={[s.tabTxt, tab === key ? s.tabTxtActive : null]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {data.map(player => (
          <RankRow key={String(player.rank)} player={player} maxWords={maxWords} />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#08080f' },
  myCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(46,139,87,0.12)', borderWidth: 1, borderColor: 'rgba(46,139,87,0.35)', borderRadius: 14, marginHorizontal: 16, marginBottom: 12, padding: 12 },
  myLeft:      { alignItems: 'center', width: 52 },
  myLabel:     { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  myRank:      { fontSize: 26, marginTop: 2 },
  myDivider:   { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 10 },
  myMid:       { flex: 1 },
  myName:      { fontSize: 14, fontWeight: '700', color: '#a5d6a7' },
  myCity:      { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 },
  myRight:     { alignItems: 'center', minWidth: 52 },
  myWords:     { fontSize: 20, fontWeight: '800', color: '#a5d6a7' },
  myWordsLabel:{ fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  myStreak:    { fontSize: 12, color: '#FFB300', marginTop: 3 },
  tabs:        { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3 },
  tab:         { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive:   { backgroundColor: '#1B3A6B' },
  tabTxt:      { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  tabTxtActive:{ color: '#fff' },
  list:        { paddingHorizontal: 16 },
  row:         { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, marginBottom: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  rowMe:       { backgroundColor: 'rgba(46,139,87,0.1)', borderColor: 'rgba(46,139,87,0.4)' },
  rank:        { fontSize: 18, width: 36, textAlign: 'center', color: 'rgba(255,255,255,0.5)' },
  rankMe:      { color: '#a5d6a7' },
  info:        { flex: 1, marginHorizontal: 8 },
  nameRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name:        { fontSize: 13, fontWeight: '600', color: '#fff' },
  nameMe:      { color: '#a5d6a7' },
  track:       { fontSize: 14 },
  city:        { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  barBg:       { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 5, overflow: 'hidden' },
  barFill:     { height: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  barFillMe:   { backgroundColor: '#2E8B57' },
  stats:       { alignItems: 'center', minWidth: 52 },
  words:       { fontSize: 16, fontWeight: '800', color: '#fff' },
  wordsMe:     { color: '#a5d6a7' },
  wordsLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  streak:      { fontSize: 11, color: '#FFB300', marginTop: 2 },
});
