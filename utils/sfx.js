// utils/sfx.js
// مؤثرات صوتية عامة للتطبيق (منفصلة عن صوت بيبو نفسه في utils/sounds.js):
// فوز، خسارة، صح، غلط، تقليب صفحة، كتابة، ممحاة، وأصوات إنقاذ الكلمات،
// بالإضافة لمؤثرات احتفالية أطول (شارات، هدايا، شراء، فوز كبير...).
//
// ملاحظة: rescueStart / rescueSuccess اللي كانت مطلوبة هنا سابقًا وصلت فعليًا
// كملفات طويلة (٧٤-٩٣ ثانية) — طول ده أنسب لموسيقى خلفية مو مؤثر لحظي، فتم
// استخدامها في utils/ambientMusic.js بدل ما تتحط هنا. راجع ذلك الملف.

import { vibrate } from './haptics';

const USE_SFX = true;

// حالة تفعيل المؤثرات الصوتية — بيتحكم فيها مفتاح "المؤثرات الصوتية" بالإعدادات
// (عبر setSfxEnabled)، بدل ما يكون مجرد مفتاح شكلي مالوش تأثير فعلي.
let sfxEnabled = true;
export function setSfxEnabled(v) { sfxEnabled = !!v; }

var createAudioPlayer = null;
try { createAudioPlayer = require('expo-audio').createAudioPlayer; } catch (e) {}

var duckAmbient = null;
try { duckAmbient = require('./ambientMusic').duckAmbient; } catch (e) {}

// كل مفتاح مؤثر مربوط بنمط اهتزاز مناسب — بيشتغلوا مع بعض في نفس اللحظة
const HAPTIC_MAP = {
  correct: 'correct', win: 'win', bigWin: 'bigWin', coopWin: 'bigWin',
  wrong: 'wrong', lose: 'wrong', gameOver: 'wrong',
  badgeUnlock: 'bigWin', giftOpen: 'win', levelUp: 'bigWin', purchase: 'correct',
};

const SFX_FILES = {
  win:            require('../assets/sfx/win.mp3'),
  lose:           require('../assets/sfx/lose.mp3'),
  correct:        require('../assets/sfx/correct.mp3'),
  wrong:          require('../assets/sfx/wrong.mp3'),
  pageTurn:       require('../assets/sfx/pageTurn.mp3'),
  writing:        require('../assets/sfx/writing.mp3'),
  eraser:         require('../assets/sfx/eraser.mp3'),
  // مؤثرات إضافية (مقدَّمة من علي) — للحظات احتفالية غير متكررة، أطول شوية من
  // مؤثرات اللمسة السريعة اللي فوق
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

// المؤثرات القصيرة جدًا (أقل من ثانية) بتفضل تتشغل فورًا وممكن تتراكب —
// ده الإحساس المطلوب لصح/غلط/كتابة المتلاحقين بسرعة.
const INSTANT_KEYS = new Set(['win', 'lose', 'correct', 'wrong', 'pageTurn', 'writing', 'eraser']);

// المؤثرات الاحتفالية الأطول (لحظات إنجاز) — بترتفع فوق الموسيقى الخلفية
// (ducking) وبتتصف في طابور بدل ما تتراكب فوق بعض لو اتنين استُدعوا قريب من بعض
const CELEBRATION_KEYS = new Set(['badgeUnlock', 'giftOpen', 'purchase', 'bigWin', 'coopWin', 'levelUp']);

const FADE_MS = 220; // مدة تدرّج خفض الصوت في آخر كل مقطوعة، لانتقال سلس بدل قطع فجائي
const FADE_STEPS = 8;

/** يخفّت صوت مشغّل تدريجيًا لحد ما يوصل صفر، بدل وقف فجائي، ثم يحرره */
function fadeOutAndRelease(player, fromVolume) {
  let step = 0;
  const interval = setInterval(() => {
    step += 1;
    const v = Math.max(0, fromVolume * (1 - step / FADE_STEPS));
    try { player.volume = v; } catch (e) { clearInterval(interval); return; }
    if (step >= FADE_STEPS) {
      clearInterval(interval);
      try { player.release(); } catch (e) {}
    }
  }, FADE_MS / FADE_STEPS);
}

function playOnce(key, volume) {
  const file = SFX_FILES[key];
  if (!file || !createAudioPlayer) return null;
  try {
    const player = createAudioPlayer(file);
    player.volume = volume;
    player.play();
    let faded = false;
    const startFade = () => {
      if (faded) return;
      faded = true;
      fadeOutAndRelease(player, volume);
    };
    player.addListener('playbackStatusUpdate', (status) => {
      // نبدأ التدرّج قبل النهاية الفعلية بـ FADE_MS عشان يخلص بالظبط لحظة انتهاء المقطوعة (انتقال سلس بدل قطع)
      if (status.duration && status.currentTime != null && (status.duration - status.currentTime) * 1000 <= FADE_MS) {
        startFade();
      } else if (status.didJustFinish) {
        startFade();
      }
    });
    return player;
  } catch (e) {
    return null;
  }
}

// طابور تشغيل للمؤثرات الاحتفالية — يمنع تراكب اتنين مؤثرات طويلة فوق بعض
// (زي فتح هدية فوق فتح شارة في نفس اللحظة) بترتيبهم زمنيًا بدل ما يتلخبطوا
let celebrationQueue = Promise.resolve();

function queueCelebration(key) {
  celebrationQueue = celebrationQueue.then(() => new Promise((resolve) => {
    if (duckAmbient) duckAmbient(0.35, 900); // المؤثر يعلو فوق الموسيقى الخلفية لحظة الإنجاز
    const player = playOnce(key, 0.9); // مستوى أعلى من العادي (0.7) عشان يبقى واضح فوق الموسيقى
    if (!player) { resolve(); return; }
    let resolved = false;
    const finish = () => { if (!resolved) { resolved = true; resolve(); } };
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) setTimeout(finish, FADE_MS + 40);
    });
    // شبكة أمان لو الحدث ما اتطلقش لأي سبب — منسمحش للطابور يتوقف
    setTimeout(finish, 6000);
  }));
}

/**
 * يشغّل مؤثر صوتي واحد. المؤثرات القصيرة (INSTANT_KEYS) بتتشغل فورًا وممكن
 * تتراكب، أما المؤثرات الاحتفالية الأطول فبتتصف بالدور (queue) وبترفع فوق
 * الموسيقى الخلفية، وكلهم بيتخافتوا بتدرّج ناعم في الآخر بدل ما يتقطعوا فجأة.
 */
export function playSfx(key) {
  if (!USE_SFX || !sfxEnabled) return;
  if (!SFX_FILES[key]) return;

  if (HAPTIC_MAP[key]) vibrate(HAPTIC_MAP[key]);

  if (CELEBRATION_KEYS.has(key)) {
    queueCelebration(key);
    return;
  }
  playOnce(key, 0.7);
}
