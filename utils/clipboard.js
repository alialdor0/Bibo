// utils/clipboard.js
// نسخ نص للحافظة (زر "نسخ الكود") — نفس أسلوب الـ require الآمن المستخدم
// في باقي المشروع، عشان الكود مايكسرش لو المكتبة مش متثبتة بعد.
// يلزم تشغيل: npx expo install expo-clipboard

var Clipboard = null;
try { Clipboard = require('expo-clipboard'); } catch (e) {}

export async function copyToClipboard(text) {
  if (Clipboard && Clipboard.setStringAsync) {
    try {
      await Clipboard.setStringAsync(text);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}
