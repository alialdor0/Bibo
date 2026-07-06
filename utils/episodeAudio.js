// utils/episodeAudio.js
// تشغيل نطق الكلمة: أولوية للملف الصوتي المسجَّل (audio_url) من الحلقة،
// ولو حصل خطأ (مفيش نت، الرابط واقع، الملف مش موجود، تأخير زيادة، أو مفيش
// audio_url أصلاً) نرجع تلقائيًا لنطق الجهاز (expo-speech) بنفس أسلوب Story.js.

var createAudioPlayer = null;
try { createAudioPlayer = require('expo-audio').createAudioPlayer; } catch (e) {}

var Speech = null;
try { Speech = require('expo-speech'); } catch (e) {}

function speakFallback(word, onDone) {
  if (Speech) {
    Speech.stop();
    Speech.speak(word, { language: 'en-US', pitch: 1.0, rate: 0.85, onDone: onDone || (() => {}) });
  } else if (onDone) onDone();
}

let currentPlayer = null;
let fallbackTimer = null;

function cleanupPlayer() {
  if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
  if (currentPlayer) {
    try { currentPlayer.release(); } catch (e) {}
    currentPlayer = null;
  }
}

/**
 * ينطق كلمة الحلقة: يجرب audio_url الأول، ولو فشل (تحميل، تشغيل، أو تأخر أكتر
 * من 4 ثواني بسبب مشكلة شبكة) يرجع تلقائيًا لنطق الجهاز بنفس النص.
 * لو ما فيه audio_url من الأساس، يروح مباشرة لنطق الجهاز.
 */
export function speakWord(word, audioUrl, onDone) {
  cleanupPlayer();

  if (!createAudioPlayer || !audioUrl) {
    speakFallback(word, onDone);
    return;
  }

  let settled = false;
  const finishOnce = (useFallback) => {
    if (settled) return;
    settled = true;
    cleanupPlayer();
    if (useFallback) speakFallback(word, onDone);
    else if (onDone) onDone();
  };

  try {
    const player = createAudioPlayer({ uri: audioUrl });
    currentPlayer = player;

    // لو ما بدأ التشغيل خلال 1.2 ثانية (شبكة بطيئة أو رابط غير موجود)
    // نرجع لنطق الجهاز فورًا بدل ما يحس المستخدم بأي تعليق
    fallbackTimer = setTimeout(() => finishOnce(true), 1200);

    player.addListener('playbackStatusUpdate', (status) => {
      if (status.playbackState === 'error') {
        finishOnce(true);
        return;
      }
      if (status.didJustFinish) {
        finishOnce(false);
      }
    });

    player.play();
  } catch (e) {
    // الرابط فشل فورًا (مفيش نت، صيغة غلط، إلخ) -> ارجع لنطق الجهاز
    finishOnce(true);
  }
}

export function stopWordAudio() {
  cleanupPlayer();
  if (Speech) { try { Speech.stop(); } catch (e) {} }
}
