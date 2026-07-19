// utils/companion.js
// يتتبع آخر مرة فتح فيها المستخدم التطبيق، عشان بيبو يقدر
// يرحب بيه بشكل مختلف لو رجع بعد غياب طويل، وعشان نحسب "الأيام المتواصلة".
// ملاحظة: ده تخزين محدود لهدف "العيشة مع بيبو" فقط. تخزين باقي
// بيانات المستخدم (الجواهر، القرطاسية، البروفايل) لسه مهمة AsyncStorage
// الشاملة المطلوبة بعد كده.

var AsyncStorage = null;
try { AsyncStorage = require('@react-native-async-storage/async-storage').default; } catch (e) {}

const LAST_SEEN_KEY = 'bibo:lastSeenAt';
const STREAK_KEY     = 'bibo:dayStreak';

// أقل غياب (بالساعات) عشان نعتبره "رجوع بعد غياب" ونظهر رسالة اشتياق
export const COMEBACK_THRESHOLD_HOURS = 20;
// أقل غياب (بالساعات) عشان "الأيام المتواصلة" تتصفّر تلقائيًا — 3 أيام كاملة
export const STREAK_BREAK_HOURS = 72;

async function safeGet(key) {
  if (!AsyncStorage) return null;
  try { return await AsyncStorage.getItem(key); } catch (e) { return null; }
}

async function safeSet(key, val) {
  if (!AsyncStorage) return;
  try { await AsyncStorage.setItem(key, val); } catch (e) {}
}

/**
 * يقرأ آخر وقت دخول محفوظ، يحسب فرق الساعات، ثم يسجّل الوقت الحالي كآخر دخول.
 * freezesAvailable: عدد "تجميدات الحماسة" المملوكة — لو غاب المستخدم 3 أيام وعنده
 * تجميد، بيستهلك تجميد واحد تلقائيًا بدل ما تنكسر السلسلة (freezeUsed=true).
 * يرجع { gapHours, isNewDay, streak, freezeUsed, broke, brokenStreakValue }
 */
export async function touchLastSeen(freezesAvailable = 0) {
  const prevRaw = await safeGet(LAST_SEEN_KEY);
  const now = Date.now();
  let gapHours = 0;
  if (prevRaw) {
    const prev = parseInt(prevRaw, 10);
    if (!isNaN(prev)) gapHours = (now - prev) / (1000 * 60 * 60);
  }

  const isNewDay = gapHours >= COMEBACK_THRESHOLD_HOURS;
  let streak = parseInt((await safeGet(STREAK_KEY)) || '0', 10);
  if (isNaN(streak)) streak = 0;

  let freezeUsed = false;
  let broke = false;
  let brokenStreakValue = 0;

  if (isNewDay) {
    if (gapHours < STREAK_BREAK_HOURS) {
      streak = streak + 1;
    } else if (freezesAvailable > 0) {
      freezeUsed = true;
      streak = streak + 1;
    } else {
      brokenStreakValue = streak;
      broke = streak > 0;
      streak = 0;
    }
  } else if (!prevRaw) {
    streak = 1;
  }

  await safeSet(LAST_SEEN_KEY, String(now));
  await safeSet(STREAK_KEY, String(streak));

  return { gapHours, isNewDay, streak, freezeUsed, broke, brokenStreakValue };
}
