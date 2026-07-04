// utils/episodeAudio.js
// تشغيل نطق الكلمة: أولوية للملف الصوتي المسجَّل (audio_url) من الحلقة،
// ولو حصل خطأ (مفيش نت، الرابط واقع، الملف مش موجود) نرجع تلقائيًا
// لنطق الجهاز (expo-speech) بنفس أسلوب Story.js الحالي.

// expo-av اتلغى (deprecated) واتستبدل بـ expo-audio بداية من SDK 52+.
var createAudioPlayer = null;
try { ({ createAudioPlayer } = require('expo-audio')); } catch (e) {}

var Speech = null;
try { Speech = require('expo-speech'); } catch (e) {}

function speakFallback(word, onDone) {
  if (Speech) {
    Speech.stop();
    Speech.speak(word, { language: 'en-US', pitch: 1.0, rate: 0.85, onDone: onDone || (() => {}) });
  } else if (onDone) onDone();
}

let currentPlayer = null;
let currentListener = null;

function releaseCurrentPlayer() {
  if (currentPlayer) {
    try {
      if (currentListener) currentListener.remove();
      currentPlayer.remove();
    } catch (e) {}
  }
  currentPlayer = null;
  currentListener = null;
}

/**
 * ينطق كلمة الحلقة: يجرب audio_url الأول، ولو فشل (تحميل أو تشغيل)
 * يرجع تلقائيًا لنطق الجهاز بنفس النص.
 */
export async function speakWord(word, audioUrl, onDone) {
  releaseCurrentPlayer();

  if (!createAudioPlayer || !audioUrl) {
    speakFallback(word, onDone);
    return;
  }

  try {
    const player = createAudioPlayer({ uri: audioUrl });
    player.volume = 1.0;
    currentPlayer = player;
    let finished = false;

    const listener = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish && !finished) {
        finished = true;
        listener.remove();
        player.remove();
        if (currentPlayer === player) { currentPlayer = null; currentListener = null; }
        if (onDone) onDone();
      }
      if (status.error && !finished) {
        finished = true;
        listener.remove();
        player.remove();
        if (currentPlayer === player) { currentPlayer = null; currentListener = null; }
        speakFallback(word, onDone);
      }
    });
    currentListener = listener;
    player.play();
  } catch (e) {
    // الرابط فشل (مفيش نت، 404، إلخ) -> ارجع لنطق الجهاز
    speakFallback(word, onDone);
  }
}

export async function stopWordAudio() {
  releaseCurrentPlayer();
  if (Speech) { try { Speech.stop(); } catch (e) {} }
}
