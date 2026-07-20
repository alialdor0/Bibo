import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, Animated, Easing } from 'react-native';
import { useApp } from '../context/AppContext';
import ThemedSafeArea from '../components/Themed';
import { t, STORE_ITEMS, GIFT_REWARDS, WEEKLY_GIFT_REWARDS, COSMETIC_ITEMS, COSMETIC_SLOTS, BOOK_COVERS, COVER_STICKERS } from '../data';
import { PageHeader, GemsBadge, StationeryBar } from '../components/BiboCard';
import BiboCharacter from '../components/BiboCharacter';
import { playSfx } from '../utils/sfx';

const SECTIONS = [
  { key: 'pen',       label: 'Pens',       labelAr: 'الأقلام',     icon: '🖊️' },
  { key: 'eraser',    label: 'Erasers',    labelAr: 'الممحاة',     icon: '🧹' },
  { key: 'paper',     label: 'Paper',      labelAr: 'الأوراق',     icon: '📄' },
  { key: 'cosmetics', label: 'Bibo style', labelAr: 'إطلالة بيبو', icon: '🎩' },
  { key: 'covers',    label: 'Covers',     labelAr: 'الأغلفة والملصقات', icon: '📔' },
];

const PARTICLE_EMOJIS = ['💎', '✨', '🎉', '⭐', '💎', '✨'];
const STREAK_FREEZE_PRICE = 150; // تكلفة عالية عمدًا — ميزة قوية بتحمي السلسلة المتواصلة تلقائيًا

/**
 * صندوق الهدية المتحرك — بديل الـ Alert الصامت القديم.
 * 3 مراحل: idle (بينبض بهدوء) → shake (اهتزاز عند الفتح) → burst (ينفجر ويطلع الجائزة).
 */
export function GiftBox({ visible, lang, rewards, title, onOpened, onClose }) {
  const idleAnim  = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const boxScale  = useRef(new Animated.Value(1)).current;
  const boxOpacity= useRef(new Animated.Value(1)).current;
  const rewardScale = useRef(new Animated.Value(0)).current;
  const particles = useRef(PARTICLE_EMOJIS.map(() => new Animated.Value(0))).current;

  const [phase, setPhase] = useState('idle'); // idle | shaking | burst
  const [reward, setReward] = useState(null);

  React.useEffect(() => {
    if (!visible) return;
    setPhase('idle');
    setReward(null);
    boxScale.setValue(1);
    boxOpacity.setValue(1);
    rewardScale.setValue(0);
    particles.forEach(p => p.setValue(0));
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idleAnim, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(idleAnim, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  const handleOpen = () => {
    if (phase !== 'idle') return;
    setPhase('shaking');
    playSfx('pageTurn'); // نقرة إحساس بالتوتر قبل الفتح
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start(() => {
      setPhase('burst');
      const picked = rewards[Math.floor(Math.random() * rewards.length)];
      setReward(picked);
      playSfx('giftOpen');

      Animated.parallel([
        Animated.timing(boxScale,   { toValue: 1.4, duration: 220, useNativeDriver: true }),
        Animated.timing(boxOpacity, { toValue: 0,   duration: 220, useNativeDriver: true }),
        Animated.spring(rewardScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        ...particles.map(p =>
          Animated.timing(p, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true })
        ),
      ]).start();

      onOpened(picked);
    });
  };

  const shakeTranslate = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  const idleTranslate  = idleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.modalBg}>
        <View style={s.modalCard}>
          <Text style={s.modalTitle}>{title || (lang === 'ar' ? 'هدية بانتظارك' : 'A gift awaits')}</Text>
          <Text style={s.modalDesc}>
            {phase === 'burst'
              ? (lang === 'ar' ? 'مبروك! 🎊' : 'Congrats! 🎊')
              : (lang === 'ar' ? 'دوس على الصندوق لتفتحه' : 'Tap the box to open it')}
          </Text>

          <View style={s.giftStage}>
            {particles.map((p, i) => {
              const angle = (i / particles.length) * Math.PI * 2;
              const tx = p.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * 70] });
              const ty = p.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * 70] });
              const op = p.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
              return (
                <Animated.Text
                  key={i}
                  style={[s.particle, { opacity: op, transform: [{ translateX: tx }, { translateY: ty }] }]}
                >
                  {PARTICLE_EMOJIS[i]}
                </Animated.Text>
              );
            })}

            {phase !== 'burst' ? (
              <TouchableOpacity activeOpacity={0.8} onPress={handleOpen}>
                <Animated.Text
                  style={[
                    s.giftBoxEmoji,
                    { transform: [{ translateX: shakeTranslate }, { translateY: phase === 'idle' ? idleTranslate : 0 }, { scale: boxScale }], opacity: boxOpacity },
                  ]}
                >
                  🎁
                </Animated.Text>
              </TouchableOpacity>
            ) : (
              <Animated.View style={[s.rewardCard, { transform: [{ scale: rewardScale }] }]}>
                <Text style={s.rewardIcon}>{reward?.icon}</Text>
                <Text style={s.rewardLabel}>{lang === 'ar' ? reward?.labelAr : reward?.label}</Text>
              </Animated.View>
            )}
          </View>

          {phase === 'burst' ? (
            <TouchableOpacity style={s.watchBtn} onPress={onClose}>
              <Text style={s.watchBtnTxt}>{lang === 'ar' ? 'رائع!' : 'Awesome!'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.modalClose} onPress={onClose}>
              <Text style={s.modalCloseTxt}>{lang === 'ar' ? 'إغلاق' : 'Close'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function Store({ onBack }) {
  const {
    lang, gems, stationery, buyItem, claimGift, claimWeeklyGift, canClaimDailyGift, canClaimWeeklyGift,
    ownedCosmetics, equippedCosmetics, buyCosmetic, equipCosmetic,
    ownedCovers, buyCover, ownedStickers, buySticker,
    streakFreezes, buyStreakFreeze,
  } = useApp();
  const T = (k) => t(k, lang);

  const [tab,        setTab]        = useState('pen');
  const [giftModal,  setGiftModal]  = useState(false);
  const [weeklyGiftModal, setWeeklyGiftModal] = useState(false);
  const dailyReady  = canClaimDailyGift();
  const weeklyReady = canClaimWeeklyGift();

  const stationeryItems = STORE_ITEMS.filter(i => i.type === tab);

  const handleBuy = (item) => {
    if (gems < item.price) {
      playSfx('wrong');
      Alert.alert(
        lang === 'ar' ? 'الجواهر غير كافية' : 'Not enough gems',
        lang === 'ar' ? `تحتاج إلى ${item.price} جوهرة. أكمل حلقات أو افتح صندوق الهدية لتجمع المزيد!` : `You need ${item.price} gems. Finish episodes or open the gift box to earn more!`
      );
      return;
    }
    Alert.alert(
      lang === 'ar' ? `شراء ${item.nameAr}؟` : 'Buy ' + item.name + '?',
      lang === 'ar' ? `سيتم خصم ${item.price} جوهرة.` : item.price + ' gems will be deducted.',
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: lang === 'ar' ? 'شراء' : 'Buy', onPress: () => {
          const success = buyItem(item);
          if (success) { playSfx('purchase'); Alert.alert(lang === 'ar' ? 'تم الشراء!' : 'Purchased!', (lang === 'ar' ? item.nameAr : item.name) + (lang === 'ar' ? ' أصبح ضمن قرطاسيتك.' : ' is now in your stationery.')); }
          else playSfx('wrong');
        }},
      ]
    );
  };

  const handleBuyCosmetic = (item) => {
    if (gems < item.price) {
      playSfx('wrong');
      Alert.alert(
        lang === 'ar' ? 'الجواهر غير كافية' : 'Not enough gems',
        lang === 'ar' ? `تحتاج إلى ${item.price} جوهرة لشراء هذا العنصر.` : `You need ${item.price} gems to buy this item.`
      );
      return;
    }
    const name = lang === 'ar' ? item.nameAr : item.name;
    Alert.alert(
      lang === 'ar' ? `شراء ${name}؟` : `Buy ${name}?`,
      lang === 'ar' ? `سيتم خصم ${item.price} جوهرة، وستمتلك العنصر للأبد.` : `${item.price} gems will be deducted. This item is yours forever.`,
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: lang === 'ar' ? 'شراء' : 'Buy', onPress: () => {
          const success = buyCosmetic(item);
          if (success) { playSfx('purchase'); equipCosmetic(item.slot, item.id); }
          else playSfx('wrong');
        }},
      ]
    );
  };

  const handleCosmeticTap = (item) => {
    const owned = ownedCosmetics.includes(item.id);
    if (owned) { playSfx('correct'); equipCosmetic(item.slot, item.id); }
    else handleBuyCosmetic(item);
  };

  const handleCoverTap = (cover) => {
    if (ownedCovers.includes(cover.id)) return; // مملوك أصلًا — اختياره كغلاف فعلي يتم من صفحة الكتاب بالمكتبة
    if (gems < cover.price) {
      playSfx('wrong');
      Alert.alert(
        lang === 'ar' ? 'الجواهر غير كافية' : 'Not enough gems',
        lang === 'ar' ? `تحتاج إلى ${cover.price} جوهرة لشراء هذا الغلاف.` : `You need ${cover.price} gems to buy this cover.`
      );
      return;
    }
    const name = lang === 'ar' ? cover.nameAr : cover.name;
    Alert.alert(
      lang === 'ar' ? `شراء غلاف ${name}؟` : `Buy ${name} cover?`,
      lang === 'ar' ? `سيتم خصم ${cover.price} جوهرة، وسيصبح الغلاف ملكك للأبد.` : `${cover.price} gems will be deducted. This cover is yours forever.`,
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: lang === 'ar' ? 'شراء' : 'Buy', onPress: () => {
          const success = buyCover(cover.id, cover.price);
          playSfx(success ? 'purchase' : 'wrong');
        }},
      ]
    );
  };

  const handleStickerBuyTap = (sticker) => {
    if (ownedStickers.includes(sticker.id)) return;
    if (gems < sticker.price) {
      playSfx('wrong');
      Alert.alert(
        lang === 'ar' ? 'الجواهر غير كافية' : 'Not enough gems',
        lang === 'ar' ? `تحتاج إلى ${sticker.price} جوهرة لشراء هذا الملصق.` : `You need ${sticker.price} gems to buy this sticker.`
      );
      return;
    }
    const name = lang === 'ar' ? sticker.nameAr : sticker.name;
    Alert.alert(
      lang === 'ar' ? `شراء ملصق ${name}؟` : `Buy ${name} sticker?`,
      lang === 'ar' ? `سيتم خصم ${sticker.price} جوهرة، وسيصبح الملصق ملكك للأبد.` : `${sticker.price} gems will be deducted. This sticker is yours forever.`,
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: lang === 'ar' ? 'شراء' : 'Buy', onPress: () => {
          const success = buySticker(sticker.id, sticker.price);
          playSfx(success ? 'purchase' : 'wrong');
        }},
      ]
    );
  };

  const handleGiftReward = (reward) => {
    claimGift(reward);
  };

  const handleBuyStreakFreeze = () => {
    if (gems < STREAK_FREEZE_PRICE) {
      playSfx('wrong');
      Alert.alert(
        lang === 'ar' ? 'الجواهر غير كافية' : 'Not enough gems',
        lang === 'ar' ? `تحتاج إلى ${STREAK_FREEZE_PRICE} جوهرة لشراء تجميد الحماسة.` : `You need ${STREAK_FREEZE_PRICE} gems to buy a Streak Freeze.`
      );
      return;
    }
    Alert.alert(
      lang === 'ar' ? 'شراء تجميد الحماسة؟' : 'Buy a Streak Freeze?',
      lang === 'ar' ? `سيتم خصم ${STREAK_FREEZE_PRICE} جوهرة. هيحمي سلسلتك تلقائيًا أول مرة تفوّت فيها يوم.` : `${STREAK_FREEZE_PRICE} gems will be deducted. It auto-protects your streak the next time you miss a day.`,
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: lang === 'ar' ? 'شراء' : 'Buy', onPress: () => {
          const success = buyStreakFreeze(STREAK_FREEZE_PRICE);
          playSfx(success ? 'purchase' : 'wrong');
        }},
      ]
    );
  };

  const handleWeeklyGiftReward = (reward) => {
    claimWeeklyGift(reward);
  };

  const isOwned = (item) => {
    if (item.type === 'pen') return stationery.pen.id === item.id;
    return false;
  };

  return (
    <ThemedSafeArea style={s.safe}>
      <PageHeader
        title={T('store')}
        onBack={onBack}
        backLabel={T('back')}
        right={<GemsBadge gems={gems} />}
      />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* شريط القرطاسية الحالية */}
        <View style={s.currentCard}>
          <Text style={s.currentTitle}>{lang === 'ar' ? 'أدواتي' : 'My Stationery'}</Text>
          <StationeryBar stationery={stationery} />
          <View style={s.currentDetails}>
            <View style={s.detailItem}>
              <Text style={s.detailIcon}>🖊️</Text>
              <Text style={s.detailTxt}>{stationery.pen.inkLeft}% {lang === 'ar' ? 'حبر' : 'ink'}</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailIcon}>🧹</Text>
              <Text style={s.detailTxt}>{stationery.eraser.uses} {lang === 'ar' ? 'استخدام متبقٍ' : 'uses left'}</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailIcon}>📄</Text>
              <Text style={s.detailTxt}>{stationery.pages.left} {lang === 'ar' ? 'صفحة متبقية' : 'pages left'}</Text>
            </View>
          </View>
        </View>

        {/* هدية يومية مجانية — مرة واحدة كل يوم */}
        <TouchableOpacity
          style={[s.giftCard, !dailyReady ? s.giftCardDisabled : null]}
          onPress={() => { if (dailyReady) setGiftModal(true); }}
          disabled={!dailyReady}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={dailyReady ? T('openGift') : (lang === 'ar' ? 'الهدية اليومية اتفتحت، ارجع بكرة' : 'Daily gift already opened, come back tomorrow')}
        >
          <View style={s.giftLeft}>
            <Text style={s.giftIcon}>🎁</Text>
            <View>
              <Text style={s.giftTitle}>{dailyReady ? T('openGift') : (lang === 'ar' ? 'هديتك اليومية اتفتحت ✓' : "Today's gift opened ✓")}</Text>
              <Text style={s.giftDesc}>{dailyReady ? T('giftDesc') : (lang === 'ar' ? 'ارجع بكرة لهدية جديدة' : 'Come back tomorrow for a new one')}</Text>
            </View>
          </View>
          <Text style={s.giftArrow}>{dailyReady ? '→' : '✓'}</Text>
        </TouchableOpacity>

        {/* هدية أسبوعية أكبر — مرة واحدة كل أسبوع */}
        <TouchableOpacity
          style={[s.giftCard, s.weeklyGiftCard, !weeklyReady ? s.giftCardDisabled : null]}
          onPress={() => { if (weeklyReady) setWeeklyGiftModal(true); }}
          disabled={!weeklyReady}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={weeklyReady ? (lang === 'ar' ? 'افتح هديتك الأسبوعية الكبيرة' : 'Open your big weekly gift') : (lang === 'ar' ? 'الهدية الأسبوعية اتفتحت، ارجع الأسبوع الجاي' : 'Weekly gift already opened, come back next week')}
        >
          <View style={s.giftLeft}>
            <Text style={s.giftIcon}>🎊</Text>
            <View>
              <Text style={s.giftTitle}>{weeklyReady ? (lang === 'ar' ? 'هدية الأسبوع الكبيرة' : 'Big weekly gift') : (lang === 'ar' ? 'هدية الأسبوع اتفتحت ✓' : 'Weekly gift opened ✓')}</Text>
              <Text style={s.giftDesc}>{weeklyReady ? (lang === 'ar' ? 'مكافأة أكبر تفتحها مرة كل أسبوع' : 'A bigger reward, once a week') : (lang === 'ar' ? 'ارجع الأسبوع الجاي' : 'Come back next week')}</Text>
            </View>
          </View>
          <Text style={s.giftArrow}>{weeklyReady ? '→' : '✓'}</Text>
        </TouchableOpacity>

        {/* تجميد الحماسة — يحمي السلسلة المتواصلة تلقائيًا لو غاب المستخدم يوم، بتكلفة عالية */}
        <TouchableOpacity
          style={[s.giftCard, s.freezeCard]}
          onPress={handleBuyStreakFreeze}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={(lang === 'ar' ? 'تجميد الحماسة، السعر' : 'Streak Freeze, price') + ` ${STREAK_FREEZE_PRICE} ${lang === 'ar' ? 'جوهرة' : 'gems'}. ` + (lang === 'ar' ? `تملك ${streakFreezes} حاليًا` : `You own ${streakFreezes}`)}
        >
          <View style={s.giftLeft}>
            <Text style={s.giftIcon}>🧊</Text>
            <View>
              <Text style={s.giftTitle}>{lang === 'ar' ? 'تجميد الحماسة' : 'Streak Freeze'}</Text>
              <Text style={s.giftDesc}>
                {lang === 'ar'
                  ? `يحافظ على سلسلتك تلقائيًا لو فاتك يوم — تملك ${streakFreezes}`
                  : `Auto-protects your streak if you miss a day — you own ${streakFreezes}`}
              </Text>
            </View>
          </View>
          <View style={s.cosmeticPriceRow}>
            <Text style={s.buyBtnGem}>💎</Text>
            <Text style={s.cosmeticPriceTxt}>{STREAK_FREEZE_PRICE}</Text>
          </View>
        </TouchableOpacity>

        {/* تبويبات المتجر */}
        <View style={s.tabs}>
          {SECTIONS.map(sec => (
            <TouchableOpacity
              key={sec.key}
              style={[s.tab, tab === sec.key ? s.tabActive : null]}
              onPress={() => setTab(sec.key)}
              accessibilityRole="button">
              <Text style={s.tabIcon}>{sec.icon}</Text>
              <Text style={[s.tabTxt, tab === sec.key ? s.tabTxtActive : null]}>
                {lang === 'ar' ? sec.labelAr : sec.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* قسم إطلالة بيبو الدائمة */}
        {tab === 'cosmetics' ? (
          <>
            <View style={s.biboPreviewWrap}>
              <BiboCharacter state="welcome" size={100} />
              <Text style={s.biboPreviewHint}>
                {lang === 'ar' ? 'دوس على أي عنصر تمتلكه لتلبسه أو تخلعه' : 'Tap an owned item to equip or unequip it'}
              </Text>
            </View>

            {COSMETIC_SLOTS.map(slot => {
              const slotItems = COSMETIC_ITEMS.filter(c => c.slot === slot.key);
              return (
                <View key={slot.key} style={s.slotGroup}>
                  <Text style={s.slotTitle}>{lang === 'ar' ? slot.labelAr : slot.label}</Text>
                  <View style={s.cosmeticsGrid}>
                    {slotItems.map(item => {
                      const owned = ownedCosmetics.includes(item.id);
                      const equipped = equippedCosmetics[item.slot] === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[s.cosmeticCard, equipped ? s.cosmeticCardEquipped : null]}
                          onPress={() => handleCosmeticTap(item)}
                        >
                          {item.color ? (
                            <View style={[s.cosmeticSwatch, { backgroundColor: item.color }]} />
                          ) : (
                            <Text style={s.cosmeticEmoji}>{item.emoji}</Text>
                          )}
                          <Text style={s.cosmeticName} numberOfLines={1}>{lang === 'ar' ? item.nameAr : item.name}</Text>
                          {equipped ? (
                            <View style={s.equippedBadge}><Text style={s.equippedBadgeTxt}>{lang === 'ar' ? 'مُجهّز' : 'Equipped'}</Text></View>
                          ) : owned ? (
                            <Text style={s.cosmeticOwnedTxt}>{lang === 'ar' ? 'دوس للّبس' : 'Tap to wear'}</Text>
                          ) : (
                            <View style={s.cosmeticPriceRow}>
                              <Text style={s.buyBtnGem}>💎</Text>
                              <Text style={s.cosmeticPriceTxt}>{item.price}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </>
        ) : tab === 'covers' ? (
          <>
            <Text style={s.sectionSubTitle}>{lang === 'ar' ? '📔 أغلفة احترافية' : '📔 Professional covers'}</Text>
            <View style={s.coversGrid}>
              {BOOK_COVERS.map(cover => {
                const owned = ownedCovers.includes(cover.id);
                return (
                  <TouchableOpacity
                    key={cover.id}
                    style={s.coverCard}
                    onPress={() => handleCoverTap(cover)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={(lang === 'ar' ? cover.nameAr : cover.name) + (owned ? (lang === 'ar' ? '، مملوك' : ', owned') : (lang === 'ar' ? `، السعر ${cover.price} جوهرة` : `, price ${cover.price} gems`))}
                  >
                    <View style={[s.coverSwatch, { backgroundColor: cover.colors[0], borderColor: cover.colors[1] }]} />
                    <Text style={s.coverName} numberOfLines={1}>{lang === 'ar' ? cover.nameAr : cover.name}</Text>
                    {owned ? (
                      <Text style={s.cosmeticOwnedTxt}>{lang === 'ar' ? 'مملوك ✓' : 'Owned ✓'}</Text>
                    ) : cover.price === 0 ? (
                      <Text style={s.cosmeticOwnedTxt}>{lang === 'ar' ? 'مجاني' : 'Free'}</Text>
                    ) : (
                      <View style={s.cosmeticPriceRow}>
                        <Text style={s.buyBtnGem}>💎</Text>
                        <Text style={s.cosmeticPriceTxt}>{cover.price}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[s.sectionSubTitle, { marginTop: 20 }]}>{lang === 'ar' ? '🎨 ملصقات' : '🎨 Stickers'}</Text>
            <View style={s.coversGrid}>
              {COVER_STICKERS.map(st => {
                const owned = ownedStickers.includes(st.id);
                return (
                  <TouchableOpacity
                    key={st.id}
                    style={s.coverCard}
                    onPress={() => handleStickerBuyTap(st)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={(lang === 'ar' ? st.nameAr : st.name) + (owned ? (lang === 'ar' ? '، مملوك' : ', owned') : (lang === 'ar' ? `، السعر ${st.price} جوهرة` : `, price ${st.price} gems`))}
                  >
                    {st.type === 'text' ? (
                      <View style={s.stickerTextPreview}><Text style={s.stickerTextPreviewTxt}>{lang === 'ar' ? st.textAr : st.text}</Text></View>
                    ) : (
                      <Text style={{ fontSize: 30 }}>{st.emoji}</Text>
                    )}
                    <Text style={s.coverName} numberOfLines={1}>{lang === 'ar' ? st.nameAr : st.name}</Text>
                    {owned ? (
                      <Text style={s.cosmeticOwnedTxt}>{lang === 'ar' ? 'مملوك ✓' : 'Owned ✓'}</Text>
                    ) : (
                      <View style={s.cosmeticPriceRow}>
                        <Text style={s.buyBtnGem}>💎</Text>
                        <Text style={s.cosmeticPriceTxt}>{st.price}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.coversHint}>
              {lang === 'ar' ? 'بعد الشراء، اختر الغلاف والملصقات من صفحة أي كتاب بمكتبتك.' : 'After buying, pick your cover and stickers from any book in your Library.'}
            </Text>
          </>
        ) : (
          /* المنتجات الاستهلاكية */
          stationeryItems.map(item => (
            <View key={item.id} style={[s.itemCard, { borderColor: item.color + '44' }]}>
              <View style={[s.itemIcon, { backgroundColor: item.color + '22' }]}>
                <Text style={s.itemEmoji}>{item.icon}</Text>
              </View>
              <View style={s.itemInfo}>
                <Text style={s.itemName}>{lang === 'ar' ? item.nameAr : item.name}</Text>
                <Text style={s.itemDesc}>{item.desc}</Text>
                {item.type === 'pen'    ? <Text style={s.itemStat}>{item.ink} {lang === 'ar' ? 'وحدة حبر' : 'ink units'}</Text> : null}
                {item.type === 'eraser' ? <Text style={s.itemStat}>{item.uses} {lang === 'ar' ? 'استخدام' : 'uses'}</Text>       : null}
                {item.type === 'paper'  ? <Text style={s.itemStat}>{item.pages} {lang === 'ar' ? 'صفحة' : 'pages'}</Text>        : null}
              </View>
              <TouchableOpacity
                style={[s.buyBtn, isOwned(item) ? s.buyBtnOwned : gems < item.price ? s.buyBtnDisabled : { backgroundColor: item.color + 'cc' }]}
                onPress={() => handleBuy(item)}
                disabled={isOwned(item)}
                accessibilityRole="button">
                {isOwned(item) ? (
                  <Text style={s.buyBtnTxt}>✓ {T('owned')}</Text>
                ) : (
                  <View style={s.buyBtnInner}>
                    <Text style={s.buyBtnGem}>💎</Text>
                    <Text style={s.buyBtnTxt}>{item.price}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* كيفية كسب الجواهر */}
        <View style={s.earnCard}>
          <Text style={s.earnTitle}>{lang === 'ar' ? 'كيف تكسب الجواهر 💎' : 'How to earn gems 💎'}</Text>
          {[
            { icon: '📝', labelAr: 'إكمال مرحلة كلمات',    label: 'Complete a word phase', gems: '+2' },
            { icon: '🎬', labelAr: 'إنهاء حلقة',            label: 'Finish an episode',     gems: '+10' },
            { icon: '🚨', labelAr: 'إنقاذ كلمة',            label: 'Rescue a word',         gems: '+3' },
            { icon: '🤝', labelAr: 'إكمال قصة تعاونية',     label: 'Complete Co-op story',  gems: '+25' },
            { icon: '🔥', labelAr: 'مكافأة تتابع 7 أيام',   label: '7-day streak bonus',    gems: '+15' },
            { icon: '🎁', labelAr: 'فتح صندوق الهدية اليومي',  label: 'Open the daily gift box', gems: '🎲' },
          ].map(e => (
            <View key={e.label} style={s.earnRow}>
              <Text style={s.earnIcon}>{e.icon}</Text>
              <Text style={s.earnLabel}>{lang === 'ar' ? e.labelAr : e.label}</Text>
              <Text style={s.earnGems}>{e.gems}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      <GiftBox
        visible={giftModal}
        lang={lang}
        rewards={GIFT_REWARDS}
        onOpened={handleGiftReward}
        onClose={() => setGiftModal(false)}
      />

      <GiftBox
        visible={weeklyGiftModal}
        lang={lang}
        rewards={WEEKLY_GIFT_REWARDS}
        title={lang === 'ar' ? 'هدية الأسبوع بانتظارك 🎊' : 'Your weekly gift awaits 🎊'}
        onOpened={handleWeeklyGiftReward}
        onClose={() => setWeeklyGiftModal(false)}
      />
    </ThemedSafeArea>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#08080f' },
  content:         { padding: 16, paddingBottom: 40 },
  currentCard:     { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 12 },
  currentTitle:    { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 10 },
  currentDetails:  { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  detailItem:      { alignItems: 'center', gap: 4 },
  detailIcon:      { fontSize: 20 },
  detailTxt:       { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  giftCard:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,179,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,179,0,0.3)', borderRadius: 14, padding: 16, marginBottom: 16 },
  weeklyGiftCard:  { backgroundColor: 'rgba(155,89,182,0.12)', borderColor: 'rgba(155,89,182,0.35)' },
  freezeCard:      { backgroundColor: 'rgba(0,188,212,0.1)', borderColor: 'rgba(0,188,212,0.3)' },
  giftCardDisabled:{ opacity: 0.45 },
  giftLeft:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  giftIcon:        { fontSize: 32 },
  giftTitle:       { fontSize: 15, fontWeight: '700', color: '#fff' },
  giftDesc:        { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  giftArrow:       { color: '#FFB300', fontSize: 20 },
  tabs:            { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 3, marginBottom: 14 },
  tab:             { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, gap: 2 },
  tabActive:       { backgroundColor: '#1B3A6B' },
  tabIcon:         { fontSize: 18 },
  tabTxt:          { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  tabTxtActive:    { color: '#fff', fontWeight: '700' },
  itemCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  itemIcon:        { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  itemEmoji:       { fontSize: 28 },
  itemInfo:        { flex: 1 },
  itemName:        { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  itemDesc:        { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  itemStat:        { fontSize: 11, color: '#FFB300', fontWeight: '600' },
  buyBtn:          { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, minWidth: 70, alignItems: 'center' },
  buyBtnOwned:     { backgroundColor: 'rgba(46,139,87,0.2)', borderWidth: 1, borderColor: 'rgba(46,139,87,0.4)' },
  buyBtnDisabled:  { backgroundColor: 'rgba(255,255,255,0.06)' },
  buyBtnInner:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  buyBtnGem:       { fontSize: 14 },
  buyBtnTxt:       { color: '#fff', fontSize: 13, fontWeight: '700' },

  biboPreviewWrap: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, paddingVertical: 20, marginBottom: 16 },
  biboPreviewHint: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },
  slotGroup:       { marginBottom: 16 },
  slotTitle:       { color: '#fff', fontWeight: '800', fontSize: 13, marginBottom: 10 },
  cosmeticsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionSubTitle: { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 12 },
  coversGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  coverCard:       { width: '31%', aspectRatio: 0.9, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 6 },
  coverSwatch:     { width: 40, height: 40, borderRadius: 10, borderWidth: 3, marginBottom: 6 },
  coverName:       { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  stickerTextPreview:    { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 6, maxWidth: '100%' },
  stickerTextPreviewTxt: { color: '#FFD54F', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  coversHint:      { color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 17 },
  cosmeticCard:    { width: '31%', aspectRatio: 0.9, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 6 },
  cosmeticCardEquipped: { borderColor: '#a5d6a7', backgroundColor: 'rgba(165,214,167,0.12)' },
  cosmeticEmoji:   { fontSize: 30, marginBottom: 4 },
  cosmeticSwatch:  { width: 30, height: 30, borderRadius: 15, marginBottom: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  cosmeticName:    { color: '#fff', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  cosmeticOwnedTxt:{ color: 'rgba(255,255,255,0.4)', fontSize: 9, marginTop: 4 },
  cosmeticPriceRow:{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  cosmeticPriceTxt:{ color: '#FFB300', fontSize: 11, fontWeight: '800' },
  equippedBadge:   { backgroundColor: '#a5d6a7', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  equippedBadgeTxt:{ color: '#0a0a12', fontSize: 9, fontWeight: '800' },

  earnCard:        { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, marginTop: 8 },
  earnTitle:       { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  earnRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  earnIcon:        { fontSize: 18, width: 28 },
  earnLabel:       { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  earnGems:        { fontSize: 13, fontWeight: '700', color: '#FFB300' },

  modalBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard:       { backgroundColor: '#12121f', borderWidth: 1, borderColor: 'rgba(255,179,0,0.3)', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' },
  modalTitle:      { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  modalDesc:       { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 10, lineHeight: 20 },
  giftStage:       { width: 200, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  giftBoxEmoji:    { fontSize: 80 },
  particle:        { position: 'absolute', fontSize: 22 },
  rewardCard:      { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,179,0,0.4)', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 18 },
  rewardIcon:      { fontSize: 44, marginBottom: 6 },
  rewardLabel:     { color: '#fff', fontSize: 14, fontWeight: '700' },
  watchBtn:        { width: '100%', backgroundColor: '#FFB300', borderRadius: 13, padding: 14, alignItems: 'center', marginBottom: 10 },
  watchBtnTxt:     { color: '#000', fontSize: 15, fontWeight: '800' },
  modalClose:      { padding: 10 },
  modalCloseTxt:   { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
