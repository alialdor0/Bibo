// بنك عبارات بيبو — المرشد الحقيقي للمستخدم
// عبارات احترافية، متنوعة، ومحفزة بدل الرسائل الثابتة المتكررة.

export const BIBO_PHRASES = {
  correct: {
    ar: [
      'أحسنت! كلمة جديدة في رصيدك 🎯',
      'بالظبط كده! أنت بتتحسن بسرعة 🚀',
      'ممتاز! فخور بيك 🌟',
      'صح! استمر على نفس المستوى 💪',
      'رائع! دماغك بتحفظ بسرعة اليومين دول 🧠',
      'تمام كده! خطوة كمان جتك 🎬',
      'برافو! أنت أقرب لهدفك بكلمة 📈',
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
      'قريب جدًا! جرّب تاني 💪',
      'مش مشكلة، الغلط جزء من التعلم 🌱',
      'خليك معايا، هنعيدها سوا 🔁',
      'كل خبير كان مبتدئ يوم من الأيام، كمّل 👊',
      'محاولة كويسة! ركّز في النطق وجرّب تاني 🎧',
      'ولا يهمك، بنقرب من الإجابة الصح 🔍',
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
      'سلسلة إجابات صح متتالية! أنت في نار 🔥',
      'ماشاء الله! ٣ صح ورا بعض 🏆',
      'مفيش وقف عندك! كمّل كده 🔥',
    ],
    en: [
      "You're on a streak! On fire 🔥",
      'Three in a row! Amazing 🏆',
      "Nothing's stopping you today 🔥",
    ],
  },
  levelUp: {
    ar: [
      'ترقية! مستواك بقى أعلى دلوقتي 🎖️',
      'وصلت لمستوى جديد، افتخر بنفسك 🥇',
    ],
    en: [
      "Level up! You've grown 🎖️",
      "New level unlocked, be proud 🥇",
    ],
  },
  episodeComplete: {
    ar: [
      'خلصت الحلقة زي الأبطال! 🎬',
      'إنجاز حقيقي النهارده، فخور بيك جدًا 🏅',
    ],
    en: [
      'Episode complete like a true hero! 🎬',
      "Real progress today, I'm so proud of you 🏅",
    ],
  },
  // لما المستخدم يرجع للتطبيق بعد غياب
  comeback: {
    ar: [
      'وحشتني! يلا نكمل الحكاية من هنا 🐦',
      'أهلاً بعودتك، القصة استنتك 📖',
      'رجعت! دماغك مستنية كلمة جديدة 🎯',
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
      'بيبو مستناك 🐦 كلمة واحدة تكفي عشان نكمل الرحلة!',
      'مشتاقلك! تعال نكمل حكايتك في بيبو لينجو 📖',
      'دماغك جاهزة لكلمة جديدة النهارده 🧠✨',
      'لسه فاكر قصتك؟ يلا نكمل سوا 🎬',
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
      'سلسلتك المتواصلة معرّضة للانقطاع قريبًا! أكمل حلقة اليوم للمحافظة عليها 🔥',
      'باقي وقت قليل قبل ما تفقد سلسلتك المتواصلة. عد الآن وأكملها! 🔥',
    ],
    en: [
      'Your streak is about to break! Finish an episode today to keep it 🔥',
      'Not much time left before your streak resets. Come back and continue it! 🔥',
    ],
  },
  // آخر تحذير — ساعة أو ساعتين متبقية قبل انقطاع السلسلة
  streakLastChance: {
    ar: [
      'آخر فرصة! سلسلتك المتواصلة ستنقطع خلال ساعات قليلة إن لم تعد الآن ⏳',
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
