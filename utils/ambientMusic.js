// utils/ambientMusic.js
// موسيقى خلفية هادئة أثناء اللعب — مقطع مختلف لكل مسار قصة (Spy/Love/Family/
// Crime/Medical)، بالإضافة لمقطعين خاصين بوضع الإنقاذ (بداية/نجاح). كل
// المقاطع دي طويلة (٢٧-٩٣ ثانية) فهي مناسبة كخلفية متكررة (loop) مش كمؤثر
// لحظي — لهذا هي منفصلة عن utils/sfx.js.
//
// بتحترم نفس مفتاح "المؤثرات الصوتية" بالإعدادات زي utils/sfx.js
// (عبر setAmbientEnabled)، وبتهدأ صوتها تدريجيًا (fade) بدل ما توقف فجأة.

var createAudioPlayer = null;
try { createAudioPlayer = require('expo-audio').createAudioPlayer; } catch (e) {}

const TRACK_FILES = {
  spy:     require('../assets/ambient/spy.mp3'),
  love:    require('../assets/ambient/love.mp3'),
  family:  require('../assets/ambient/family.mp3'),
  crime:   require('../assets/ambient/crime.mp3'),
  medical: require('../assets/ambient/medical.mp3'),
};

const MOOD_FILES = {
  rescueStart:   require('../assets/ambient/rescueStart.mp3'),
  rescueSuccess: require('../assets/ambient/rescueSuccess.mp3'),
};

let ambientEnabled = true;
export function setAmbientEnabled(v) {
  ambientEnabled = !!v;
  if (!ambientEnabled) stopAmbient();
}

let activePlayer = null;
let activeListener = null;
let activeKey = null;
let fadeTimer = null;

function clearFade() {
  if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
}

function stopImmediately() {
  clearFade();
  if (activeListener) { try { activeListener.remove(); } catch (e) {} }
  if (activePlayer) { try { activePlayer.remove(); } catch (e) {} }
  activePlayer = null;
  activeListener = null;
  activeKey = null;
}

/** يشغّل موسيقى مسار قصة معيّن (spy/love/family/crime/medical) بشكل متكرر (loop) */
export function playTrackAmbient(trackId) {
  _play(TRACK_FILES[trackId], `track:${trackId}`, 0.28);
}

/** يشغّل مقطع مزاج معيّن (rescueStart / rescueSuccess) بشكل متكرر أثناء وضع الإنقاذ */
export function playMoodAmbient(key) {
  _play(MOOD_FILES[key], `mood:${key}`, 0.24);
}

function _play(file, key, volume) {
  if (!createAudioPlayer || !ambientEnabled || !file) return;
  if (activeKey === key) return; // نفس المقطع شغّال أصلًا، متعملش إعادة تشغيل
  stopImmediately();
  try {
    const player = createAudioPlayer(file);
    player.loop = true;
    player.volume = volume;
    activePlayer = player;
    activeKey = key;
    player.play();
  } catch (e) {}
}

/** يوقف الموسيقى الخلفية الحالية تدريجيًا (fade out) بدل وقف فجائي */
export function stopAmbient() {
  if (!activePlayer) return;
  clearFade();
  const player = activePlayer;
  let vol = player.volume ?? 0.28;
  fadeTimer = setInterval(() => {
    vol -= 0.04;
    if (vol <= 0) {
      stopImmediately();
    } else {
      try { player.volume = vol; } catch (e) { stopImmediately(); }
    }
  }, 80);
}
