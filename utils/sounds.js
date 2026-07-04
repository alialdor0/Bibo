// utils/sounds.js
// تشغيل أصوات بيبو المرتبطة بكل حالة من حالاته السبع.
// الأصوات مفعّلة دلوقتي من assets/sounds/*.mp3.
const USE_SOUNDS = true;

var Audio = null;
try { Audio = require('expo-av').Audio; } catch (e) {}

const SOUND_FILES = {
  welcome:   require('../assets/sounds/welcome.mp3'),
  celebrate: require('../assets/sounds/celebrate.mp3'),
  attention: require('../assets/sounds/attention.mp3'),
  encourage: require('../assets/sounds/encourage.mp3'),
  sleep:     require('../assets/sounds/sleep.mp3'),
  thinking:  require('../assets/sounds/thinking.mp3'),
  idea:      require('../assets/sounds/idea.mp3'),
};

let activeSound = null;

export async function prepareAudioMode() {
  if (!Audio) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (e) {}
}

/** يشغّل صوت بيبو لحالة معينة (welcome, celebrate, attention, ...) */
export async function playBiboSound(state) {
  if (!USE_SOUNDS || !Audio) return;
  const file = SOUND_FILES[state];
  if (!file) return;

  try {
    if (activeSound) {
      await activeSound.unloadAsync();
      activeSound = null;
    }
    const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: true, volume: 0.85 });
    activeSound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        if (activeSound === sound) activeSound = null;
      }
    });
  } catch (e) {}
}

export async function stopBiboSound() {
  if (!activeSound) return;
  try { await activeSound.unloadAsync(); } catch (e) {}
  activeSound = null;
}
