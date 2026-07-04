// utils/storage.js
// طبقة تخزين عامة فوق AsyncStorage — نفس أسلوب الـ require الآمن
// المستخدم في باقي المشروع (expo-speech, expo-notifications) عشان
// الكود مايكسرش في بيئات مفيهاش المكتبة مثبتة.

var AsyncStorage = null;
try { AsyncStorage = require('@react-native-async-storage/async-storage').default; } catch (e) {}

const PREFIX = 'bibo:';

export async function loadJSON(key, fallback = null) {
  if (!AsyncStorage) return fallback;
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export async function saveJSON(key, value) {
  if (!AsyncStorage) return;
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {}
}

export async function removeKeys(keys) {
  if (!AsyncStorage) return;
  try {
    await AsyncStorage.multiRemove(keys.map(k => PREFIX + k));
  } catch (e) {}
}

/** يحمّل عدة مفاتيح مرة واحدة، بيرجع object { key: value } */
export async function loadMany(keysWithDefaults) {
  const entries = await Promise.all(
    Object.entries(keysWithDefaults).map(async ([key, fallback]) => [key, await loadJSON(key, fallback)])
  );
  return Object.fromEntries(entries);
}
