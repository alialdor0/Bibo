// utils/authCode.js
// ─────────────────────────────────────────────────────────────
// نظام "الدخول بكود": بديل محلي بسيط لتسجيل الدخول بدل حسابات
// Apple/Google. كل مستخدم يحصل على كود فريد (مثال: BIBO-7F3K-Q9XZ)
// مربوط بحسابه. يقدر ينسخه ويحتفظ فيه، ولو سجّل خروج أو مسح بيانات
// التطبيق ورجع لاحقًا، يقدر يكتب/يلصق نفس الكود ليسترجع حسابه.
//
// ملاحظة مهمة: التطبيق حاليًا بدون سيرفر خلفي (كل البيانات محفوظة
// محليًا عبر AsyncStorage) — لذلك الكود يسترجع الحساب على نفس
// الجهاز فقط. لمزامنة حقيقية بين أجهزة مختلفة يلزم إضافة سيرفر/قاعدة
// بيانات سحابية لاحقًا.
// ─────────────────────────────────────────────────────────────

import { loadJSON, saveJSON } from './storage';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بدون أحرف/أرقام ملتبسة زي O/0 و I/1

function randomSegment(len) {
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return out;
}

/** يولّد كود دخول جديد فريد الشكل، مثال: BIBO-7F3K-Q9XZ */
export function generateLoginCode() {
  return `BIBO-${randomSegment(4)}-${randomSegment(4)}`;
}

/** ينظّف/يوحّد شكل الكود اللي المستخدم كتبه أو لصقه (مسافات، حروف صغيرة...) */
export function normalizeCode(raw) {
  return (raw || '').trim().toUpperCase().replace(/\s+/g, '');
}

/** يحفظ نسخة كاملة من بيانات الحساب مربوطة بالكود — تُستخدم وقت تسجيل الخروج */
export async function saveAccountSnapshot(code, snapshot) {
  if (!code) return;
  const vault = (await loadJSON('accountVault', {})) || {};
  vault[code] = { ...snapshot, savedAt: Date.now() };
  await saveJSON('accountVault', vault);
}

/** يرجّع نسخة حساب محفوظة بكود معيّن (أو null لو الكود مش موجود) */
export async function getAccountSnapshot(code) {
  const vault = (await loadJSON('accountVault', {})) || {};
  return vault[normalizeCode(code)] || null;
}
