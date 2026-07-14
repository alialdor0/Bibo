import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

const BIBO_SLEEP = require('../assets/bibo/sleep.png');

/**
 * Error Boundary — بيمنع خطأ في جزء واحد من التطبيق إنه يعطّل التطبيق
 * كله. مصمم عمدًا بسيط جدًا (بدون context أو hooks) عشان يفضل شغال
 * حتى لو الخطأ نفسه حصل جوه الـ Context أو أي مكون معقد.
 *
 * Props:
 *  - lang:      'ar' | 'en' (نص الرسالة، افتراضي 'ar')
 *  - resetKey:  أي قيمة — لو اتغيرت وكان فيه خطأ قبل كده، الـ boundary
 *               بيصفّر نفسه أوتوماتيك (مفيد لما تتنقل لشاشة تانية)
 *  - onReset:   دالة اختيارية تتنفذ لما المستخدم يضغط "حاول تاني"
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // مكان مناسب لاحقًا لإرسال الخطأ لخدمة تتبع أخطاء (Sentry مثلاً)
    if (typeof console !== 'undefined' && console.error) {
      console.error('BiboLingo ErrorBoundary caught:', error, info?.componentStack);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      const isAr = (this.props.lang || 'ar') === 'ar';
      return (
        <View style={s.wrap}>
          <Image source={BIBO_SLEEP} style={s.bibo} importantForAccessibility="no" />
          <Text style={s.title}>{isAr ? 'حصلت مشكلة بسيطة' : 'Something went wrong'}</Text>
          <Text style={s.sub}>
            {isAr
              ? 'بيبو بيرتب نفسه دلوقتي... جرّب تاني، البيانات بتاعتك محفوظة.'
              : 'Bibo is tidying things up... give it another try, your data is safe.'}
          </Text>
          <TouchableOpacity style={s.btn} onPress={this.handleReset} accessibilityRole="button">
            <Text style={s.btnTxt}>{isAr ? 'حاول تاني' : 'Try Again'}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  wrap:  { flex: 1, backgroundColor: '#08080f', alignItems: 'center', justifyContent: 'center', padding: 28 },
  bibo: { width: 72, height: 72, marginBottom: 14 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  sub:   { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginBottom: 22, lineHeight: 19 },
  btn:   { backgroundColor: '#2E8B57', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 30 },
  btnTxt:{ color: '#fff', fontWeight: '800', fontSize: 14 },
});
