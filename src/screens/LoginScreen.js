import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { COLORS } from '../constants';
import { useLang } from '../hooks/useLang';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '@env';
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ onLogin, onRegister }) {
const { t } = useLang();
const [mode, setMode] = useState('login');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [successMsg, setSuccessMsg] = useState('');

const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  androidClientId: GOOGLE_ANDROID_CLIENT_ID,
});

React.useEffect(() => {
if (response?.type === 'success') {
const { id_token } = response.params;
const credential = GoogleAuthProvider.credential(id_token);
signInWithCredential(auth, credential).catch(() => setError(t('authError')));
}
}, [response]);

const handleSubmit = async () => {
if (!email.trim() || !password.trim()) { setError(t('emailRequired')); return; }
setLoading(true); setError(''); setSuccessMsg('');
try {
if (mode === 'login') await onLogin(email.trim(), password);
else await onRegister(email.trim(), password);
} catch (e) {
if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') setError(t('invalidCredential'));
else if (e.code === 'auth/email-already-in-use') setError(t('emailInUse'));
else if (e.code === 'auth/weak-password') setError(t('weakPassword'));
else setError(t('authError'));
}
setLoading(false);
};

const handleForgotPassword = async () => {
if (!email.trim()) { setError(t('noAccountEmail')); return; }
setLoading(true); setError(''); setSuccessMsg('');
try {
await sendPasswordResetEmail(auth, email.trim());
setSuccessMsg(t('resetEmailSent'));
} catch (e) {
if (e.code === 'auth/user-not-found') setError(t('noAccountFound'));
else setError(t('authError'));
}
setLoading(false);
};

return (
<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
<View style={styles.logoWrap}>
<Text style={styles.logo}>Flow<Text style={{ color: COLORS.accent }}>Cash</Text></Text>
<Text style={styles.logoSub}>{t('logoSub')}</Text>
</View>
<View style={styles.card}>
<TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()} disabled={!request}>
<Text style={styles.googleIcon}>G</Text>
<Text style={styles.googleBtnText}>{t('googleBtn')}</Text>
</TouchableOpacity>
<View style={styles.divider}>
<View style={styles.dividerLine} />
<Text style={styles.dividerText}>o</Text>
<View style={styles.dividerLine} />
</View>
<View style={styles.modeToggle}>
<TouchableOpacity style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]} onPress={() => { setMode('login'); setError(''); setSuccessMsg(''); }}>
<Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>{t('loginMode')}</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]} onPress={() => { setMode('register'); setError(''); setSuccessMsg(''); }}>
<Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>{t('registerMode')}</Text>
</TouchableOpacity>
</View>

      <Text style={styles.label}>{t('emailLabel')}</Text>
      <TextInput
        style={styles.input} value={email} onChangeText={setEmail}
        placeholder="tucorreo@email.com" placeholderTextColor={COLORS.muted}
        keyboardType="email-address" autoCapitalize="none" />

      <Text style={styles.label}>{t('passwordLabel')}</Text>
      <TextInput
        style={styles.input} value={password} onChangeText={setPassword}
        placeholder={t('passwordPlaceholder')} placeholderTextColor={COLORS.muted}
        secureTextEntry />

      {mode === 'login' && (
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {successMsg ? <Text style={styles.success}>{successMsg}</Text> : null}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : (
          <Text style={styles.submitBtnText}>{mode === 'login' ? t('loginBtn') : t('registerBtn')}</Text>
        )}
      </TouchableOpacity>
    </View>
  </ScrollView>
</KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: COLORS.bg },
scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
logoWrap: { alignItems: 'center', marginBottom: 32 },
logo: { fontSize: 36, fontWeight: '800', color: COLORS.text, letterSpacing: -1 },
logoSub: { fontSize: 14, color: COLORS.muted, marginTop: 6 },
card: { width: '100%', backgroundColor: COLORS.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10, marginBottom: 16 },
googleIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
googleBtnText: { fontSize: 15, fontWeight: '600', color: '#333' },
divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
dividerText: { color: COLORS.muted, fontSize: 13 },
modeToggle: { flexDirection: 'row', backgroundColor: COLORS.card2, borderRadius: 14, padding: 4, marginBottom: 16 },
modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
modeBtnActive: { backgroundColor: COLORS.accent2 },
modeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.muted },
modeBtnTextActive: { color: '#fff' },
label: { fontSize: 11, color: COLORS.muted, letterSpacing: 0.8, marginBottom: 6 },
input: { backgroundColor: COLORS.card2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, color: COLORS.text, fontSize: 16, marginBottom: 14 },
forgotBtn: { alignSelf: 'flex-end', marginBottom: 12, marginTop: -6 },
forgotText: { fontSize: 13, color: COLORS.accent2 },
error: { color: COLORS.red, fontSize: 13, marginBottom: 12, backgroundColor: 'rgba(255,77,109,0.1)', padding: 10, borderRadius: 8 },
success: { color: COLORS.accent, fontSize: 13, marginBottom: 12, backgroundColor: 'rgba(0,229,160,0.1)', padding: 10, borderRadius: 8 },
submitBtn: { backgroundColor: COLORS.accent, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 4 },
submitBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
});
