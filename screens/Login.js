import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useApp } from '../context/AppContext';
import { t } from '../data';
import BiboCharacter from '../components/BiboCharacter';
import { biboSay } from '../data/biboPhrases';

export default function Login({ onLogin }) {
  const { lang, companion } = useApp();
  const T = (k) => t(k, lang);
  const welcomeMsg = companion?.isComeback
    ? biboSay('comeback', lang)
    : (lang === 'ar' ? 'أهلاً بيك! جاهز تبدأ مغامرتك؟ 🎬' : 'Welcome! Ready for your adventure? 🎬');

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <BiboCharacter state="welcome" message={welcomeMsg} size={88} style={{ marginBottom: 12 }} />
        <Text style={s.appName}>Bibo</Text>
        <Text style={s.tagline}>{T('appTagline')}</Text>

        <View style={s.card}>
          <View style={s.divider} />
          <Text style={s.title}>{T('welcome')}</Text>
          <Text style={s.desc}>{T('loginDesc')}</Text>

          <TouchableOpacity
            style={s.appleBtn}
            onPress={() => onLogin('apple')}
            accessibilityRole="button"
            accessibilityLabel={T('withApple')}>
            <Text style={s.btnIcon}>🍎</Text>
            <Text style={s.btnTxt}>{T('withApple')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.googleBtn}
            onPress={() => onLogin('google')}
            accessibilityRole="button"
            accessibilityLabel={T('withGoogle')}>
            <Text style={s.btnIcon}>🔵</Text>
            <Text style={[s.btnTxt, { color: '#222' }]}>{T('withGoogle')}</Text>
          </TouchableOpacity>

          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orTxt}>or</Text>
            <View style={s.orLine} />
          </View>

          <TouchableOpacity
            style={s.guestBtn}
            onPress={() => onLogin('guest')}
            accessibilityRole="button"
            accessibilityLabel={T('asGuest')}>
            <Text style={s.btnIcon}>👤</Text>
            <Text style={s.btnTxt}>{T('asGuest')}</Text>
          </TouchableOpacity>

          <Text style={s.guestNote}>{T('guestNote')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#08080f' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  appName:   { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  tagline:   { fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 4, marginBottom: 20, textAlign: 'center' },
  card:      { width: '100%', maxWidth: 360, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, padding: 22, alignItems: 'center' },
  divider:   { width: 40, height: 2, borderRadius: 2, backgroundColor: '#2E8B57', marginBottom: 12 },
  title:     { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6 },
  desc:      { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16, textAlign: 'center' },
  appleBtn:  { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10 },
  googleBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 4 },
  guestBtn:  { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 14 },
  btnIcon:   { fontSize: 19, marginRight: 10 },
  btnTxt:    { color: '#fff', fontSize: 14, fontWeight: '600' },
  orRow:     { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 10 },
  orLine:    { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  orTxt:     { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginHorizontal: 10 },
  guestNote: { fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 10, textAlign: 'center' },
});
