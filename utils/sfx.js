// utils/sfx.js
// مؤثرات صوتية عامة للتطبيق (منفصلة عن صوت بيبو نفسه في utils/sounds.js):
// فوز، خسارة، صح، غلط، تقليب صفحة، كتابة، ممحاة، وأصوات إنقاذ الكلمات.
//
// ─────────────────────────────────────────────────────────────
// لما الملفات توصل، حطهم في assets/sfx/ بالأسماء دي بالظبط:
// win.mp3, lose.mp3, correct.mp3, wrong.mp3,
// pageTurn.mp3, writing.mp3, eraser.mp3,
// rescueStart.mp3 (صفارة إنذار خفيفة), rescueSuccess.mp3 (تنفس الصعداء)
//
// ملاحظة: rescueStart.mp3 و rescueSuccess.mp3 لسه مش مرفوعين بالريبو،
// فتم إيقافهم مؤقتًا (require() بتفشل بناء التطبيق كله لو الملف مش موجود
// فعليًا على القرص، حتى لو محاط بـ try/catch — الفشل بيصير وقت البناء
// مش وقت التشغيل). لما ترفع الملفين، رجّع السطرين المعلّقين تحت.
// ─────────────────────────────────────────────────────────────
const USE_SFX = true;

var createAudioPlayer = null;
try { createAudioPlayer = require('expo-audio').createAudioPlayer; } catch (e) {}

const SFX_FILES = {
  win:            require('../assets/sfx/win.mp3'),
  lose:           require('../assets/sfx/lose.mp3'),
  correct:        require('../assets/sfx/correct.mp3'),
  wrong:          require('../assets/sfx/wrong.mp3'),
  pageTurn:       require('../assets/sfx/pageTurn.mp3'),
  writing:        require('../assets/sfx/writing.mp3'),
  eraser:         require('../assets/sfx/eraser.mp3'),
  // rescueStart:    require('../assets/sfx/rescueStart.mp3'),
  // rescueSuccess:  require('../assets/sfx/rescueSuccess.mp3'),
};

/**
 * يشغّل مؤثر صوتي واحد. المؤثرات القصيرة ممكن تتشغل فوق بعض (زي صوت
 * الكتابة اللي بيتكرر بسرعة) فمفيش instance واحد مشترك، كل نطقة تاخذ
 * مشغّل خاص فيها ويتحرر لما يخلص.
 */
export function playSfx(key) {
  if (!USE_SFX || !createAudioPlayer) return;
  const file = SFX_FILES[key];
  if (!file) return;

  try {
    const player = createAudioPlayer(file);
    player.volume = 0.7;
    player.play();
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        try { player.release(); } catch (e) {}
      }
    });
  } catch (e) {}
}
