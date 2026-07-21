// utils/libraryMigration.js
//
// ترحيل بيانات المكتبة القديمة (كتاب مستقل لكل حلقة) لبنية جديدة: كتاب واحد
// متجدد لكل مسار (track)، وكل حلقة بقت "فصل" (chapter) جوّاه. الهدف إن مكتبة
// المستخدم تتراكم كقصة واحدة طويلة بدل ما تتفرّق لعشرات الكتب الصغيرة.
//
// الدالتين هنا بيتنفذوا تلقائيًا مرة واحدة بس عند فتح التطبيق (من AppContext)
// لو لسه لاقيين بيانات بالبنية القديمة — وبعدين البيانات بتتحفظ بالبنية
// الجديدة فورًا، فمش بيتكرر الترحيل تاني. ما بيضيع ولا حرف من تقدم المستخدم:
// كل حلقة قديمة بتتحول لفصل كامل بكل إحصائياته (الدقة، الكلمات، الوقت،
// الجواهر، عدد مرات القراءة).

import { TRACKS } from '../data';

function trackMetaFor(trackId) {
  return TRACKS.find(t => t.id === trackId) || null;
}

/**
 * يحوّل مصفوفة المكتبة القديمة (عنصر = حلقة واحدة) إلى مصفوفة كتب جديدة
 * (عنصر = مسار كامل بمصفوفة chapters جواه). لو البيانات أصلًا بالبنية
 * الجديدة، بترجع زي ما هي من غير أي تغيير (آمنة تُنادى أكتر من مرة).
 */
export function migrateLibraryToBooks(oldLibrary) {
  if (!Array.isArray(oldLibrary) || oldLibrary.length === 0) return [];

  // لو كل عناصر المكتبة أصلًا فيها chapters (بنية جديدة)، مفيش داعي للترحيل
  if (oldLibrary.every(entry => Array.isArray(entry.chapters))) return oldLibrary;

  const booksByTrack = {};

  for (const entry of oldLibrary) {
    // عنصر بالبنية الجديدة أصلًا (احتياطًا لو البيانات مختلطة من ترحيل جزئي سابق)
    if (Array.isArray(entry.chapters)) {
      if (!booksByTrack[entry.trackId]) {
        booksByTrack[entry.trackId] = entry;
      } else {
        booksByTrack[entry.trackId] = {
          ...booksByTrack[entry.trackId],
          chapters: [...booksByTrack[entry.trackId].chapters, ...entry.chapters],
        };
      }
      continue;
    }

    // عنصر بالبنية القديمة (حلقة واحدة) → نحوّله لفصل
    const meta = trackMetaFor(entry.trackId);
    const chapter = {
      episodeId: entry.episodeId,
      title: entry.trackName || (meta ? meta.name : ''),      // كان اسم الحلقة، بقى عنوان الفصل
      titleAr: entry.trackNameAr || (meta ? meta.nameAr : ''),
      // حذفنا السطر العربي من بيانات القراءة السينمائية (مطلوب) — نص إنجليزي بس من هنا فصاعدًا
      lines: (entry.lines || []).map(l => ({ text: l.text })),
      words: entry.words || [],
      completedAt: entry.completedAt,
      timeSpentSec: entry.timeSpentSec,
      correctAnswers: entry.correctAnswers,
      totalAnswers: entry.totalAnswers,
      accuracy: entry.accuracy,
      gemsEarned: entry.gemsEarned || 0,
      readCount: entry.readCount || 1,
    };

    if (!booksByTrack[entry.trackId]) {
      booksByTrack[entry.trackId] = {
        trackId: entry.trackId,
        trackName: meta ? meta.name : entry.trackName,
        trackNameAr: meta ? meta.nameAr : entry.trackNameAr,
        icon: entry.icon || (meta ? meta.icon : '📖'),
        color: entry.color || (meta ? meta.color : '#2E8B57'),
        chapters: [],
      };
    }
    booksByTrack[entry.trackId].chapters.push(chapter);
  }

  return Object.values(booksByTrack).map(book => ({
    ...book,
    chapters: [...book.chapters].sort((a, b) => (a.episodeId || 0) - (b.episodeId || 0)),
  }));
}

/**
 * يحوّل مفاتيح أغلفة/ملصقات الكتب من "trackId::episodeId" (غلاف لكل حلقة)
 * لمفتاح "trackId" بس (غلاف واحد للكتاب كله). لو فيه أكتر من غلاف قديم لنفس
 * المسار، بناخد آخر واحد المستخدم اختاره (الأحدث completedAt-wise غير متاح
 * هنا، فبناخد آخر مفتاح بالترتيب كتقريب معقول).
 */
export function migrateBookCovers(oldCovers) {
  if (!oldCovers || typeof oldCovers !== 'object') return {};
  const hasOldKeys = Object.keys(oldCovers).some(k => k.includes('::'));
  if (!hasOldKeys) return oldCovers;

  const migrated = {};
  for (const key of Object.keys(oldCovers)) {
    const trackId = key.includes('::') ? key.split('::')[0] : key;
    migrated[trackId] = oldCovers[key];
  }
  return migrated;
}
