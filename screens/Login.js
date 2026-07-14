import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { t } from '../data';
import BiboCharacter from '../components/BiboCharacter';
import { biboSay } from '../data/biboPhrases';
import { generateLoginCode } from '../utils/authCode';
import { copyToClipboard } from '../utils/clipboard';
import { playSfx } from '../utils/sfx';

// شاشات فرعية: 'main' (الاختيار الأول) | 'newCode' (عرض كود جديد) | 'enterCode' (لصق كود قديم)
export default function Login({ onLogin, onCodeRestored }) {
  const { lang, companion, setUser, loginWithCode } = useApp();
  const T = (k) => t(k, lang);
  const welcomeMsg = companion?.isComeback
    ? biboSay('comeback', lang)
    : (lang === 'ar' ? 'أهلاً بيك! جاهز تبدأ مغامرتك؟ 🎬' : 'Welcome! Ready for your adventure? 🎬');

  const [view, setView]     = useState('main');
  const [newCode, setNewCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [typedCode, setTypedCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const startNewCode = () => {
    const code = generateLoginCode();
    setNewCode(code);
    setCopied(false);
    setView('newCode');
  };

  const copyCode = async () => {
    const ok = await copyToClipboard(newCode);
    setCopied(true);
    playSfx('correct');
    if (!ok) {
      // fallback: مفيش مكتبة clipboard متاحة — لسه ممكن ينسخ الكود يدويًا من الشاشة
    }
  };

  const continueWithNewCode = () => {
    setUser({ loginCode: newCode });
    onLogin('code-new');
  };

  const submitExistingCode = async () => {
    if (!typedCode.trim()) return;
    setChecking(true);
    setNotFound(false);
    const ok = await loginWithCode(typedCode);
    setChecking(false);
    if (ok) {
      playSfx('win');
      onCodeRestored();
    } else {
      setNotFound(true);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <BiboCharacter state="welcome" message={welcomeMsg} size={88} style={{ marginBottom: 12 }} />
        <Text style={s.appName}>Bibo</Text>
        <Text style={s.tagline}>{T('appTagline')}</Text>

        <View style={s.card}>
          <View style={s.divider} />

          {view === 'main' ? (
            <>
              <Text style={s.title}>{T('welcome')}</Text>
              <Text style={s.desc}>{T('loginDesc')}</Text>

              <TouchableOpacity
                style={s.codeBtn}
                onPress={startNewCode}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={T('createCode')}>
                <Text style={s.btnIcon}>🔑</Text>
                <Text style={s.btnTxt}>{T('createCode')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.codeOutlineBtn}
                onPress={() => { setView('enterCode'); setNotFound(false); setTypedCode(''); }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={T('haveCode')}>
                <Text style={s.btnIcon}>⌨️</Text>
                <Text style={s.btnTxt}>{T('haveCode')}</Text>
              </TouchableOpacity>

              <View style={s.orRow}>
                <View style={s.orLine} />
                <Text style={s.orTxt}>{lang === 'ar' ? 'أو' : 'or'}</Text>
                <View style={s.orLine} />
              </View>

              <TouchableOpacity
                style={s.guestBtn}
                onPress={() => onLogin('guest')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={T('asGuest')}>
                <Text style={s.btnIcon}>👤</Text>
                <Text style={s.btnTxt}>{T('asGuest')}</Text>
              </TouchableOpacity>

              <Text style={s.guestNote}>{T('guestNote')}</Text>
            </>
          ) : null}

          {view === 'newCode' ? (
            <>
              <Text style={s.title}>{T('yourCode')}</Text>
              <Text style={s.desc}>{T('codeSaveNote')}</Text>

              <View style={s.codeBox}>
                <Text style={s.codeTxt} selectable={true}>{newCode}</Text>
              </View>

              <TouchableOpacity
                style={s.copyBtn}
                onPress={copyCode}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={T('copyCode')}>
                <Text style={s.btnTxt}>{copied ? T('codeCopied') : T('copyCode')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.codeBtn}
                onPress={continueWithNewCode}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={T('continueBtn')}>
                <Text style={s.btnTxt}>{T('continueBtn')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setView('main')} accessibilityRole="button">
                <Text style={s.backLink}>{'← ' + T('back')}</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {view === 'enterCode' ? (
            <>
              <Text style={s.title}>{T('haveCode')}</Text>
              <Text style={s.desc}>{T('enterCodeNote')}</Text>

              <TextInput
                style={s.input}
                value={typedCode}
                onChangeText={(v) => { setTypedCode(v); setNotFound(false); }}
                placeholder="BIBO-XXXX-XXXX"
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel={T('haveCode')}
              />
              {notFound ? <Text style={s.errTxt}>{T('codeNotFound')}</Text> : null}

              <TouchableOpacity
                style={s.codeBtn}
                onPress={submitExistingCode}
                disabled={checking}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={T('continueBtn')}>
                {checking ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>{T('continueBtn')}</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setView('main')} accessibilityRole="button">
                <Text style={s.backLink}>{'← ' + T('back')}</Text>
              </TouchableOpacity>
            </>
          ) : null}
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
  codeBtn:        { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2E8B57', borderRadius: 12, padding: 14, marginBottom: 10 },
  codeOutlineBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, marginBottom: 4 },
  guestBtn:  { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 14 },
  btnIcon:   { fontSize: 19, marginRight: 10 },
  btnTxt:    { color: '#fff', fontSize: 14, fontWeight: '600' },
  orRow:     { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 10 },
  orLine:    { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  orTxt:     { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginHorizontal: 10 },
  guestNote: { fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 10, textAlign: 'center' },
  codeBox:   { width: '100%', backgroundColor: 'rgba(46,139,87,0.12)', borderWidth: 1.5, borderColor: '#2E8B57', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  codeTxt:   { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  copyBtn:   { width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 13, alignItems: 'center', marginBottom: 10 },
  input:     { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16, textAlign: 'center', letterSpacing: 1, marginBottom: 10 },
  errTxt:    { color: '#c0392b', fontSize: 12, marginBottom: 10, textAlign: 'center' },
  backLink:  { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12 },
});
