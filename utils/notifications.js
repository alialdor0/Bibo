// utils/notifications.js
// إشعارات "بيبو مستناك" لما المستخدم يتأخر عن الدخول للتطبيق.
// نفس أسلوب require الآمن المستخدم مع expo-speech في Story.js.

import { Platform } from 'react-native';
import { biboSay } from '../data/biboPhrases';

var Notifications = null;
try { Notifications = require('expo-notifications'); } catch (e) {}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission() {
  if (!Notifications) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    return false;
  }
}

/** يلغي أي تذكيرات "بيبو مستناك" مجدولة قبل كده، عشان منكررش الإشعارات */
export async function cancelBiboReminders() {
  if (!Notifications) return;
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch (e) {}
}

/**
 * يجدول إشعار تذكير بعد `hoursDelay` ساعة من عدم الدخول للتطبيق.
 * بيتنادى كل مرة التطبيق يتفتح، وبيلغي أي جدولة قديمة أول حاجة.
 */
export async function scheduleBiboReminder(lang, hoursDelay = 20) {
  if (!Notifications) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await cancelBiboReminders();

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: lang === 'ar' ? 'بيبو 🐦' : 'Bibo 🐦',
        body: biboSay('reminder', lang),
        // صوت الإشعار المخصص مبندل عبر plugin الـ expo-notifications في app.json.
        // ملحوظة: صوت مخصص للإشعارات محتاج custom dev build (EAS Build / expo prebuild)
        // ومش شغال في Expo Go العادي — هيرجع للصوت الافتراضي في Expo Go تلقائيًا.
        sound: Platform.OS === 'ios' ? 'notification.mp3' : 'notification',
      },
      trigger: { seconds: Math.max(60, Math.round(hoursDelay * 60 * 60)) },
    });
  } catch (e) {}
}
