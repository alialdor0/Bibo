// screens/Story.js
// موجّه بسيط: كل المسارات الخمسة (spy/love/family/crime/medical) عندها بيانات
// حلقات بالبنية الجديدة (LinguaDrama)، فبنستخدم دايمًا محرك StoryEpisode.
//
// ملاحظة: كان هنا نظام قصة قديم (StoryLegacy) بيحتوي على اختبار نطق وهمي
// (تقييم عشوائي بدون تحليل صوت حقيقي) — تمت إزالته بالكامل لأنه لم يعد
// يُستخدم أبدًا (كل المسارات الآن لها بيانات حلقات حقيقية) ولأنه كان يحتوي
// ميزة وهمية.
import React from 'react';
import StoryEpisode from './StoryEpisode';

export default function Story({ onLeave }) {
  return <StoryEpisode onLeave={onLeave} />;
}
