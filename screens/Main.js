import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, SafeAreaView, Alert, Animated, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { t, STORE_ITEMS, GIFT_REWARDS, WEEKLY_CHALLENGES, TRACKS, GENDERS, COUNTRIES, CITIES, JOBS, getPrefix, ACHIEVEMENTS } from '../data';
import { BiboMsg, PageHeader, GemsBadge, StationeryBar } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import BottomNav from '../components/BottomNav';
import Library from './Library';
import LevelTest from '../components/LevelTest';
import WheelPicker from '../components/WheelPicker';
import BiboIcon from '../components/BiboIcon';
import { hasEpisodes, getEpisode, getTotalEpisodes } from '../data/episodes';
import { buildTemplateVars, fillTemplate } from '../utils/templateEngine';
import { playSfx } from '../utils/sfx';

const DAILY_TIPS = {
  ar: [
    'نصيحة بيبو: راجع كلماتك كل يوم حتى لا تُنسى 📚',
    'نصيحة بيبو: عشر دقائق يوميًا أفضل من ساعة أسبوعيًا ⏱️',
    'نصيحة بيبو: استمع للكلمة قبل أن تكتبها، هذا يثبّتها بذاكرتك 🔊',
    'نصيحة بيبو: هدفك اليوم قريب — كمّل خطوة واحدة بس! 🎯',
  ],
  en: [
    "Bibo's tip: Review your words daily so they don't fade 📚",
    "Bibo's tip: Ten minutes a day beats an hour once a week ⏱️",
    "Bibo's tip: Listen before you write — it locks the word into memory 🔊",
    "Bibo's tip: Your goal is close — just one more step today! 🎯",
  ],
};

function HomeTab({ onNav }) {
  const { user, track, lang, gems, stationery, library, companion, getEpisodeState, getWordBankWords, canClaimDailyGift, unlockedAchievements, pendingBadge, dismissPendingBadge } = useApp();
  const T = (k) => t(k, lang);
  const u = user || { fullName: 'Ali', levelTitle: { en: 'Novice Writer', color: '#8B4513' } };
  const tr = track || { icon: '🕵️', name: 'Spy & Mystery', color: '#C0C0C0' };

  useEffect(() => { if (pendingBadge) playSfx('badgeUnlock'); }, [pendingBadge]);

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

  // نسبة تقدم حقيقية داخل الحلقة الحالية (مبنية على آخر سطر محفوظ)، بدل رقم ثابت
  const [savedLineIdx, setSavedLineIdx] = useState(0);
  useEffect(() => {
    if (!usesNewEngine || !rawCurrentEp) return;
    let mounted = true;
    AsyncStorage.getItem(`episode_progress_${tr.id}_${currentEpNum}`)
      .then(raw => {
        if (!mounted || !raw) return;
        const data = JSON.parse(raw);
        if (typeof data.lineIdx === 'number') setSavedLineIdx(data.lineIdx);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [tr.id, currentEpNum, usesNewEngine, rawCurrentEp]);

  const totalLines = rawCurrentEp?.lines?.length || 1;
  const progressPct = currentBook ? 100 : Math.round(Math.min(99, (savedLineIdx / totalLines) * 100));

  // حركة انسيابية لامتلاء شريط التقدم عند فتح الشاشة
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progressPct, duration: 900, useNativeDriver: false }).start();
  }, [progressPct, progressAnim]);
  const animatedWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  // إشعارات داخل التطبيق: كلمات تحتاج مراجعة + هدية متاحة
  const reviewWords = (getWordBankWords ? getWordBankWords() : []).filter(w => w.status === 'review' || w.status === 'forgotten');

  // ودجت بيبو التفاعلي: نصيحة يومية متغيرة
  const tips = DAILY_TIPS[lang] || DAILY_TIPS.ar;
  const [tipIdx, setTipIdx] = useState(0);
  const cycleTip = () => { playSfx('pageTurn'); setTipIdx(i => (i + 1) % tips.length); };

  return (
    <>
    <SafeAreaView style={s.root}>
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

        {reviewWords.length > 0 ? (
          <TouchableOpacity
            style={s.notifCard}
            onPress={() => onNav('dict')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              lang === 'ar'
                ? `${reviewWords.length} كلمة تحتاج مراجعة، اضغط للانتقال إلى القاموس`
                : `${reviewWords.length} words need review, tap to open dictionary`
            }
          >
            <Text style={{ fontSize: 20 }} importantForAccessibility="no">📚</Text>
            <Text style={s.notifTxt}>
              {lang === 'ar'
                ? `${reviewWords.length} كلمة تحتاج مراجعة قبل أن تُنسى`
                : `${reviewWords.length} word${reviewWords.length > 1 ? 's' : ''} need review before they fade`}
            </Text>
            <Text style={s.notifArrow} importantForAccessibility="no">›</Text>
          </TouchableOpacity>
        ) : null}

        {canClaimDailyGift() ? (
          <TouchableOpacity
            style={s.notifCardGift}
            onPress={() => onNav('store')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={lang === 'ar' ? 'هدية بانتظارك بالمتجر، اضغط للفتح' : 'A gift is waiting in the store, tap to open'}
          >
            <Text style={{ fontSize: 20 }} importantForAccessibility="no">🎁</Text>
            <Text style={s.notifTxt}>{lang === 'ar' ? 'هدية بانتظارك بالمتجر' : 'A gift is waiting for you in the store'}</Text>
            <Text style={s.notifArrow} importantForAccessibility="no">›</Text>
          </TouchableOpacity>
        ) : null}

        <StationeryBar stationery={stationery} />

        <TouchableOpacity
          style={s.achievementsCard}
          onPress={() => onNav('achievements')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={lang === 'ar' ? `الإنجازات، ${unlockedAchievements.length} من ${ACHIEVEMENTS.length} شارة مفتوحة` : `Achievements, ${unlockedAchievements.length} of ${ACHIEVEMENTS.length} badges unlocked`}
        >
          <Text style={{ fontSize: 20 }} importantForAccessibility="no">🏅</Text>
          <Text style={s.achievementsTxt}>
            {lang === 'ar' ? `الإنجازات — ${unlockedAchievements.length}/${ACHIEVEMENTS.length} شارة` : `Achievements — ${unlockedAchievements.length}/${ACHIEVEMENTS.length} badges`}
          </Text>
          <Text style={s.notifArrow} importantForAccessibility="no">›</Text>
        </TouchableOpacity>

        <View style={s.chapterCard}>
          <View style={s.chapterTop}>
            <Text style={s.chapterLabel}>{T('currentChapter')}</Text>
            <Text style={s.chapterTrack}>{tr.icon} {tr.name}</Text>
          </View>
          {seasonComplete ? (
            <>
              <Text style={s.chapterTitle}>{lang === 'ar' ? 'أكملت الموسم بالكامل! 🏆' : 'You finished the whole season! 🏆'}</Text>
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
          <View style={s.progressBg}><Animated.View style={[s.progressFill, { width: animatedWidth }]} /></View>
          <Text style={s.progressTxt}>{progressPct}% {lang === 'ar' ? 'مكتمل' : 'completed'}</Text>
          <TouchableOpacity style={[s.startBtn, seasonComplete ? { opacity: 0.4 } : null]} onPress={() => onNav('story')} disabled={seasonComplete} accessibilityRole="button">
            <Text style={s.startBtnTxt}>{currentBook ? '🔁 ' + (lang === 'ar' ? 'اقرأ مرة أخرى' : 'Read Again') : '▶ ' + T('resumeLesson')}</Text>
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
            ? (lang === 'ar' ? 'انتهت هذه الحلقة! تفقّد مكتبتك أو جرّب تحديًا جديدًا 📚' : 'You finished this episode! Check your library or try a new challenge 📚')
            : (lang === 'ar' ? 'ابدأ أول حلقة اليوم — قصتك في انتظارك! 🎵' : 'Start your first episode today — your story is waiting! 🎵')
        } />
      </ScrollView>

      <View style={s.floatingBiboWrap} pointerEvents="box-none">
        <BiboCharacter
          state="idea"
          message={tips[tipIdx]}
          size={52}
          layout="column"
          onPress={cycleTip}
        />
      </View>

      <BottomNav active="home" onNav={onNav} T={T} />
    </SafeAreaView>

    <Modal visible={!!pendingBadge} transparent animationType="fade" onRequestClose={dismissPendingBadge}>
      <View style={s.badgeModalBg}>
        <View style={s.badgeModalCard}>
          <Text style={s.badgeModalTitle}>{lang === 'ar' ? 'إنجاز جديد! 🎉' : 'New achievement! 🎉'}</Text>
          <Text style={s.badgeModalIcon}>{pendingBadge?.icon}</Text>
          <Text style={s.badgeModalName}>{pendingBadge ? (lang === 'ar' ? pendingBadge.nameAr : pendingBadge.name) : ''}</Text>
          <Text style={s.badgeModalDesc}>{pendingBadge ? (lang === 'ar' ? pendingBadge.descAr : pendingBadge.desc) : ''}</Text>
          <TouchableOpacity style={s.badgeModalBtn} onPress={dismissPendingBadge} accessible={true} accessibilityRole="button">
            <Text style={s.badgeModalBtnTxt}>{lang === 'ar' ? 'رائع!' : 'Awesome!'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
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

function WeeklyChallengeCard({ ch, progress, claimed, lang, onClaim }) {
  const current = Math.min(progress, ch.target);
  const pct = Math.round((current / ch.target) * 100);
  const complete = progress >= ch.target;
  return (
    <View style={s.weeklyCard}>
      <View style={s.weeklyTop}>
        <Text style={{ fontSize: 24 }}>{ch.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.weeklyLabel}>{lang === 'ar' ? ch.labelAr : ch.label}</Text>
          <Text style={s.weeklyProgTxt}>{current}/{ch.target}</Text>
        </View>
        {claimed ? (
          <View style={s.weeklyDoneBadge}><Text style={s.weeklyDoneBadgeTxt}>✓</Text></View>
        ) : complete ? (
          <TouchableOpacity style={s.weeklyClaimBtn} onPress={onClaim} accessibilityRole="button">
            <Text style={s.weeklyClaimBtnTxt}>💎 {ch.reward}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={s.weeklyRewardTxt}>💎{ch.reward}</Text>
        )}
      </View>
      <View style={s.weeklyBarTrack}>
        <View style={[s.weeklyBarFill, { width: `${pct}%`, backgroundColor: complete ? '#2E8B57' : '#FFB300' }]} />
      </View>
    </View>
  );
}

function ChallengeTab({ onNav }) {
  const { lang, gems, weeklyProgress, claimWeeklyReward, getWordBankWords } = useApp();
  const T = (k) => t(k, lang);

  const urgent = getWordBankWords().filter(w => w.episodesLeft <= 0);

  return (
    <SafeAreaView style={s.root}>
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
          message={lang === 'ar' ? 'اختر تحديًا وابدأ الآن! 🔥' : 'Pick a challenge and start now! 🔥'}
        />

        <Text style={s.weeklyTitle}>{lang === 'ar' ? 'تحديات هذا الأسبوع' : "This week's challenges"}</Text>
        {WEEKLY_CHALLENGES.map(ch => (
          <WeeklyChallengeCard
            key={ch.id}
            ch={ch}
            lang={lang}
            progress={weeklyProgress[ch.metric] || 0}
            claimed={weeklyProgress.claimed.includes(ch.id)}
            onClaim={() => claimWeeklyReward(ch.id, ch.reward)}
          />
        ))}

        <ChallengeCard
          icon="🆘"
          title={lang === 'ar' ? 'إنقاذ الكلمات' : 'Word Rescue'}
          subtitle={lang === 'ar' ? 'كلمات ستُنسى — أنقذها قبل أن تفوتك' : 'Words about to fade — rescue them in time'}
          badge={urgent.length > 0 ? String(urgent.length) : null}
          badgeColor="#c0392b"
          onPress={() => onNav('rescue')}
        />

        <ChallengeCard
          icon="🏅"
          title={lang === 'ar' ? 'المنافسة مع بيبو' : 'Competition with Bibo'}
          subtitle={lang === 'ar' ? 'مبارزات وتحديات ممتعة مع بيبو نفسه' : 'Fun duels and challenges against Bibo himself'}
          onPress={() => onNav('leaderboard')}
        />

        <ChallengeCard
          icon="🤝"
          title={lang === 'ar' ? 'التعاون مع بيبو' : 'Co-op with Bibo'}
          subtitle={lang === 'ar' ? 'اكتب قصة سوا مع بيبو واربحا معًا' : 'Write a story together with Bibo and earn together'}
          onPress={() => onNav('coop')}
        />
      </ScrollView>

      <BottomNav active="challenge" onNav={onNav} T={T} />
    </SafeAreaView>
  );
}

function ProfileTab({ onBack, onNav }) {
  const { user, lang, gems, companion, library, getWordBankWords, ownedCosmetics } = useApp();
  const T = (k) => t(k, lang);

  if (!user) {
    // حماية بسيطة: من المفترض ألا يصل المستخدم لهذه الشاشة إلا بعد تسجيل الدخول، ولكن لو حدث أمر غير متوقع نعرض رسالة بدلًا من بيانات وهمية
    return (
      <SafeAreaView style={s.safe}>
        <PageHeader title={T('profile')} onBack={onBack} backLabel={T('back')} />
        <View style={[s.pageContent, { alignItems: 'center', paddingTop: 60 }]}>
          <BiboCharacter state="thinking" size={90} />
          <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16, textAlign: 'center' }}>
            {lang === 'ar' ? 'لم نتمكن من العثور على بيانات حسابك. يرجى تسجيل الدخول من جديد.' : "We couldn't find your account data. Try signing in again."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // إحصائيات حقيقية 100% مبنية على استخدام فعلي — مفيش أي رقم وهمي هون
  const wordEntries   = getWordBankWords();
  const wordsLearned  = wordEntries.filter(w => w.status === 'learned').length;
  const wordsReview   = wordEntries.filter(w => w.status === 'review').length;
  const episodesDone  = library.length;
  const streak        = companion?.streak || 0;
  const levelColor    = user.levelTitle?.color || '#2E8B57';
  const levelLabel    = lang === 'ar' ? (user.levelTitle?.ar || '') : (user.levelTitle?.en || '');

  // أوسمة تُحسب لحظيًا من التقدّم الفعلي، وليست قائمة ثابتة مخزّنة
  const badges = [];
  if (episodesDone >= 1) badges.push({ icon: '⭐', label: lang === 'ar' ? 'أول حلقة' : 'First Episode' });
  if (streak >= 3)        badges.push({ icon: '🔥', label: lang === 'ar' ? `${streak} أيام متتالية` : `${streak}-day streak` });
  if (wordsLearned >= 1)  badges.push({ icon: '✍️', label: lang === 'ar' ? 'كاتب مبتدئ' : 'Novice Writer' });
  if (wordsLearned >= 20) badges.push({ icon: '🏆', label: lang === 'ar' ? 'خبير الكلمات' : 'Word Master' });
  if (ownedCosmetics.length >= 1) badges.push({ icon: '🎩', label: lang === 'ar' ? 'أنيق بيبو' : 'Bibo Fashionista' });

  const bibbleState = streak >= 3 ? 'celebrate' : 'welcome';
  const bibbleMsg = lang === 'ar'
    ? `مرحبًا ${user.fullName?.split(' ')[0] || ''}! فخور فيك 🎉`
    : `Hi ${user.fullName?.split(' ')[0] || ''}! Proud of you 🎉`;

  return (
    <SafeAreaView style={s.safe}>
      <PageHeader title={T('profile')} onBack={onBack} backLabel={T('back')} right={<GemsBadge gems={gems} />} />
      <ScrollView contentContainerStyle={s.pageContent}>
        <View style={s.profileCard}>
          <BiboCharacter state={bibbleState} message={bibbleMsg} size={90} />
          <Text style={[s.profileName, { marginTop: 12 }]}>{user.fullName || (lang === 'ar' ? 'صديق بيبو' : "Bibo's friend")}</Text>
          {user.age ? (
            <Text style={s.profileMeta}>
              {user.age} {lang === 'ar' ? 'سنة' : 'yrs'}{user.zodiac ? `  ${user.zodiac.emoji} ${lang === 'ar' ? user.zodiac.ar : user.zodiac.en}` : ''}
            </Text>
          ) : null}
          {levelLabel ? (
            <View style={[s.levelPill, { borderColor: levelColor }]}>
              <Text style={[s.levelPillTxt, { color: levelColor }]}>{levelLabel}</Text>
            </View>
          ) : null}
          <View
            style={s.streakRow}
            accessible={true}
            accessibilityLabel={`${streak} ${lang === 'ar' ? 'يوم متتالي' : 'day streak'}`}
          >
            <Text style={{ fontSize: 18 }} importantForAccessibility="no">🔥</Text>
            <Text style={s.streakRowTxt}>{streak} {lang === 'ar' ? 'يوم متتالي' : 'day streak'}</Text>
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

        <TouchableOpacity
          style={s.dictLinkCard}
          onPress={() => onNav && onNav('store')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={lang === 'ar' ? 'إطلالة بيبو' : "Bibo's style"}
        >
          <Text style={{ fontSize: 22 }} importantForAccessibility="no">🎩</Text>
          <Text style={s.dictLinkTxt}>{lang === 'ar' ? 'إطلالة بيبو' : "Bibo's style"}</Text>
          <Text style={s.settingArrow} importantForAccessibility="no">›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.dictLinkCard}
          onPress={() => onNav && onNav('bibo-profile')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={lang === 'ar' ? 'ملف بيبو الشخصي' : "Bibo's profile"}
        >
          <BiboIcon size={22} />
          <Text style={s.dictLinkTxt}>{lang === 'ar' ? 'ملف بيبو الشخصي' : "Bibo's profile"}</Text>
          <Text style={s.settingArrow} importantForAccessibility="no">›</Text>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>{lang === 'ar' ? 'الأوسمة' : 'Badges'}</Text>
        {badges.length > 0 ? (
          <View style={s.badgesRow}>
            {badges.map((b, i) => (
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
        ) : (
          <Text style={s.emptyBadgesTxt}>
            {lang === 'ar' ? 'أكمل أول حلقة لتحصل على أول وسام! 🎯' : 'Finish your first episode to earn your first badge! 🎯'}
          </Text>
        )}

        <Text style={s.sectionTitle}>{lang === 'ar' ? 'الإحصائيات' : 'Statistics'}</Text>
        <View style={s.statsGrid}>
          {[
            { icon: '📝', val: wordsLearned, label: lang === 'ar' ? 'كلمة مُتقنة'     : 'Words Learned' },
            { icon: '🔁', val: wordsReview,  label: lang === 'ar' ? 'للمراجعة'        : 'For Review'    },
            { icon: '🎬', val: episodesDone, label: lang === 'ar' ? 'حلقة مكتملة'     : 'Episodes Done' },
            { icon: '💎', val: gems,         label: lang === 'ar' ? 'جوهرة'           : 'Gems'          },
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
  const { lang, setLang, logout, voiceOn, setVoiceOn, sfxOn, setSfxOn, hapticsOn, setHapticsOn, learningMode, setLearningMode, reviewWordsCount, setReviewWordsCount, track, setTrack, user, setUser } = useApp();
  const T = (k) => t(k, lang);

  const [notif,     setNotif]     = useState(true);
  const [dark,      setDark]      = useState(true);
  const [offline,   setOffline]   = useState(false);
  const [fontSize,  setFontSize]  = useState('M');
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const [showLevelTest,   setShowLevelTest]   = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleChangeTrack = (newTrack) => {
    setShowTrackPicker(false);
    if (newTrack.id === track?.id) return;
    Alert.alert(
      lang === 'ar' ? `التبديل إلى ${newTrack.name}؟` : `Switch to ${newTrack.name}?`,
      lang === 'ar' ? 'تقدّمك بالمسار الحالي محفوظ وبتقدر ترجعله بأي وقت.' : 'Your progress in the current track stays saved, and you can switch back anytime.',
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: lang === 'ar' ? 'تبديل' : 'Switch', onPress: () => setTrack(newTrack) },
      ]
    );
  };

  // ── تعديل الملف الشخصي: نموذج محلي يُهيَّأ من بيانات المستخدم الحالية ──
  const [editForm, setEditForm] = useState(null);
  const openEditProfile = () => {
    setEditForm({
      firstName: user?.firstName || '',
      lastName:  user?.lastName  || '',
      gender:    user?.gender    || 'Male',
      country:   user?.country   || 'Iraq',
      city:      user?.city      || 'Baghdad',
      customCountry: user?.customCountry || '',
      customCity:    user?.customCity    || '',
      job:       user?.job       || 'Doctor',
      customJob: user?.customJob || '',
    });
    setShowEditProfile(true);
  };
  const saveEditProfile = () => {
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      Alert.alert(lang === 'ar' ? 'الاسم مطلوب' : 'Name required', lang === 'ar' ? 'من فضلك اكتب اسمك الأول والأخير.' : 'Please enter your first and last name.');
      return;
    }
    const prefix = getPrefix(editForm.customJob.trim() ? 'Other' : editForm.job);
    const fullName = (prefix ? prefix + ' ' : '') + editForm.firstName.trim() + ' ' + editForm.lastName.trim();
    setUser(prev => ({ ...prev, ...editForm, fullName }));
    setShowEditProfile(false);
    playSfx('correct');
  };
  const editCities = editForm ? (CITIES[editForm.country] || [['Other','أخرى']]) : [];
  const genders = GENDERS[lang] || GENDERS.ar;
  const jobItems = JOBS.map(j => [j.en, j.ar]);

  return (
    <>
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

          <TouchableOpacity
            style={s.settingRowBtn}
            onPress={openEditProfile}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={T('editProfile')}
          >
            <Text style={{ fontSize: 18 }} importantForAccessibility="no">✏️</Text>
            <Text style={s.settingLabel}>{T('editProfile')}</Text>
            <Text style={s.settingArrow} importantForAccessibility="no">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.settingRowBtn}
            onPress={() => setShowTrackPicker(v => !v)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={T('changeTrack')}
          >
            <Text style={{ fontSize: 18 }} importantForAccessibility="no">🎭</Text>
            <Text style={s.settingLabel}>{T('changeTrack')}{track ? ` (${track.icon} ${lang === 'ar' ? track.nameAr : track.name})` : ''}</Text>
            <Text style={s.settingArrow} importantForAccessibility="no">{showTrackPicker ? '⌄' : '›'}</Text>
          </TouchableOpacity>

          {showTrackPicker ? (
            <View style={s.trackPickerWrap}>
              {TRACKS.map(tr => (
                <TouchableOpacity
                  key={tr.id}
                  style={[s.trackPickerRow, tr.id === track?.id ? { borderColor: tr.color, backgroundColor: tr.color + '15' } : null]}
                  onPress={() => handleChangeTrack(tr)}
                >
                  <Text style={{ fontSize: 18 }}>{tr.icon}</Text>
                  <Text style={[s.trackPickerTxt, tr.id === track?.id ? { color: tr.color, fontWeight: '700' } : null]}>{lang === 'ar' ? tr.nameAr : tr.name}</Text>
                  {tr.id === track?.id ? <Text style={{ color: tr.color, fontSize: 13 }}>✓</Text> : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <TouchableOpacity
            style={s.settingRowBtn}
            onPress={() => setShowLevelTest(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={T('retakeTest')}
          >
            <Text style={{ fontSize: 18 }} importantForAccessibility="no">📊</Text>
            <Text style={s.settingLabel}>{T('retakeTest')}</Text>
            <Text style={s.settingArrow} importantForAccessibility="no">›</Text>
          </TouchableOpacity>

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
            { label: 'Sound Effects', val: sfxOn,  set: setSfxOn  },
            { label: 'Bibo Voice',    val: voiceOn, set: setVoiceOn },
            { label: 'Vibration',     val: hapticsOn, set: setHapticsOn },
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
                style={[s.segBtn, learningMode === mode ? s.segBtnActive : null]}
                onPress={() => setLearningMode(mode)} accessibilityRole="button">
                <Text style={[s.segBtnTxt, learningMode === mode ? s.segBtnTxtActive : null]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.settingRow}>
            <Text style={s.settingLabel}>{T('dailyReview')}</Text>
            <View style={s.stepper}>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setReviewWordsCount(v => Math.max(5, v - 5))}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={lang === 'ar' ? 'إنقاص العدد' : 'Decrease'}
              >
                <Text style={s.stepperTxt} importantForAccessibility="no">−</Text>
              </TouchableOpacity>
              <Text style={s.stepperVal}>{reviewWordsCount}</Text>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setReviewWordsCount(v => Math.min(50, v + 5))}
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

    <Modal visible={showLevelTest} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowLevelTest(false)}>
      <SafeAreaView style={s.modalSafe}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>{T('retakeTest')}</Text>
          <TouchableOpacity onPress={() => setShowLevelTest(false)} accessible={true} accessibilityRole="button" accessibilityLabel={T('back')}>
            <Text style={s.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.modalContent}>
          <Text style={s.modalDesc}>{T('levelNote')}</Text>
          <LevelTest
            lang={lang}
            ctaLabel={lang === 'ar' ? 'حفظ المستوى الجديد' : 'Save new level'}
            onComplete={(score, lvlObj) => {
              setUser(prev => (prev ? { ...prev, levelScore: score, levelTitle: lvlObj } : prev));
              setShowLevelTest(false);
              playSfx('win');
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>

    <Modal visible={showEditProfile && !!editForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditProfile(false)}>
      <SafeAreaView style={s.modalSafe}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>{T('editProfile')}</Text>
          <TouchableOpacity onPress={() => setShowEditProfile(false)} accessible={true} accessibilityRole="button" accessibilityLabel={T('back')}>
            <Text style={s.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        {editForm ? (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={s.modalContent}>
              <Text style={s.fieldLbl}>{T('firstName')}</Text>
              <TextInput style={s.inp} value={editForm.firstName} onChangeText={v => setEditForm(f => ({ ...f, firstName: v }))}
                placeholder={T('firstName')} placeholderTextColor="rgba(255,255,255,0.25)" />

              <Text style={s.fieldLbl}>{T('lastName')}</Text>
              <TextInput style={s.inp} value={editForm.lastName} onChangeText={v => setEditForm(f => ({ ...f, lastName: v }))}
                placeholder={T('lastName')} placeholderTextColor="rgba(255,255,255,0.25)" />

              <Text style={s.fieldLbl}>{T('qGender')}</Text>
              <View style={s.genderRow}>
                {genders.map(([en, ar]) => (
                  <TouchableOpacity key={en} style={[s.genderBtn, editForm.gender === en ? s.genderBtnActive : null]}
                    onPress={() => setEditForm(f => ({ ...f, gender: en }))} accessibilityRole="button">
                    <Text style={[s.genderBtnTxt, editForm.gender === en ? s.genderBtnTxtActive : null]}>{lang === 'ar' ? ar : en}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLbl}>{T('qCountry')}</Text>
              <WheelPicker
                items={COUNTRIES}
                value={editForm.country}
                onChange={(en) => setEditForm(f => ({ ...f, country: en, city: (CITIES[en] || [['Other','أخرى']])[0][0] }))}
                hint={lang === 'ar' ? 'الدولة' : 'Country'}
              />

              <Text style={s.fieldLbl}>{T('qCity')}</Text>
              <WheelPicker
                items={editCities}
                value={editForm.city}
                onChange={(en) => setEditForm(f => ({ ...f, city: en }))}
                hint={lang === 'ar' ? 'المدينة' : 'City'}
              />

              <Text style={s.fieldLbl}>{T('qJob')}</Text>
              <WheelPicker
                items={jobItems}
                value={editForm.job}
                onChange={(en) => setEditForm(f => ({ ...f, job: en }))}
                hint={lang === 'ar' ? 'المهنة' : 'Job'}
              />

              <TouchableOpacity style={s.saveBtn} onPress={saveEditProfile} accessible={true} accessibilityRole="button">
                <Text style={s.saveBtnTxt}>{lang === 'ar' ? 'حفظ التعديلات' : 'Save changes'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : null}
      </SafeAreaView>
    </Modal>
    </>
  );
}

export default function Main({ onNav }) {
  const [tab, setTab] = useState('home');
  const { lang } = useApp();
  const T = (k) => t(k, lang);

  const handleNav = (dest) => {
    const tabs = ['home', 'library', 'challenge', 'profile', 'settings'];
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
  notifCard:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(74,144,217,0.1)', borderWidth: 1, borderColor: 'rgba(74,144,217,0.3)', borderRadius: 14, padding: 12, marginBottom: 10 },
  notifCardGift:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,179,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,179,0,0.3)', borderRadius: 14, padding: 12, marginBottom: 14 },
  achievementsCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(155,89,182,0.1)', borderWidth: 1, borderColor: 'rgba(155,89,182,0.3)', borderRadius: 14, padding: 12, marginBottom: 14 },
  achievementsTxt:   { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
  badgeModalBg:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  badgeModalCard:    { width: '100%', maxWidth: 320, backgroundColor: '#12121c', borderWidth: 1.5, borderColor: '#FFB300', borderRadius: 22, padding: 26, alignItems: 'center' },
  badgeModalTitle:   { color: '#FFB300', fontSize: 14, fontWeight: '800', marginBottom: 14 },
  badgeModalIcon:    { fontSize: 56, marginBottom: 10 },
  badgeModalName:    { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 6 },
  badgeModalDesc:    { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  badgeModalBtn:     { backgroundColor: '#FFB300', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32 },
  badgeModalBtnTxt:  { color: '#08080f', fontSize: 14, fontWeight: '800' },
  notifTxt:          { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
  notifArrow:        { color: 'rgba(255,255,255,0.4)', fontSize: 18 },
  floatingBiboWrap:  { position: 'absolute', bottom: 78, right: 16 },
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
  weeklyTitle:       { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 10 },
  weeklyCard:        { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 14, padding: 12, marginBottom: 10 },
  weeklyTop:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  weeklyLabel:       { color: '#fff', fontSize: 13, fontWeight: '700' },
  weeklyProgTxt:     { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  weeklyRewardTxt:   { color: '#FFB300', fontSize: 12, fontWeight: '700' },
  weeklyClaimBtn:    { backgroundColor: '#FFB300', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  weeklyClaimBtnTxt: { color: '#08080f', fontSize: 12, fontWeight: '800' },
  weeklyDoneBadge:   { backgroundColor: 'rgba(46,139,87,0.25)', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  weeklyDoneBadgeTxt:{ color: '#a5d6a7', fontSize: 14, fontWeight: '800' },
  weeklyBarTrack:    { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  weeklyBarFill:     { height: '100%', borderRadius: 3 },
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
  emptyBadgesTxt:    { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 18 },
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
  trackPickerWrap:   { paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  trackPickerRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 },
  trackPickerTxt:    { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  segmented:         { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, margin: 10, padding: 3, gap: 3 },
  segBtn:            { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  segBtnActive:      { backgroundColor: '#1B3A6B' },
  segBtnTxt:         { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  segBtnTxtActive:   { color: '#fff', fontWeight: '700' },
  stepper:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperBtn:        { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  stepperTxt:        { color: '#fff', fontSize: 18, fontWeight: '700' },
  stepperVal:        { fontSize: 16, fontWeight: '700', color: '#fff', minWidth: 30, textAlign: 'center' },

  modalSafe:         { flex: 1, backgroundColor: '#08080f' },
  modalHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  modalTitle:        { fontSize: 16, fontWeight: '800', color: '#fff' },
  modalClose:        { fontSize: 18, color: 'rgba(255,255,255,0.5)', padding: 4 },
  modalContent:       { padding: 18, paddingBottom: 40 },
  modalDesc:         { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 18 },
  fieldLbl:          { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, marginTop: 14 },
  inp:               { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14 },
  genderRow:         { flexDirection: 'row', gap: 8 },
  genderBtn:         { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, alignItems: 'center' },
  genderBtnActive:   { borderColor: '#2E8B57', backgroundColor: 'rgba(46,139,87,0.15)' },
  genderBtnTxt:      { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  genderBtnTxtActive:{ color: '#fff' },
  saveBtn:           { backgroundColor: '#2E8B57', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 26 },
  saveBtnTxt:        { color: '#fff', fontSize: 15, fontWeight: '800' },
});
