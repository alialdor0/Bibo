// utils/episodeAudio.js
// تشغيل نطق الكلمة: أولوية للملف الصوتي المسجَّل (audio_url) من الحلقة،
// ولو حصل خطأ (مفيش نت، الرابط واقع، الملف مش موجود) نرجع تلقائيًا
// لنطق الجهاز (expo-speech) بنفس أسلوب Story.js الحالي.

var AVAudio = null;
try { AVAudio = require('expo-av').Audio; } catch (e) {}

var Speech = null;
try { Speech = require('expo-speech'); } catch (e) {}

function speakFallback(word, onDone) {
  if (Speech) {
    Speech.stop();
    Speech.speak(word, { language: 'en-US', pitch: 1.0, rate: 0.85, onDone: onDone || (() => {}) });
  } else if (onDone) onDone();
}

let currentWordSound = null;

/**
 * ينطق كلمة الحلقة: يجرب audio_url الأول، ولو فشل (تحميل أو تشغيل)
 * يرجع تلقائيًا لنطق الجهاز بنفس النص.
 */
export async function speakWord(word, audioUrl, onDone) {
  if (currentWordSound) {
    try { await currentWordSound.unloadAsync(); } catch (e) {}
    currentWordSound = null;
  }

  if (!AVAudio || !audioUrl) {
    speakFallback(word, onDone);
    return;
  }

  try {
    const { sound } = await AVAudio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: true, volume: 1.0 });
    currentWordSound = sound;
    let finished = false;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish && !finished) {
        finished = true;
        sound.unloadAsync();
        if (currentWordSound === sound) currentWordSound = null;
        if (onDone) onDone();
      }
      if (status.error) {
        if (!finished) { finished = true; speakFallback(word, onDone); }
      }
    });
  } catch (e) {
    // الرابط فشل (مفيش نت، 404، إلخ) -> ارجع لنطق الجهاز
    speakFallback(word, onDone);
  }
}

export async function stopWordAudio() {
  if (currentWordSound) {
    try { await currentWordSound.unloadAsync(); } catch (e) {}
    currentWordSound = null;
  }
  if (Speech) { try { Speech.stop(); } catch (e) {} }
}
