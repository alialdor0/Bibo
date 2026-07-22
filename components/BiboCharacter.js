import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { playBiboSound } from '../utils/sounds';
import { COSMETIC_ITEMS } from '../data';

// ─────────────────────────────────────────────────────────────
// صور بيبو الحقيقية السبع مفعّلة من assets/bibo/*.png
// لو حبيت ترجع للإيموجي المؤقت، غيّر USE_IMAGES لـ false.
// ─────────────────────────────────────────────────────────────
const USE_IMAGES = true;

const IMAGES = {
  welcome:   require('../assets/bibo/welcome.png'),
  celebrate: require('../assets/bibo/celebrate.png'),
  attention: require('../assets/bibo/attention.png'),
  encourage: require('../assets/bibo/encourage.png'),
  sleep:     require('../assets/bibo/sleep.png'),
  thinking:  require('../assets/bibo/thinking.png'),
  idea:      require('../assets/bibo/idea.png'),
};

export const STATE_META = {
  welcome:   { emoji: '🐦', color: '#2E8B57', labelAr: 'ترحيب',  labelEn: 'welcome'   },
  celebrate: { emoji: '🎉', color: '#FFB300', labelAr: 'احتفال', labelEn: 'celebrate' },
  attention: { emoji: '👀', color: '#1B3A6B', labelAr: 'انتباه', labelEn: 'attention' },
  encourage: { emoji: '💪', color: '#8B4513', labelAr: 'تشجيع', labelEn: 'encourage' },
  sleep:     { emoji: '😴', color: 'rgba(255,255,255,0.35)', labelAr: 'نوم', labelEn: 'sleep' },
  thinking:  { emoji: '🤔', color: '#8B0000', labelAr: 'تفكير', labelEn: 'thinking'  },
  idea:      { emoji: '💡', color: '#FFB300', labelAr: 'فكرة',  labelEn: 'idea'      },
};

/**
 * BiboCharacter — شخصية بيبو المتحركة مع فقاعة كلام اختيارية.
 *
 * Props:
 *  - state:    'welcome' | 'celebrate' | 'attention' | 'encourage' | 'sleep' | 'thinking' | 'idea'
 *  - message:  نص الفقاعة (اختياري)
 *  - size:     قطر الدائرة بالبكسل (افتراضي 64)
 *  - layout:   'column' (الفقاعة فوق، افتراضي) أو 'row' (الفقاعة جنب)
 *  - style:    ستايل إضافي للـ wrapper
 *  - onPress:  دالة اختيارية — لو موجودة، بيبو يبقى قابل للمس (مفيد لطلب تلميح)
 *  - hintBadge:شارة صغيرة نابضة "💡" فوق بيبو لما يكون عنده تلميح متاح
 */
export default function BiboCharacter({ state = 'welcome', message, size = 64, layout = 'column', style, onPress, hintBadge = false, showCosmetics = true, silent = false, intensity = 1 }) {
  const anim   = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;
  const pulse  = useRef(new Animated.Value(0)).current;
  const meta   = STATE_META[state] || STATE_META.welcome;
  const { voiceOn, equippedCosmetics } = useApp();

  const hatItem     = showCosmetics && equippedCosmetics?.hat     ? COSMETIC_ITEMS.find(c => c.id === equippedCosmetics.hat)     : null;
  const glassesItem = showCosmetics && equippedCosmetics?.glasses ? COSMETIC_ITEMS.find(c => c.id === equippedCosmetics.glasses) : null;
  const ringItem     = showCosmetics && equippedCosmetics?.ring    ? COSMETIC_ITEMS.find(c => c.id === equippedCosmetics.ring)    : null;
  const ringColor = ringItem?.color || (meta.color + '77');

  useEffect(() => {
    if (!hintBadge) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 550, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [hintBadge]);

  useEffect(() => {
    if (voiceOn && !silent) playBiboSound(state);
  }, [state, voiceOn, silent]);

  useEffect(() => {
    anim.setValue(0);
    let loop;

    if (state === 'celebrate') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]),
        { iterations: 4 }
      );
    } else if (state === 'attention') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 480, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 480, useNativeDriver: true }),
        ])
      );
    } else if (state === 'encourage') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(anim, { toValue: -1, duration: 320, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 320, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      );
    } else if (state === 'thinking') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: true }),
          Animated.timing(anim, { toValue: -1, duration: 850, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 850, useNativeDriver: true }),
        ])
      );
    } else if (state === 'idea') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 550, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.4, duration: 550, useNativeDriver: true }),
        ])
      );
    } else if (state === 'sleep') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ])
      );
    } else {
      // welcome + default: تنفّس هادئ
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      );
    }

    loop.start();
    return () => { if (loop) loop.stop(); };
  }, [state]);

  useEffect(() => {
    bubble.setValue(0);
    Animated.timing(bubble, { toValue: message ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [message]);

  // شدة القفزة بتكبر مع طول سلسلة الإجابات الصحيحة (intensity بييجي من الشاشة اللي بتستخدم بيبو)
  const clampedIntensity = Math.max(1, Math.min(intensity || 1, 2.2));
  let transform = [];
  let opacity = 1;
  if (state === 'celebrate') {
    transform = [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12 * clampedIntensity] }) }];
  } else if (state === 'attention') {
    transform = [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }];
  } else if (state === 'encourage') {
    transform = [{ rotate: anim.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] }) }];
  } else if (state === 'thinking') {
    transform = [{ rotate: anim.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] }) }];
  } else if (state === 'idea') {
    transform = [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }];
  } else if (state === 'sleep') {
    opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.85] });
    transform = [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.02] }) }];
  } else {
    transform = [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }];
  }

  const a11yLabel = 'بيبو - ' + meta.labelAr + (message ? ': ' + message : '') + (onPress ? (hintBadge ? ' - تلميح متاح، اضغط للمساعدة' : ' - اضغط للمساعدة') : '');

  const CircleInner = (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {hintBadge ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              width: size * 1.7, height: size * 1.7, borderRadius: size * 0.85,
              backgroundColor: meta.color,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.3] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }],
            },
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, borderColor: ringColor, borderWidth: ringItem ? 3 : 2, opacity, transform },
        ]}
      >
        {USE_IMAGES && IMAGES[state] ? (
          <Image source={IMAGES[state]} style={{ width: size * 0.7, height: size * 0.7 }} resizeMode="contain" />
        ) : (
          <Text style={{ fontSize: size * 0.42 }}>{meta.emoji}</Text>
        )}
        {state === 'sleep' ? <Text style={styles.zzz}>💤</Text> : null}
        {hatItem ? <Text style={[styles.hatEmoji, { fontSize: size * 0.36, top: -size * 0.16 }]}>{hatItem.emoji}</Text> : null}
        {glassesItem ? <Text style={[styles.glassesEmoji, { fontSize: size * 0.26, top: size * 0.28 }]}>{glassesItem.emoji}</Text> : null}
        {hintBadge ? (
          <Animated.View style={[styles.hintBadge, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }] }]}>
            <Text style={styles.hintBadgeTxt}>💡</Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );

  const Circle = onPress ? (
    <TouchableOpacity onPress={onPress} accessible accessibilityRole="button" accessibilityLabel={a11yLabel} activeOpacity={0.75}>
      {CircleInner}
    </TouchableOpacity>
  ) : (
    <View accessible accessibilityRole="image" accessibilityLabel={a11yLabel}>
      {CircleInner}
    </View>
  );

  const Bubble = message ? (
    <Animated.View
      style={[styles.bubble, layout === 'row' ? styles.bubbleRow : styles.bubbleCol, { opacity: bubble, borderColor: meta.color + '55' }]}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.bubbleTxt}>{message}</Text>
    </Animated.View>
  ) : null;

  if (layout === 'row') {
    return (
      <View style={[styles.rowWrap, style]}>
        {Circle}
        {Bubble}
      </View>
    );
  }

  return (
    <View style={[styles.colWrap, style]}>
      {Bubble}
      {Circle}
    </View>
  );
}

const styles = StyleSheet.create({
  colWrap:   { alignItems: 'center' },
  rowWrap:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  circle:    { backgroundColor: '#0a150a', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  glow:      { position: 'absolute' },
  zzz:       { position: 'absolute', top: -8, right: -6, fontSize: 14 },
  hatEmoji:      { position: 'absolute', alignSelf: 'center', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 3 },
  glassesEmoji:  { position: 'absolute', alignSelf: 'center' },
  hintBadge: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFB300', alignItems: 'center', justifyContent: 'center' },
  hintBadgeTxt: { fontSize: 13 },
  bubble:    { maxWidth: 240, backgroundColor: 'rgba(20,20,28,0.95)', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleCol: { marginBottom: 8 },
  bubbleRow: { flex: 1 },
  bubbleTxt: { color: '#fff', fontSize: 12, lineHeight: 17 },
});
