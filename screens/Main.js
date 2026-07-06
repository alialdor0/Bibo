import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, SafeAreaView, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { t, STORE_ITEMS, GIFT_REWARDS, LEADERBOARD } from '../data';
import { BiboMsg, PageHeader, GemsBadge, StationeryBar } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import BottomNav from '../components/BottomNav';
import Library from './Library';
import { hasEpisodes, getEpisode, getTotalEpisodes } from '../data/episodes';
import { buildTemplateVars, fillTemplate } from '../utils/templateEngine';

function HomeTab({ onNav }) {
  const { user, track, lang, gems, stationery, library, companion, getEpisodeState } = useApp();
  const T = (k) => t(k, lang);
  const u = user || { fullName: 'Ali', levelTitle: { en: 'Novice Writer', color: '#8B4513' } };
  const tr = track || { icon: '🕵️', name: 'Spy & Mystery', color: '#C0C0C0' };

  const wordsLearned = new Set((library || []).flatMap(b => (b.words || []).map(w => w.word))).size;
  const episodesDone = (library || []).length;
  const streak = companion?.streak || 1;

  const usesNewEngine = hasEpisodes(tr.id);
  const epState = usesNewEngine ? getEpisodeState(tr.id) : null;
  const currentEpNum = epState?.unlocked || 1;
  const rawCurrentEp = usesNewEngine ? getEpisode(tr.id, currentEpNum) : null;
  const totalEps = usesNewEngine ? getTotalEpisodes(tr.id) : 1;
  const vars = usesNewEngine ? buildTemplateVars(user) : null;
  const epTitle = rawCurrentEp ? fillTemplate(lang === 'ar' ? rawCurrentEp.title_arabic : rawCurrentEp.title, vars) : null;
  const seasonComplete = usesNewEngine && !rawCurrentEp && currentEpNum > totalEps;

  const currentBook = (library || []).find(b => b.trackId === tr.id && b.episodeId === (usesNewEngine ? currentEpNum : 1));
  const progressPct = currentBook ? 100 : 0;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View
            style={s.streakPill}
            accessible={true}
            accessibilityLabel={`${streak} ${lang === 'ar' ? 'يوم متتالي' : 'day streak'}`}
          >
            <Text style={s.streakTxt}>🔥 {streak}</Text>
          </View>
          <GemsBadge gems={gems} />
        </View>
        <Text style={s.logo} accessibilityLabel="Bibo">Bibo</Text>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => onNav('dict')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={lang === 'ar' ? 'القاموس' : 'Dictionary'}
          >
            <Text style={s.iconTxt} importantForAccessibility="no">📔</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => onNav('store')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={lang === 'ar' ? 'المتجر' : 'Store'}
          >
            <Text style={s.iconTxt} importantForAccessibility="no">🛒</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => onNav('settings')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={lang === 'ar' ? 'الإعدادات' : 'Settings'}
          >
            <Text style={s.iconTxt} importantForAccessibility="no">⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.levelBadge}>
          <Text style={[s.levelTxt, { color: u.levelTitle?.color || '#2E8B57' }]}>{u.levelTitle?.en || 'Novice Writer'}</Text>
          <Text style={s.userName}>{u.fullName || 'Ali'}</Text>
        </View>

        <StationeryBar stationery={stationery} />

        <View style={s.chapterCard}>
          <View style={s.chapterTop}>
            <Text style={s.chapterLabel}>{T('currentChapter')}</Text>
            <Text style={s.chapterTrack}>{tr.icon} {tr.name}</Text>
          </View>
          {seasonComplete ? (
            <>
              <Text style={s.chapterTitle}>{lang === 'ar' ? 'خلصت الموسم كامل! 🏆' : 'You finished the whole season! 🏆'}</Text>
              <Text style={s.chapterSub}>{lang === 'ar' ? `${totalEps} حلقة مكتملة` : `${totalEps} episodes completed`}</Text>
            </>
          ) : (
            <>
              <Text style={s.chapterTitle}>
                {usesNewEngine
                  ? `${lang === 'ar' ? 'حلقة' : 'Episode'} ${currentEpNum}${epTitle ? ' — ' + epTitle : ''}`
                  : (currentBook ? (lang === 'ar' ? 'الحلقة الأولى — اكتملت' : 'Episode 1 — Completed') : (lang === 'ar' ? 'الحلقة الأولى' : 'Episode 1'))}
              </Text>
              <Text style={s.chapterSub}>Season 1 · Episode {usesNewEngine ? currentEpNum : 1}{usesNewEngine ? ` / ${totalEps}` : ''}</Text>
            </>
          )}
          <View style={s.progressBg}><View style={[s.progressFill, { width: progressPct + '%' }]} /></View>
          <Text style={s.progressTxt}>{progressPct}% {lang === 'ar' ? 'مكتمل' : 'completed'}</Text>
          <TouchableOpacity style={[s.startBtn, seasonComplete ? { opacity: 0.4 } : null]} onPress={() => onNav('story')} disabled={seasonComplete} accessibilityRole="button">
            <Text style={s.startBtnTxt}>{currentBook ? '🔁 ' + (lang === 'ar' ? 'اقرأ تاني' : 'Read Again') : '▶ ' + T('resumeLesson')}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsRow}>
          {[
            { icon: '📝', val: wordsLearned, label: T('wordsLearned') },
            { icon: '🎬', val: episodesDone, label: T('episodes')      },
            { icon: '🔥', val: streak,       label: lang === 'ar' ? 'يوم متتالي' : 'Day streak' },
          ].map(st => (
            <View
              key={st.label}
              style={s.statCard}
              accessible={true}
              accessibilityLabel={`${st.label}: ${st.val}`}
            >
              <Text style={{ fontSize: 20 }} importantForAccessibility="no">{st.icon}</Text>
              <Text style={s.statVal}>{st.val}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        <BiboMsg text={
          currentBook
            ? (lang === 'ar' ? 'خلصت الحلقة دي! زور مكتبتك أو جرب تحدي جديد 📚' : 'You finished this episode! Check your library or try a new challenge 📚')
            : (lang === 'ar' ? 'ابدأ أول حلقة النهارده — قصتك مستنياك! 🎵' : 'Start your first episode today — your story is waiting! 🎵')
        } />
      </ScrollView>

      <BottomNav active="home" onNav={onNav} T={T} />
    </View>
  );
}

function ChallengeCard({ icon, title, subtitle, badge, badgeColor, onPress }) {
  return (
    <TouchableOpacity
      style={s.challengeCard}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}${badge ? '. ' + badge : ''}`}
    >
      <View style={s.challengeIconWrap} importantForAccessibility="no-hide-descendants">
        <Text style={{ fontSize: 30 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.challengeTitle}>{title}</Text>
        <Text style={s.challengeSub}>{subtitle}</Text>
      </View>
      {badge ? (
        <View style={[s.challengeBadge, { backgroundColor: (badgeColor || '#2E8B57') + '22' }]}>
          <Text style={[s.challengeBadgeTxt, { color: badgeColor || '#2E8B57' }]}>{badge}</Text>
        </View>
      ) : (
        <Text style={s.challengeArrow} importantForAccessibility="no">›</Text>
      )}
    </TouchableOpacity>
  );
}

function ChallengeTab({ onNav }) {
  const { lang, gems, user, track, library, companion, getWordBankWords } = useApp();
  const T = (k) => t(k, lang);

  const urgent = getWordBankWords().filter(w => w.episodesLeft <= 0);

  const myWords = new Set((library || []).flatMap(b => (b.words || []).map(w => w.word))).size;
  const rankData = [...LEADERBOARD.weekly.filter(p => !p.isMe), { words: myWords, isMe: true }]
    .sort((a, b) => b.words - a.words);
  const myRank = { rank: rankData.findIndex(p => p.isMe) + 1 };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.pageTitle}>🏆 {T('challenge')}</Text>
        <GemsBadge gems={gems} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <BiboCharacter
          layout="row"
          size={56}
          style={{ marginBottom: 16 }}
          state="idea"
          message={lang === 'ar' ? 'اختار تحدي وابدأ دلوقتي! 🔥' : 'Pick a challenge and start now! 🔥'}
        />

        <ChallengeCard
          icon="🆘"
          title={lang === 'ar' ? 'إنقاذ الكلمات' : 'Word Rescue'}
          subtitle={lang === 'ar' ? 'كلمات هتنسى — أنقذها قبل ما تفوتك' : 'Words about to fade — rescue them in time'}
          badge={urgent.length > 0 ? String(urgent.length) : null}
          badgeColor="#c0392b"
          onPress={() => onNav('rescue')}
        />

        <ChallengeCard
          icon="🏅"
          title={lang === 'ar' ? 'قائمة المتصدرين' : 'Leaderboard'}
          subtitle={lang === 'ar' ? 'شوف ترتيبك بين المتعلمين' : 'See where you rank among learners'}
          badge={myRank ? '#' + myRank.rank : null}
          badgeColor="#FFB300"
          onPress={() => onNav('leaderboard')}
        />

        <ChallengeCard
          icon="🤝"
          title={lang === 'ar' ? 'تحدي تعاوني' : 'Co-op Challenge'}
          subtitle={lang === 'ar' ? 'اكمل قصة مع صديق وكسبوا سوا' : 'Finish a story with a friend and earn together'}
          onPress={() => onNav('coop')}
        />
      </ScrollView>

      <BottomNav active="challenge" onNav={onNav} T={T} />
    </View>
  );
}

function ProfileTab({ onBack, onNav }) {
  const { user, lang, gems } = useApp();
  const T = (k) => t(k, lang);
  const u = user || { fullName: 'Dr. Ali Al-Husseini', levelTitle: { en: 'Skilled Communicator', color: '#2E8B57', ar: 'متواصل ماهر' }, city: 'Baghdad', country: 'Iraq', job: 'Doctor', age: '32', stats: { streak: 3, wordsLearned: 48, wordsReview: 12, episodesDone: 1, points: 1240 }, badges: [{ icon: '✍️', label: 'Novice Writer' }, { icon: '🔥', label: '3 Days' }, { icon: '⭐', label: 'First Episode' }] };

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={T('profile')} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <View style={s.profileCard}>
          <View style={s.avatar} importantForAccessibility="no-hide-descendants">
            <Text style={{ fontSize: 40 }}>🐦</Text>
          </View>
          <Text style={s.profileName}>{u.fullName}</Text>
          <Text style={s.profileMeta}>{u.city}, {u.country}</Text>
          <Text style={s.profileMeta}>{u.job} · {u.age}</Text>
          <View style={[s.levelPill, { borderColor: u.levelTitle?.color }]}>
            <Text style={[s.levelPillTxt, { color: u.levelTitle?.color }]}>{u.levelTitle?.en}</Text>
          </View>
          <View
            style={s.streakRow}
            accessible={true}
            accessibilityLabel={`${u.stats?.streak} day streak`}
          >
            <Text style={{ fontSize: 18 }} importantForAccessibility="no">🔥</Text>
            <Text style={s.streakRowTxt}>{u.stats?.streak} day streak</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.dictLinkCard}
          onPress={() => onNav && onNav('dict')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={lang === 'ar' ? 'قاموسي الشخصي' : 'My Dictionary'}
        >
          <Text style={{ fontSize: 22 }} importantForAccessibility="no">📔</Text>
          <Text style={s.dictLinkTxt}>{lang === 'ar' ? 'قاموسي الشخصي' : 'My Dictionary'}</Text>
          <Text style={s.settingArrow} importantForAccessibility="no">›</Text>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>Badges</Text>
        <View style={s.badgesRow}>
          {(u.badges || []).map((b, i) => (
            <View
              key={String(i)}
              style={s.badgeItem}
              accessible={true}
              accessibilityLabel={b.label}
            >
              <Text style={{ fontSize: 24 }} importantForAccessibility="no">{b.icon}</Text>
              <Text style={s.badgeLabel}>{b.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Statistics</Text>
        <View style={s.statsGrid}>
          {[
            { icon: '📝', val: u.stats?.wordsLearned, label: 'Words Learned' },
            { icon: '🔁', val: u.stats?.wordsReview,  label: 'For Review'    },
            { icon: '🎬', val: u.stats?.episodesDone, label: 'Episodes Done' },
            { icon: '⭐', val: u.stats?.points,        label: 'Points'        },
          ].map((st, i) => (
            <View
              key={String(i)}
              style={s.statCardLg}
              accessible={true}
              accessibilityLabel={`${st.label}: ${st.val}`}
            >
              <Text style={{ fontSize: 24 }} importantForAccessibility="no">{st.icon}</Text>
              <Text style={s.statValLg}>{st.val}</Text>
              <Text style={s.statLabelLg}>{st.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsTab({ onBack }) {
  const { lang, setLang, logout, voiceOn, setVoiceOn } = useApp();
  const T = (k) => t(k, lang);

  const [sound,     setSound]     = useState(true);
  const [vib,       setVib]       = useState(true);
  const [notif,     setNotif]     = useState(true);
  const [dark,      setDark]      = useState(true);
  const [offline,   setOffline]   = useState(false);
  const [inputMode, setInputMode] = useState('type');
  const [dailyRev,  setDailyRev]  = useState(10);
  const [fontSize,  setFontSize]  = useState('M');

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={T('settings')} onBack={onBack} backLabel={T('back')} />
      <ScrollView contentContainerStyle={s.pageContent}>

        <View style={s.settingSection}>
          <Text style={s.settingSectionTitle}>🌐 {T('language')}</Text>
          <View style={s.settingRow}>
            <Text style={s.settingLabel}>{T('language')}</Text>
            <View style={s.segmented}>
              {[['ar','العربية'],['en','English']].map(([code, label]) => (
                <TouchableOpacity key={code}
                  style={[s.segBtn, lang === code ? s.segBtnActive : null]}
                  onPress={() => setLang(code)} accessibilityRole="button">
                  <Text style={[s.segBtnTxt, lang === code ? s.segBtnTxtActive : null]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={s.settingSection}>
          <Text style={s.settingSectionTitle}>👤 Account</Text>
          {[
            { label: T('editProfile'),  icon: '✏️' },
            { label: T('changeTrack'),  icon: '🎭' },
            { label: T('retakeTest'),   icon: '📊' },
          ].map(item => (
            <TouchableOpacity
              key={item.label}
              style={s.settingRowBtn}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Text style={{ fontSize: 18 }} importantForAccessibility="no">{item.icon}</Text>
              <Text style={s.settingLabel}>{item.label}</Text>
              <Text style={s.settingArrow} importantForAccessibility="no">›</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.settingRowBtn}
            onPress={() => Alert.alert(
              lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out',
              lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?',
              [
                { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
                { text: lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out', style: 'destructive', onPress: () => logout() },
              ]
            )}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={T('signOut')}
          >
            <Text style={{ fontSize: 18 }} importantForAccessibility="no">🚪</Text>
            <Text style={[s.settingLabel, { color: '#c0392b' }]}>{T('signOut')}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.settingSection}>
          <Text style={s.settingSectionTitle}>🔊 {T('sound')}</Text>
          {[
            { label: 'Sound Effects', val: sound,  set: setSound  },
            { label: 'Bibo Voice',    val: voiceOn, set: setVoiceOn },
            { label: 'Vibration',     val: vib,    set: setVib    },
          ].map(item => (
            <View key={item.label} style={s.settingRow}>
              <Text style={s.settingLabel}>{item.label}</Text>
              <Switch value={item.val} onValueChange={item.set} trackColor={{ true: '#2E8B57', false: 'rgba(255,255,255,0.1)' }} thumbColor="#fff" />
            </View>
          ))}
        </View>

        <View style={s.settingSection}>
          <Text style={s.settingSectionTitle}>🎓 {T('inputMode')}</Text>
          <View style={s.segmented}>
            {[['type','Type'],['speak','Speak'],['choose','Choose']].map(([mode, label]) => (
              <TouchableOpacity key={mode}
                style={[s.segBtn, inputMode === mode ? s.segBtnActive : null]}
                onPress={() => setInputMode(mode)} accessibilityRole="button">
                <Text style={[s.segBtnTxt, inputMode === mode ? s.segBtnTxtActive : null]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.settingRow}>
            <Text style={s.settingLabel}>{T('dailyReview')}</Text>
            <View style={s.stepper}>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setDailyRev(v => Math.max(5, v - 5))}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={lang === 'ar' ? 'إنقاص العدد' : 'Decrease'}
              >
                <Text style={s.stepperTxt} importantForAccessibility="no">−</Text>
              </TouchableOpacity>
              <Text style={s.stepperVal}>{dailyRev}</Text>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setDailyRev(v => Math.min(50, v + 5))}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={lang === 'ar' ? 'زيادة العدد' : 'Increase'}
              >
                <Text style={s.stepperTxt} importantForAccessibility="no">+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.settingRow}>
            <Text style={s.settingLabel}>{T('fontSize')}</Text>
            <View style={s.segmented}>
              {['S','M','L'].map(f => (
                <TouchableOpacity key={f} style={[s.segBtn, fontSize === f ? s.segBtnActive : null]}
                  onPress={() => setFontSize(f)} accessibilityRole="button">
                  <Text style={[s.segBtnTxt, fontSize === f ? s.segBtnTxtActive : null]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={s.settingSection}>
          <Text style={s.settingSectionTitle}>🖥️ Display</Text>
          {[
            { label: T('darkMode'),      val: dark,    set: setDark    },
            { label: T('offline'),       val: offline, set: setOffline },
            { label: T('notifications'), val: notif,   set: setNotif   },
          ].map(item => (
            <View key={item.label} style={s.settingRow}>
              <Text style={s.settingLabel}>{item.label}</Text>
              <Switch value={item.val} onValueChange={item.set} trackColor={{ true: '#2E8B57', false: 'rgba(255,255,255,0.1)' }} thumbColor="#fff" />
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

export default function Main({ onNav }) {
  const [tab, setTab] = useState('home');
  const { lang } = useApp();
  const T = (k) => t(k, lang);

  const handleNav = (dest) => {
    const tabs = ['home', 'library', 'challenge', 'profile', 'settings', 'store'];
    if (tabs.includes(dest)) setTab(dest);
    else onNav(dest);
  };

  if (tab === 'profile')   return <ProfileTab   onBack={() => setTab('home')} onNav={handleNav} />;
  if (tab === 'settings')  return <SettingsTab  onBack={() => setTab('home')} />;
  if (tab === 'library')   return <Library      onNav={handleNav} />;
  if (tab === 'challenge') return <ChallengeTab onNav={handleNav} />;

  return <HomeTab onNav={handleNav} />;
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#08080f' },
  root:              { flex: 1, backgroundColor: '#08080f' },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  headerLeft:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo:              { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  headerRight:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakPill:        { backgroundColor: 'rgba(255,179,0,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,179,0,0.3)' },
  streakTxt:         { color: '#FFB300', fontSize: 12, fontWeight: '700' },
  iconBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  iconTxt:           { fontSize: 18 },
  body:              { paddingHorizontal: 16, paddingBottom: 90, paddingTop: 8 },
  levelBadge:        { alignItems: 'center', marginBottom: 10 },
  levelTxt:          { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  userName:          { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 4 },
  chapterCard:       { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 20, padding: 18, marginBottom: 14, marginTop: 10 },
  chapterTop:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  chapterLabel:      { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '600', letterSpacing: 1 },
  chapterTrack:      { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  chapterTitle:      { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  chapterSub:        { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 },
  progressBg:        { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill:      { height: '100%', backgroundColor: '#2E8B57', borderRadius: 3 },
  progressTxt:       { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14 },
  startBtn:          { backgroundColor: '#2E8B57', borderRadius: 12, padding: 14, alignItems: 'center' },
  startBtnTxt:       { color: '#fff', fontSize: 16, fontWeight: '800' },
  statsRow:          { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard:          { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  statVal:           { fontSize: 20, fontWeight: '800', color: '#a5d6a7' },
  statLabel:         { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  pageTitle:         { fontSize: 20, fontWeight: '800', color: '#fff' },
  challengeCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 16, padding: 14, marginBottom: 12 },
  challengeIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  challengeTitle:    { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 3 },
  challengeSub:      { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 16 },
  challengeBadge:    { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, minWidth: 30, alignItems: 'center' },
  challengeBadgeTxt: { fontSize: 13, fontWeight: '800' },
  challengeArrow:    { color: 'rgba(255,255,255,0.25)', fontSize: 22 },
  dictLinkCard:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 16 },
  dictLinkTxt:       { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },
  pageContent:       { padding: 16, paddingBottom: 40 },
  profileCard:       { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  avatar:            { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0a150a', borderWidth: 2, borderColor: 'rgba(46,139,87,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  profileName:       { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  profileMeta:       { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 2 },
  levelPill:         { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginTop: 6, marginBottom: 6 },
  levelPillTxt:      { fontSize: 12, fontWeight: '700' },
  streakRow:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakRowTxt:      { fontSize: 13, color: '#FFB300', fontWeight: '600' },
  sectionTitle:      { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 10, marginTop: 6 },
  badgesRow:         { flexDirection: 'row', gap: 10, marginBottom: 16 },
  badgeItem:         { alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  badgeLabel:        { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  statsGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCardLg:        { width: '47%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statValLg:         { fontSize: 24, fontWeight: '800', color: '#a5d6a7' },
  statLabelLg:       { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  settingSection:    { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  settingSectionTitle:{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)', padding: 12, paddingBottom: 4, letterSpacing: 1 },
  settingRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  settingRowBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  settingLabel:      { fontSize: 14, color: '#fff', flex: 1 },
  settingArrow:      { color: 'rgba(255,255,255,0.25)', fontSize: 20 },
  segmented:         { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, margin: 10, padding: 3, gap: 3 },
  segBtn:            { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  segBtnActive:      { backgroundColor: '#1B3A6B' },
  segBtnTxt:         { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  segBtnTxtActive:   { color: '#fff', fontWeight: '700' },
  stepper:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperBtn:        { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  stepperTxt:        { color: '#fff', fontSize: 18, fontWeight: '700' },
  stepperVal:        { fontSize: 16, fontWeight: '700', color: '#fff', minWidth: 30, textAlign: 'center' },
});
