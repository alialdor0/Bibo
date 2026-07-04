// utils/sfx.js
// مؤثرات صوتية عامة للتطبيق (منفصلة عن صوت بيبو نفسه في utils/sounds.js):
// فوز، خسارة، صح، غلط، تقليب صفحة، كتابة، ممحاة.
//
// ─────────────────────────────────────────────────────────────
// لما الملفات توصل، حطهم في assets/sfx/ بالأسماء دي بالظبط:
// win.mp3, lose.mp3, correct.mp3, wrong.mp3,
// pageTurn.mp3, writing.mp3, eraser.mp3
// بعد كده غيّر USE_SFX لـ true وشيل التعليق عن الأسطر جوه SFX_FILES.
// ─────────────────────────────────────────────────────────────
const USE_SFX = true;

var Audio = null;
try { Audio = require('expo-av').Audio; } catch (e) {}

const SFX_FILES = {
  win:       require('../assets/sfx/win.mp3'),
  lose:      require('../assets/sfx/lose.mp3'),
  correct:   require('../assets/sfx/correct.mp3'),
  wrong:     require('../assets/sfx/wrong.mp3'),
  pageTurn:  require('../assets/sfx/pageTurn.mp3'),
  writing:   require('../assets/sfx/writing.mp3'),
  eraser:    require('../assets/sfx/eraser.mp3'),
};

/**
 * يشغّل مؤثر صوتي واحد. المؤثرات القصيرة ممكن تتشغل فوق بعض (زي صوت
 * الكتابة اللي بيتكرر بسرعة) فمفيش instance واحد مشترك زي صوت بيبو.
 */
export async function playSfx(key) {
  if (!USE_SFX || !Audio) return;
  const file = SFX_FILES[key];
  if (!file) return;

  try {
    const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: true, volume: 0.7 });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) {}
}
