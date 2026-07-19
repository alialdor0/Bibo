// utils/haptics.js
// اهتزاز حقيقي مربوط بلحظات اللعب (صح/غلط/فوز...) — بيستخدم Vibration
// المدمجة في React Native نفسها (من غير أي مكتبة إضافية جديدة، فمش هيحتاج
// أي تثبيت أو بناء إضافي). بيتحكم فيه مفتاح "الاهتزاز" بالإعدادات.

import { Vibration, Platform } from 'react-native';

let hapticsEnabled = true;
export function setHapticsEnabled(v) { hapticsEnabled = !!v; }

// أنماط اهتزاز مبسّطة لكل نوع لحظة — أرقام بالميلي ثانية
const PATTERNS = {
  tap:     10,
  correct: 15,
  wrong:   [0, 40, 40, 40],
  win:     [0, 30, 60, 30],
  bigWin:  [0, 40, 60, 40, 60, 60],
  error:   25,
};

/** يشغّل نمط اهتزاز معيّن (أو مدة بسيطة بالميلي ثانية) لو الاهتزاز مفعّل */
export function vibrate(pattern = 'tap') {
  if (!hapticsEnabled) return;
  try {
    const p = typeof pattern === 'string' ? (PATTERNS[pattern] ?? PATTERNS.tap) : pattern;
    if (Platform.OS === 'android' && Array.isArray(p)) {
      Vibration.vibrate(p);
    } else if (Array.isArray(p)) {
      // iOS: مبيدعمش أنماط متعددة زي أندرويد — نستخدم أول قيمة كاهتزاز بسيط
      Vibration.vibrate();
    } else {
      Vibration.vibrate(typeof p === 'number' ? p : undefined);
    }
  } catch (e) {}
}
