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

function buildHTML(book, lang, coverColors, stickerObjs) {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const title = isAr ? book.trackNameAr : book.trackName;
  const date = new Date(book.completedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US');
  const c1 = (coverColors && coverColors[0]) || book.color || '#2E8B57';
  const c2 = (coverColors && coverColors[1]) || c1;
  const hasAccuracy = typeof book.accuracy === 'number' && book.totalAnswers > 0;

  const stickerLine = (stickerObjs && stickerObjs.length)
    ? stickerObjs.map(st => st.type === 'text' ? escapeHtml(isAr ? st.textAr : st.text) : escapeHtml(st.emoji)).join('&nbsp;&nbsp;')
    : '';

  const wordsRows = (book.words || []).map((w, i) => `
    <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
      <td class="emoji">${escapeHtml(w.emoji || '📖')}</td>
      <td class="word">${escapeHtml(w.word)}<span class="phonetic">${w.phonetic ? ' ' + escapeHtml(w.phonetic) : ''}</span></td>
      <td class="ar">${escapeHtml(w.ar || '')}</td>
    </tr>`).join('');

  const storyRows = (book.lines || []).map((l, i) => `
    <div class="line">
      <div class="line-num">${i + 1}</div>
      <div class="line-body">
        <p class="line-en">${escapeHtml(l.text)}</p>
        <p class="line-ar">${escapeHtml(l.ar)}</p>
      </div>
    </div>`).join('');

  return `<!DOCTYPE html>
  <html dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <style>
      @page { margin: 36px 30px; }
      * { box-sizing: border-box; }
      body { font-family: -apple-system, 'Segoe UI', Tahoma, Geneva, sans-serif; background: #fdfdfb; color: #1c1c1c; padding: 0; margin: 0; }

      .cover { text-align: center; border-radius: 22px; padding: 46px 24px 38px;
                background: linear-gradient(155deg, ${c1}26, ${c2}14 65%, #fdfdfb 100%);
                border: 2px solid ${c1}55; position: relative; overflow: hidden; }
      .cover::before { content: ''; position: absolute; top: -60px; right: -60px; width: 180px; height: 180px;
                        border-radius: 50%; background: ${c1}18; }
      .brand { color: ${c1}; font-weight: 800; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 18px; }
      .cover .icon { font-size: 60px; position: relative; }
      .cover .stickers { font-size: 22px; margin-top: 8px; position: relative; }
      .cover h1 { font-size: 28px; margin: 14px 0 6px; color: #17331f; font-weight: 800; position: relative; }
      .cover .sub { color: #6b6b6b; font-size: 13px; position: relative; }
      .cover .badge-row { display: flex; justify-content: center; gap: 22px; margin-top: 22px; position: relative; }
      .badge { text-align: center; }
      .badge .v { font-size: 19px; font-weight: 800; color: ${c1}; }
      .badge .l { font-size: 10px; color: #999; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

      h2 { font-size: 15px; color: ${c1}; text-transform: uppercase; letter-spacing: 1.5px;
           border-bottom: 2px solid ${c1}33; padding-bottom: 8px; margin: 40px 0 4px; font-weight: 800; }

      table { width: 100%; border-collapse: collapse; margin-top: 6px; border-radius: 10px; overflow: hidden; }
      tr.even { background: #f7f7f5; }
      tr.odd  { background: #ffffff; }
      td { padding: 11px 10px; font-size: 13.5px; vertical-align: middle; }
      td.emoji { font-size: 19px; width: 32px; text-align: center; }
      td.word { font-weight: 700; color: #1c1c1c; }
      .phonetic { color: #999; font-style: italic; font-weight: 400; font-size: 12px; }
      td.ar { color: #444; text-align: ${isAr ? 'right' : 'left'}; }

      .line { display: flex; gap: 12px; margin-bottom: 14px; align-items: flex-start; }
      .line-num { width: 22px; height: 22px; min-width: 22px; border-radius: 11px; background: ${c1}; color: #fff;
                   font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-top: 2px; }
      .line-body { flex: 1; }
      .line-en { font-size: 13.5px; margin: 0 0 3px; line-height: 1.5; }
      .line-ar { font-size: 12.5px; color: #666; margin: 0; line-height: 1.5; }

      .footer { text-align: center; margin-top: 44px; padding-top: 16px; border-top: 1px solid #eee; color: #b0b0b0; font-size: 10.5px; letter-spacing: 0.5px; }
    </style>
  </head>
  <body>
    <div class="cover">
      <div class="brand">BIBO LINGO</div>
      <div class="icon">${escapeHtml(book.icon || '📖')}</div>
      ${stickerLine ? `<div class="stickers">${stickerLine}</div>` : ''}
      <h1>${escapeHtml(title)}</h1>
      <div class="sub">${isAr ? 'اكتملت في' : 'Completed on'} ${date}</div>
      <div class="badge-row">
        <div class="badge"><div class="v">${(book.words || []).length}</div><div class="l">${isAr ? 'كلمة' : 'words'}</div></div>
        <div class="badge"><div class="v">+${book.gemsEarned || 0}</div><div class="l">${isAr ? 'جواهر' : 'gems'}</div></div>
        ${hasAccuracy ? `<div class="badge"><div class="v">${book.accuracy}%</div><div class="l">${isAr ? 'دقة' : 'accuracy'}</div></div>` : ''}
      </div>
    </div>

    <h2>${isAr ? 'الكلمات التي تعلّمتها' : 'Words you learned'}</h2>
    <table>${wordsRows}</table>

    <h2>${isAr ? 'القصة كاملة' : 'The full story'}</h2>
    ${storyRows}

    <div class="footer">Bibo Lingo — ${isAr ? 'رحلتك في تعلم الإنجليزية' : 'Your English learning journey'}</div>
  </body>
  </html>`;
}

/**
 * يصدّر كتاب من المكتبة كـ PDF ويفتح شاشة المشاركة/الحفظ.
 * coverColors/stickerObjs اختياريين لعرض نفس تخصيص الغلاف الفعلي بالتصدير.
 * يرجع true لو نجح، false لو المكتبة مش متاحة أو حصل خطأ.
 */
export async function exportBookPDF(book, lang, coverColors, stickerObjs) {
  if (!Print) return false;
  try {
    const html = buildHTML(book, lang, coverColors, stickerObjs);
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
function buildAchievementHTML(book, lang, coverColor, stickerObjs) {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const title = isAr ? book.trackNameAr : book.trackName;
  const date = new Date(book.completedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US');
  const color = coverColor || book.color || '#2E8B57';
  const hasAccuracy = typeof book.accuracy === 'number' && book.totalAnswers > 0;
  const stickerLine = (stickerObjs && stickerObjs.length)
    ? stickerObjs.map(st => st.type === 'text' ? escapeHtml(isAr ? st.textAr : st.text) : escapeHtml(st.emoji)).join('&nbsp;&nbsp;')
    : '';

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
      .stickers { font-size: 22px; margin-top: 8px; }
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
      <div class="brand">BIBO LINGO</div>
      <div class="icon">${escapeHtml(book.icon || '📖')}</div>
      ${stickerLine ? `<div class="stickers">${stickerLine}</div>` : ''}
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
 * coverColor/stickerObjs اختياريين لو المستخدم خصّص الغلاف. بيرجع true لو نجح.
 */
export async function shareBookAchievement(book, lang, coverColor, stickerObjs) {
  if (!Print) return false;
  try {
    const html = buildAchievementHTML(book, lang, coverColor, stickerObjs);
    const { uri } = await Print.printToFileAsync({ html, base64: false, width: 500, height: 650 });
    if (Sharing && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: lang === 'ar' ? 'مشاركة الإنجاز' : 'Share achievement' });
    }
    return true;
  } catch (e) {
    return false;
  }
}
