// بنك عبارات بيبو — المرشد الحقيقي للمستخدم
// عبارات احترافية بالفصحى، متنوعة، ومحفزة بدل الرسائل الثابتة المتكررة.

export const BIBO_PHRASES = {
  correct: {
    ar: [
      'أحسنت! كلمة جديدة في رصيدك 🎯',
      'تمامًا! أنت تتحسّن بسرعة 🚀',
      'ممتاز! أنا فخور بك 🌟',
      'صحيح! واصل على هذا المستوى 💪',
      'رائع! ذاكرتك تعمل بسرعة اليوم 🧠',
      'أحسنت! خطوة أخرى أنجزتها 🎬',
      'أحسنت! اقتربت من هدفك بكلمة واحدة 📈',
    ],
    en: [
      'Nailed it! One more word in your arsenal 🎯',
      "That's it! You're picking this up fast 🚀",
      "Excellent! I'm proud of you 🌟",
      "Correct! Keep this momentum going 💪",
      "Great memory today! 🧠",
      "Perfect! One step closer 🎬",
      "Well done! You're closer to your goal 📈",
    ],
  },
  wrong: {
    ar: [
      'قريب جدًا! حاول مرة أخرى 💪',
      'لا بأس، الخطأ جزء من التعلّم 🌱',
      'ابقَ معي، سنعيدها معًا 🔁',
      'كل خبير كان مبتدئًا يومًا ما، واصل 👊',
      'محاولة جيدة! ركّز في النطق وحاول مرة أخرى 🎧',
      'لا بأس، نحن نقترب من الإجابة الصحيحة 🔍',
    ],
    en: [
      'So close! Give it another shot 💪',
      "That's okay — mistakes are part of learning 🌱",
      "Stay with me, let's go through it again 🔁",
      'Every expert started as a beginner, keep going 👊',
      'Good attempt! Listen closely and try again 🎧',
      "No worries, we're getting closer 🔍",
    ],
  },
  streak: {
    ar: [
      'سلسلة إجابات صحيحة متتالية! أداء رائع 🔥',
      'ثلاث إجابات صحيحة متتالية! 🏆',
      'لا شيء يوقفك اليوم! واصل 🔥',
    ],
    en: [
      "You're on a streak! On fire 🔥",
      'Three in a row! Amazing 🏆',
      "Nothing's stopping you today 🔥",
    ],
  },
  levelUp: {
    ar: [
      'ترقية! ارتفع مستواك الآن 🎖️',
      'وصلت إلى مستوى جديد، افتخر بنفسك 🥇',
    ],
    en: [
      "Level up! You've grown 🎖️",
      "New level unlocked, be proud 🥇",
    ],
  },
  episodeComplete: {
    ar: [
      'أنهيت الحلقة كالأبطال! 🎬',
      'إنجاز حقيقي اليوم، أنا فخور بك جدًا 🏅',
    ],
    en: [
      'Episode complete like a true hero! 🎬',
      "Real progress today, I'm so proud of you 🏅",
    ],
  },
  // لما المستخدم يرجع للتطبيق بعد غياب
  comeback: {
    ar: [
      'اشتقت إليك! لنكمل القصة من هنا 🐦',
      'أهلًا بعودتك، القصة كانت في انتظارك 📖',
      'عدت! هيا نتعلّم كلمة جديدة 🎯',
    ],
    en: [
      "I missed you! Let's continue the story 🐦",
      'Welcome back, the story was waiting for you 📖',
      "You're back! Ready for a new word? 🎯",
    ],
  },
  // إشعارات لما المستخدم يتأخر عن الدخول
  reminder: {
    ar: [
      'بيبو في انتظارك 🐦 كلمة واحدة تكفي لنكمل الرحلة!',
      'اشتقنا إليك! تعال نكمل قصتك في بيبو لينجو 📖',
      'أنت جاهز لتعلّم كلمة جديدة اليوم 🧠✨',
      'هل ما زلت تتذكر قصتك؟ لنكملها معًا 🎬',
    ],
    en: [
      'Bibo is waiting 🐦 One word is all it takes to continue!',
      'Missed you! Come back and continue your story 📖',
      'Your brain is ready for a new word today 🧠✨',
      'Remember your story? Let’s continue together 🎬',
    ],
  },
  // تحذير إن السلسلة اليومية (streak) على وشك تنكسر
  streakWarning: {
    ar: [
      'سلسلتك مهدَّدة بالانقطاع! أكمل حلقة اليوم للحفاظ عليها 🔥',
      'بقي وقت قليل قبل أن تفقد سلسلتك. عُد الآن وأكملها! 🔥',
    ],
    en: [
      'Your streak is about to break! Finish an episode today to keep it 🔥',
      'Not much time left before your streak resets. Come back and continue it! 🔥',
    ],
  },
  // آخر تحذير — ساعة أو ساعتين متبقية قبل انقطاع السلسلة
  streakLastChance: {
    ar: [
      'آخر فرصة! سلسلتك ستنقطع خلال ساعات قليلة إن لم تعد الآن ⏳',
    ],
    en: [
      'Last chance! Your streak resets in a few hours unless you come back now ⏳',
    ],
  },
};

// اختيار عبارة عشوائية من فئة معينة بلغة معينة
export function biboSay(category, lang) {
  const bank = BIBO_PHRASES[category];
  if (!bank) return '';
  const list = bank[lang] || bank.ar;
  return list[Math.floor(Math.random() * list.length)];
}
