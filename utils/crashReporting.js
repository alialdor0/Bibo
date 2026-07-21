// utils/crashReporting.js
//
// غلاف آمن حول Sentry — لو الـ DSN مش متحطوط (utils/sentryConfig.js) أو حصلت
// أي مشكلة غير متوقعة بالتهيئة، التطبيق بيكمّل شغله عادي تمامًا من غير ما
// تتبّع الأعطال يعطّل أي حاجة. راجع utils/sentryConfig.js لخطوات التفعيل.

import { SENTRY_DSN, SENTRY_ENVIRONMENT } from './sentryConfig';

let Sentry = null;
try { Sentry = require('@sentry/react-native'); } catch (e) {}

let initialized = false;

/** بتتنادى مرة واحدة بس عند فتح التطبيق (من App.js) */
export function initCrashReporting() {
  if (!Sentry || !SENTRY_DSN || initialized) return;
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      // نسبة بسيطة من قياسات الأداء (مش كل الأخطاء) — كافية لصورة عامة
      // من غير ما تستهلك الحصة الشهرية المجانية بسرعة
      tracesSampleRate: 0.2,
      enableAutoSessionTracking: true,
    });
    initialized = true;
  } catch (e) {}
}

/** بيبعت خطأ لسنتري يدويًا — بتُستخدم من ErrorBoundary لما خطأ يكسر شاشة كاملة */
export function reportError(error, extraContext) {
  if (!Sentry || !initialized) return;
  try {
    Sentry.captureException(error, extraContext ? { extra: extraContext } : undefined);
  } catch (e) {}
}
