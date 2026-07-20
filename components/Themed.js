// components/Themed.js
//
// طبقة تفعيل حجم الخط والوضع الليلي/النهاري على مستوى التطبيق كله دفعة واحدة،
// من غير ما نحتاج نلمس مئات الـ StyleSheet المبعثرة بكل شاشة يدويًا.
//
// الفكرة: بدل ما نضيف useApp() ونحسب الألوان يدويًا بكل شاشة، بنلف شجرة الـ JSX
// اللي الشاشة نفسها كاتباها بمكوّن <ThemedSafeArea> (بديل مباشر لـ SafeAreaView)،
// وهو بيمشي على كل الأبناء وقت الرندر ويطبّق:
//   - fontScale على أي fontSize موجود بالـ style
//   - تحويل الألوان البيضاء/شبه الشفافة (المصمم عليها الوضع الليلي أصلًا) لمكافئها
//     بالوضع النهاري، والعكس، من غير ما يلمس الألوان المميزة (أخضر/ذهبي/أحمر... إلخ)
//
// أي مكوّن جوّاه (BiboIcon، WheelPicker، الخ) بيفضل شغال زي ما هو تمامًا لأننا
// بنلمس بس الـ style بتاع عناصر الـ View/Text/TouchableOpacity المكتوبة مباشرة
// بكل شاشة، مش داخل مكوّنات جاهزة تانية.

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

const WHITE_RE = /^rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)$/i;
const BLACK_RE = /^rgba\(0,\s*0,\s*0,\s*([0-9.]+)\)$/i;

/**
 * يحوّل لون أبيض/أسود (أو شبه شفاف) مصمم أصلًا للوضع الليلي إلى مكافئه
 * بالوضع الحالي. أي لون تاني (أخضر العلامة التجارية، الذهبي، الأحمر...) بيرجع
 * زي ما هو من غير أي تغيير.
 */
export function inkColor(value, darkMode) {
  if (typeof value !== 'string') return value;
  if (darkMode) return value; // الوضع الليلي هو التصميم الأصلي، منلمسوش

  if (value === '#fff' || value === '#ffffff' || value === 'white') return '#1a1a1a';
  if (value === '#08080f' || value === '#000' || value === '#000000' || value === 'black') return '#f5f6fa';

  let m = WHITE_RE.exec(value);
  if (m) return `rgba(0,0,0,${m[1]})`;

  m = BLACK_RE.exec(value);
  if (m) return `rgba(255,255,255,${m[1]})`;

  return value;
}

const COLOR_KEYS = [
  'color', 'backgroundColor',
  'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor',
  'shadowColor', 'tintColor',
];

function transformStyle(style, darkMode, fontScale) {
  const flat = StyleSheet.flatten(style);
  if (!flat) return style;
  let changed = false;
  const out = {};
  for (const key in flat) {
    let v = flat[key];
    if (key === 'fontSize' && typeof v === 'number' && fontScale !== 1) {
      v = Math.round(v * fontScale);
      changed = true;
    } else if (COLOR_KEYS.includes(key) && !darkMode) {
      const nv = inkColor(v, darkMode);
      if (nv !== v) changed = true;
      v = nv;
    }
    out[key] = v;
  }
  return changed ? out : style;
}

function walk(children, darkMode, fontScale) {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    const nextProps = {};
    if (child.props && Object.prototype.hasOwnProperty.call(child.props, 'style')) {
      nextProps.style = transformStyle(child.props.style, darkMode, fontScale);
    }
    if (child.props && child.props.children != null && typeof child.props.children !== 'function') {
      nextProps.children = walk(child.props.children, darkMode, fontScale);
    }
    return Object.keys(nextProps).length ? React.cloneElement(child, nextProps) : child;
  });
}

/** يلف أي شجرة JSX ويطبّق عليها حجم الخط والوضع الليلي/النهاري الحاليين */
export function Themed({ children }) {
  const { darkMode, fontScale } = useApp();
  if (darkMode && fontScale === 1) return children; // ولا تغيير مطلوب — نرجّع زي ما هي بدون أي overhead
  return walk(children, darkMode, fontScale);
}

/**
 * بديل مباشر لـ SafeAreaView: نفس الاستخدام بالضبط، لكنه بيلوّن الخلفية حسب
 * الوضع الحالي، وبيطبّق حجم الخط والوضع الليلي/النهاري على كل الأبناء تلقائيًا.
 */
export default function ThemedSafeArea({ style, children, ...rest }) {
  const { theme } = useApp();
  return (
    <SafeAreaView style={[style, { backgroundColor: theme.bg }]} {...rest}>
      <Themed>{children}</Themed>
    </SafeAreaView>
  );
}
