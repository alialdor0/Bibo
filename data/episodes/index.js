// data/episodes/index.js
// محمّل بيانات الحلقات بالبنية الجديدة (LinguaDrama). كل مسار له ملف
// season مستقل؛ لو المسار مالوش ملف هنا، Story.js بيرجع للنظام القديم
// (STORY_LINES) أو شاشة "قريبًا".

import spySeason1 from './spy_season1.json';

// trackId -> season data (episodes[], project, level, ...)
export const SEASONS = {
  spy: spySeason1,
};

export function hasEpisodes(trackId) {
  return !!SEASONS[trackId];
}

export function getSeason(trackId) {
  return SEASONS[trackId] || null;
}

/** بيرجع حلقة برقمها (1-indexed) من مسار معين، أو null لو مش موجودة */
export function getEpisode(trackId, episodeNumber) {
  const season = SEASONS[trackId];
  if (!season) return null;
  return season.episodes.find(e => e.episode === episodeNumber) || null;
}

export function getTotalEpisodes(trackId) {
  const season = SEASONS[trackId];
  return season ? season.episodes.length : 0;
}
