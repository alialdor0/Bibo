// utils/sfx.js
// مؤثرات صوتية عامة للتطبيق (منفصلة عن صوت بيبو نفسه في utils/sounds.js):
// فوز، خسارة، صح، غلط، تقليب صفحة، كتابة، ممحاة، وأصوات إنقاذ الكلمات،
// بالإضافة لمؤثرات احتفالية أطول (شارات، هدايا، شراء، فوز كبير...).
//
// ملاحظة: rescueStart / rescueSuccess اللي كانت مطلوبة هنا سابقًا وصلت فعليًا
// كملفات طويلة (٧٤-٩٣ ثانية) — طول ده أنسب لموسيقى خلفية مو مؤثر لحظي، فتم
// استخدامها في utils/ambientMusic.js بدل ما تتحط هنا. راجع ذلك الملف.

const USE_SFX = true;

// حالة تفعيل المؤثرات الصوتية — بيتحكم فيها مفتاح "المؤثرات الصوتية" بالإعدادات
// (عبر setSfxEnabled)، بدل ما يكون مجرد مفتاح شكلي مالوش تأثير فعلي.
let sfxEnabled = true;
export function setSfxEnabled(v) { sfxEnabled = !!v; }

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
  // مؤثرات إضافية (مقدَّمة من علي) — للحظات احتفالية غير متكررة، أطول شوية من
  // مؤثرات اللمسة السريعة اللي فوق، فمش بتتستخدم في كل إجابة صح/غلط
  badgeUnlock:      require('../assets/sfx/badgeUnlock.mp3'),
  giftOpen:         require('../assets/sfx/giftOpen.mp3'),
  purchase:         require('../assets/sfx/purchase.mp3'),
  bigWin:           require('../assets/sfx/bigWin.mp3'),
  coopWin:          require('../assets/sfx/coopWin.mp3'),
  duelStart:        require('../assets/sfx/duelStart.mp3'),
  rescueGameStart:  require('../assets/sfx/rescueGameStart.mp3'),
  mischief:         require('../assets/sfx/mischief.mp3'),
  collect:          require('../assets/sfx/collect.mp3'),
  levelUp:          require('../assets/sfx/levelUp.mp3'),
  gameOver:         require('../assets/sfx/gameOver.mp3'),
};

/**
 * يشغّل مؤثر صوتي واحد. المؤثرات القصيرة ممكن تتشغل فوق بعض (زي صوت
 * الكتابة اللي بيتكرر بسرعة) فمفيش instance واحد مشترك، كل نطقة تاخذ
 * مشغّل خاص فيها ويتحرر لما يخلص.
 */
export function playSfx(key) {
  if (!USE_SFX || !sfxEnabled || !createAudioPlayer) return;
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
