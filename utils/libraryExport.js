// utils/libraryExport.js
// تصدير "كتاب" من المكتبة (حلقة اتخلصت) كملف PDF جاهز للمشاركة أو الحفظ.
// نفس أسلوب الـ require الآمن المستخدم في باقي المشروع.

var Print   = null;
var Sharing = null;
try { Print   = require('expo-print'); } catch (e) {}
try { Sharing = require('expo-sharing'); } catch (e) {}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildHTML(book, lang) {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const title = isAr ? book.trackNameAr : book.trackName;
  const date = new Date(book.completedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US');

  const wordsRows = (book.words || []).map(w => `
    <tr>
      <td class="emoji">${escapeHtml(w.emoji || '📖')}</td>
      <td class="word">${escapeHtml(w.word)}</td>
      <td class="phonetic">${escapeHtml(w.phonetic || '')}</td>
      <td class="ar">${escapeHtml(w.ar || '')}</td>
    </tr>`).join('');

  const storyRows = (book.lines || []).map((l, i) => `
    <div class="line">
      <div class="line-num">${i + 1}</div>
      <div>
        <p class="line-en">${escapeHtml(l.text)}</p>
        <p class="line-ar">${escapeHtml(l.ar)}</p>
      </div>
    </div>`).join('');

  return `<!DOCTYPE html>
  <html dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, 'Segoe UI', Tahoma, sans-serif; background: #fdfdfb; color: #1a1a1a; padding: 32px; }
      .cover { text-align: center; border: 3px solid ${book.color || '#2E8B57'}; border-radius: 20px; padding: 40px 20px; margin-bottom: 32px; background: ${book.color || '#2E8B57'}12; }
      .cover .icon { font-size: 56px; }
      .cover h1 { font-size: 26px; margin: 12px 0 4px; color: ${book.color || '#2E8B57'}; }
      .cover .sub { color: #666; font-size: 13px; }
      h2 { font-size: 18px; border-bottom: 2px solid ${book.color || '#2E8B57'}; padding-bottom: 6px; margin-top: 36px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      td { padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px; vertical-align: middle; }
      td.emoji { font-size: 20px; width: 34px; }
      td.word { font-weight: 700; }
      td.phonetic { color: #888; font-style: italic; }
      td.ar { color: #333; }
      .line { display: flex; gap: 12px; margin-bottom: 16px; }
      .line-num { width: 24px; height: 24px; border-radius: 12px; background: ${book.color || '#2E8B57'}; color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .line-en { font-size: 14px; margin: 0 0 4px; }
      .line-ar { font-size: 13px; color: #555; margin: 0; }
      .footer { text-align: center; margin-top: 40px; color: #aaa; font-size: 11px; }
    </style>
  </head>
  <body>
    <div class="cover">
      <div class="icon">${escapeHtml(book.icon || '📖')}</div>
      <h1>${escapeHtml(title)}</h1>
      <div class="sub">${isAr ? 'اكتملت في' : 'Completed on'} ${date} · ${(book.words || []).length} ${isAr ? 'كلمة' : 'words'} · +${book.gemsEarned || 0} 💎</div>
    </div>

    <h2>${isAr ? 'الكلمات اللي اتعلمتها' : 'Words you learned'}</h2>
    <table>${wordsRows}</table>

    <h2>${isAr ? 'القصة' : 'The story'}</h2>
    ${storyRows}

    <div class="footer">Bibo Lingo 🐦 — ${isAr ? 'رحلتك في تعلم الإنجليزية' : 'Your English learning journey'}</div>
  </body>
  </html>`;
}

/**
 * يصدّر كتاب من المكتبة كـ PDF ويفتح شاشة المشاركة/الحفظ.
 * يرجع true لو نجح، false لو المكتبة مش متاحة أو حصل خطأ.
 */
export async function exportBookPDF(book, lang) {
  if (!Print) return false;
  try {
    const html = buildHTML(book, lang);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    if (Sharing && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    }
    return true;
  } catch (e) {
    return false;
  }
}

/** كرت إنجاز صغير (غلاف فقط + الإحصائيات) بحجم يناسب المشاركة السريعة، بعكس التصدير الكامل اللي بيشمل الكلمات والقصة */
function buildAchievementHTML(book, lang, coverColor, stickerEmojis) {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const title = isAr ? book.trackNameAr : book.trackName;
  const date = new Date(book.completedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US');
  const color = coverColor || book.color || '#2E8B57';
  const hasAccuracy = typeof book.accuracy === 'number' && book.totalAnswers > 0;

  return `<!DOCTYPE html>
  <html dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: 500px 650px; margin: 0; }
      body { font-family: -apple-system, 'Segoe UI', Tahoma, sans-serif; background: #fdfdfb; margin: 0; }
      .card { width: 500px; height: 650px; box-sizing: border-box; padding: 36px 28px; text-align: center;
              background: linear-gradient(160deg, ${color}22, #fdfdfb 60%); border: 6px solid ${color}; }
      .brand { color: ${color}; font-weight: 800; font-size: 14px; letter-spacing: 1px; margin-bottom: 18px; }
      .icon { font-size: 90px; margin-top: 10px; }
      .stickers { font-size: 26px; margin-top: 6px; letter-spacing: 6px; }
      h1 { font-size: 30px; color: ${color}; margin: 18px 0 6px; }
      .sub { color: #777; font-size: 14px; margin-bottom: 26px; }
      .stats { display: flex; justify-content: center; gap: 26px; margin-top: 10px; }
      .stat { text-align: center; }
      .stat .v { font-size: 20px; font-weight: 800; color: #222; }
      .stat .l { font-size: 11px; color: #999; margin-top: 2px; }
      .footer { margin-top: 34px; color: #bbb; font-size: 11px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="brand">🐦 BIBO LINGO</div>
      <div class="icon">${escapeHtml(book.icon || '📖')}</div>
      ${stickerEmojis && stickerEmojis.length ? `<div class="stickers">${stickerEmojis.join(' ')}</div>` : ''}
      <h1>${escapeHtml(title)}</h1>
      <div class="sub">${isAr ? 'اكتملت في' : 'Completed on'} ${date}</div>
      <div class="stats">
        <div class="stat"><div class="v">${(book.words || []).length}</div><div class="l">${isAr ? 'كلمة' : 'words'}</div></div>
        <div class="stat"><div class="v">+${book.gemsEarned || 0} 💎</div><div class="l">${isAr ? 'جواهر' : 'gems'}</div></div>
        ${hasAccuracy ? `<div class="stat"><div class="v">${book.accuracy}%</div><div class="l">${isAr ? 'دقة' : 'accuracy'}</div></div>` : ''}
      </div>
      <div class="footer">${isAr ? 'رحلتي في تعلم الإنجليزية مع بيبو' : 'My English learning journey with Bibo'}</div>
    </div>
  </body>
  </html>`;
}

/**
 * يشارك "إنجاز" — كرت مصغّر لغلاف الكتاب المكتمل — على وسائل التواصل عبر شاشة المشاركة الأصلية.
 * coverColor/stickerEmojis اختياريين لو المستخدم خصّص الغلاف. بيرجع true لو نجح.
 */
export async function shareBookAchievement(book, lang, coverColor, stickerEmojis) {
  if (!Print) return false;
  try {
    const html = buildAchievementHTML(book, lang, coverColor, stickerEmojis);
    const { uri } = await Print.printToFileAsync({ html, base64: false, width: 500, height: 650 });
    if (Sharing && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: lang === 'ar' ? 'مشاركة الإنجاز' : 'Share achievement' });
    }
    return true;
  } catch (e) {
    return false;
  }
}
