// utils/companion.js
// يتتبع آخر مرة فتح فيها المستخدم التطبيق، عشان بيبو يقدر
// يرحب بيه بشكل مختلف لو رجع بعد غياب طويل.
// ملاحظة: ده تخزين محدود لهدف "العيشة مع بيبو" فقط. تخزين باقي
// بيانات المستخدم (الجواهر، القرطاسية، البروفايل) لسه مهمة AsyncStorage
// الشاملة المطلوبة بعد كده.

var AsyncStorage = null;
try { AsyncStorage = require('@react-native-async-storage/async-storage').default; } catch (e) {}

const LAST_SEEN_KEY = 'bibo:lastSeenAt';
const STREAK_KEY     = 'bibo:dayStreak';

// أقل غياب (بالساعات) عشان نعتبره "رجوع بعد غياب" ونظهر رسالة اشتياق
export const COMEBACK_THRESHOLD_HOURS = 20;

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
 * يرجع { gapHours, isNewDay, streak }
 */
export async function touchLastSeen() {
  const prevRaw = await safeGet(LAST_SEEN_KEY);
  const now = Date.now();
  let gapHours = 0;
  if (prevRaw) {
    const prev = parseInt(prevRaw, 10);
    if (!isNaN(prev)) gapHours = (now - prev) / (1000 * 60 * 60);
  }

  const isNewDay = gapHours >= 20; // اعتبرها يوم جديد لو غاب ٢٠ ساعة أو أكتر
  let streak = parseInt((await safeGet(STREAK_KEY)) || '0', 10);
  if (isNaN(streak)) streak = 0;

  if (isNewDay) {
    streak = gapHours <= 48 ? streak + 1 : 1; // لو رجع خلال يومين كمل السلسلة، غير كده ابدأ من جديد
  } else if (!prevRaw) {
    streak = 1;
  }

  await safeSet(LAST_SEEN_KEY, String(now));
  await safeSet(STREAK_KEY, String(streak));

  return { gapHours, isNewDay, streak };
}
