// utils/sounds.js
// تشغيل أصوات بيبو المرتبطة بكل حالة من حالاته السبع.
// الأصوات مفعّلة دلوقتي من assets/sounds/*.mp3.
const USE_SOUNDS = true;

// expo-av اتلغى (deprecated) واتستبدل بـ expo-audio بداية من SDK 52+.
var createAudioPlayer = null;
var setAudioModeAsync = null;
try {
  const audioModule = require('expo-audio');
  createAudioPlayer = audioModule.createAudioPlayer;
  setAudioModeAsync = audioModule.setAudioModeAsync;
} catch (e) {}

const SOUND_FILES = {
  welcome:   require('../assets/sounds/welcome.mp3'),
  celebrate: require('../assets/sounds/celebrate.mp3'),
  attention: require('../assets/sounds/attention.mp3'),
  encourage: require('../assets/sounds/encourage.mp3'),
  sleep:     require('../assets/sounds/sleep.mp3'),
  thinking:  require('../assets/sounds/thinking.mp3'),
  idea:      require('../assets/sounds/idea.mp3'),
};

let activePlayer = null;
let activeListener = null;

export async function prepareAudioMode() {
  if (!setAudioModeAsync) return;
  try {
    // أسماء الخيارات اتغيّرت في expo-audio (مفيش iOS/Android لواحق منفصلة).
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    });
  } catch (e) {}
}

/** يشغّل صوت بيبو لحالة معينة (welcome, celebrate, attention, ...) */
export async function playBiboSound(state) {
  if (!USE_SOUNDS || !createAudioPlayer) return;
  const file = SOUND_FILES[state];
  if (!file) return;

  try {
    if (activePlayer) {
      if (activeListener) activeListener.remove();
      activePlayer.remove();
      activePlayer = null;
      activeListener = null;
    }
    const player = createAudioPlayer(file);
    player.volume = 0.85;
    activePlayer = player;
    activeListener = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        player.remove();
        if (activePlayer === player) {
          activePlayer = null;
          activeListener = null;
        }
      }
    });
    player.play();
  } catch (e) {}
}

export async function stopBiboSound() {
  if (!activePlayer) return;
  try {
    if (activeListener) activeListener.remove();
    activePlayer.remove();
  } catch (e) {}
  activePlayer = null;
  activeListener = null;
}
