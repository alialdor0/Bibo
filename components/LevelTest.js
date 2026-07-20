import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ASSESSMENT, getLevel } from '../data';
import { playSfx } from '../utils/sfx';
import { Themed } from './Themed';

/**
 * اختبار تحديد المستوى — قابل لإعادة الاستخدام في:
 * 1) التسجيل الأولي (Onboarding خطوة 7)
 * 2) إعادة الاختبار من الإعدادات (Main → Account → إعادة اختبار المستوى)
 *
 * Props:
 *  - lang: 'ar' | 'en'
 *  - ctaLabel: نص زر المتابعة بعد ظهور النتيجة
 *  - onQuizFinished(score, levelObj): يُستدعى فور انتهاء آخر سؤال (لتحديث حالة بيبو مثلًا)
 *  - onComplete(score, levelObj): يُستدعى عند ضغط زر المتابعة بعد النتيجة
 */
export default function LevelTest({ lang, ctaLabel, onQuizFinished, onComplete }) {
  const [assess, setAssess] = useState({ qIdx: 0, score: 0, done: false, chosen: null });

  const answer = (optIdx) => {
    if (assess.chosen !== null) return;
    const q = ASSESSMENT[assess.qIdx];
    const correct = optIdx === q.correct;
    const newScore = assess.score + (correct ? 1 : 0);
    setAssess(a => ({ ...a, chosen: optIdx }));
    setTimeout(() => {
      const nextQ = assess.qIdx + 1;
      if (nextQ >= ASSESSMENT.length) {
        setAssess({ qIdx: 0, score: newScore, done: true, chosen: null });
        playSfx('levelUp');
        if (onQuizFinished) onQuizFinished(newScore, getLevel(newScore));
      } else {
        setAssess({ qIdx: nextQ, score: newScore, done: false, chosen: null });
      }
    }, 700);
  };

  const lvl = getLevel(assess.score);

  if (!assess.done) {
    const q = ASSESSMENT[assess.qIdx];
    return (
      <View style={s.wrap}>
      <Themed>
        <Text style={s.counter}>
          {lang === 'ar' ? `السؤال ${assess.qIdx + 1} من ${ASSESSMENT.length}` : `Question ${assess.qIdx + 1}/${ASSESSMENT.length}`}
        </Text>
        <View style={s.bar}>
          <View style={[s.fill, { width: Math.round((assess.qIdx / ASSESSMENT.length) * 100) + '%' }]} />
        </View>
        <Text style={s.q}>{q.q}</Text>
        <View style={s.opts}>
          {q.opts.map((opt, i) => {
            const isSel = assess.chosen === i;
            const isOk = i === q.correct;
            const bg = !isSel ? 'rgba(255,255,255,0.05)' : isOk ? 'rgba(46,139,87,0.3)' : 'rgba(192,57,43,0.3)';
            const bc = !isSel ? 'rgba(255,255,255,0.12)' : isOk ? '#2E8B57' : '#c0392b';
            return (
              <TouchableOpacity
                key={String(i)}
                style={[s.opt, { backgroundColor: bg, borderColor: bc }]}
                onPress={() => answer(i)}
                disabled={assess.chosen !== null}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={opt}
              >
                <Text style={s.optTxt}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Themed>
      </View>
    );
  }

  return (
    <View style={[s.wrap, { alignItems: 'center' }]}>
    <Themed>
      <Text style={{ fontSize: 48 }}>🏆</Text>
      <Text style={s.score}>{assess.score}/{ASSESSMENT.length}</Text>
      <View style={[s.badge, { borderColor: lvl.color }]}>
        <Text style={[s.badgeTxt, { color: lvl.color }]}>{lvl.en}</Text>
      </View>
      <Text style={s.ar}>{lvl.ar}</Text>
      <TouchableOpacity
        style={[s.cta, { backgroundColor: '#8B0000' }]}
        onPress={() => onComplete && onComplete(assess.score, lvl)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
      >
        <Text style={s.ctaTxt}>{ctaLabel}</Text>
      </TouchableOpacity>
    </Themed>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:      { width: '100%' },
  counter:   { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginBottom: 6 },
  bar:       { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 16 },
  fill:      { height: '100%', backgroundColor: '#2E8B57', borderRadius: 3 },
  q:         { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 16, lineHeight: 24 },
  opts:      { gap: 10 },
  opt:       { borderWidth: 1.5, borderRadius: 14, padding: 14 },
  optTxt:    { color: '#fff', fontSize: 15, textAlign: 'center', fontWeight: '600' },
  score:     { fontSize: 32, fontWeight: '900', color: '#fff', marginTop: 8, marginBottom: 12 },
  badge:     { borderWidth: 2, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 6, marginBottom: 6 },
  badgeTxt:  { fontSize: 18, fontWeight: '800' },
  ar:        { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  cta:       { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  ctaTxt:    { color: '#fff', fontSize: 15, fontWeight: '800' },
});
