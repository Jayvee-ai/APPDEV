import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  LogBox,
} from 'react-native';
import { DB } from '../database/db';
import { COLORS } from '../theme/theme';

// Hide all yellow warnings and red error overlay from users
LogBox.ignoreAllLogs(true);

// ── Main AuthScreen ───────────────────────────────────────────────────────────
export default function AuthScreen({ onLoginSuccess }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 520;
  const [tab, setTab] = useState('login');

  // Login fields
  const [email, setEmail] = useState('admin@barangaybued.gov.ph');
  const [password, setPassword] = useState('Admin@2025');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Inline error states
  const [loginError, setLoginError] = useState('');
  const [regErrors, setRegErrors] = useState({});

  const handleLogin = async () => {
    setLoginError('');

    if (!email.trim() || !password) {
      setLoginError('Please fill in your email and password.');
      return;
    }

    try {
      const user = await DB.login(email.trim(), password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setLoginError('Invalid email or password. Please check your credentials.');
      }
    } catch (e) {
      setLoginError('Invalid email or password. Please check your credentials.');
    }
  };

  const handleRegister = async () => {
    const errors = {};

    if (!regName.trim()) errors.name = 'Full name is required.';
    if (!regEmail.trim()) errors.email = 'Email address is required.';
    if (!regAddress.trim()) errors.address = 'Home address is required.';
    if (!regPassword) errors.password = 'Password is required.';
    else if (regPassword.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (regPassword !== regConfirm) errors.confirm = 'Passwords do not match.';

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }

    setRegErrors({});

    try {
      const exists = await DB.getUserByEmail(regEmail.trim());
      if (exists) {
        setRegErrors({ email: 'An account with this email already exists.' });
        return;
      }

      const user = await DB.createUser({
        full_name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        address: regAddress.trim(),
        password: regPassword,
      });
      onLoginSuccess(user);
    } catch (e) {
      setRegErrors({ general: 'Registration failed. Please try again.' });
    }
  };

  // Helper: input border color based on error
  const inputStyle = (hasError) => [
    styles.input,
    hasError && { borderColor: '#e74c3c', borderWidth: 1.5 },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.branding}>
        <View style={styles.iconContainer}>
          <Text style={styles.brandingIcon}>🏛️</Text>
        </View>
        <Text style={styles.title}>Barangay Bued</Text>
        <Text style={styles.subtitle}>Digital Certificate Request System</Text>
        <Text style={styles.location}>Calasiao, Pangasinan</Text>
      </View>

      <View style={styles.card}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'login' && styles.tabActive]}
            onPress={() => { setTab('login'); setLoginError(''); }}
          >
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'register' && styles.tabActive]}
            onPress={() => { setTab('register'); setRegErrors({}); }}
          >
            <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* ── LOGIN FORM ── */}
        {tab === 'login' ? (
          <View style={styles.body}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={inputStyle(!!loginError)}
              value={email}
              onChangeText={(v) => { setEmail(v); setLoginError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@email.com"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={inputStyle(!!loginError)}
              value={password}
              onChangeText={(v) => { setPassword(v); setLoginError(''); }}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Enter your password"
              placeholderTextColor={COLORS.textLight}
            />

            {/* ── Inline Error ── */}
            {loginError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            ) : null}

            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Demo accounts:</Text>
              <Text style={styles.demoText}>Admin: admin@barangaybued.gov.ph / Admin@2025</Text>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleLogin}>
              <Text style={styles.submitBtnText}>Sign In →</Text>
            </TouchableOpacity>
          </View>

        ) : (
          /* ── REGISTER FORM ── */
          <View style={styles.body}>
            {regErrors.general ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{regErrors.general}</Text>
              </View>
            ) : null}

            <View style={[styles.formRow, isCompact && styles.formRowCompact]}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={inputStyle(!!regErrors.name)}
                  value={regName}
                  onChangeText={(v) => { setRegName(v); setRegErrors(p => ({ ...p, name: '' })); }}
                  placeholder="Juan dela Cruz"
                  placeholderTextColor={COLORS.textLight}
                />
                {regErrors.name ? <Text style={styles.fieldError}>{regErrors.name}</Text> : null}
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={regPhone}
                  onChangeText={setRegPhone}
                  keyboardType="phone-pad"
                  placeholder="09XX-XXX-XXXX"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={inputStyle(!!regErrors.email)}
              value={regEmail}
              onChangeText={(v) => { setRegEmail(v); setRegErrors(p => ({ ...p, email: '' })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@email.com"
              placeholderTextColor={COLORS.textLight}
            />
            {regErrors.email ? <Text style={[styles.fieldError, { marginTop: -14 }]}>{regErrors.email}</Text> : null}

            <Text style={styles.label}>Home Address in Barangay Bued *</Text>
            <TextInput
              style={inputStyle(!!regErrors.address)}
              value={regAddress}
              onChangeText={(v) => { setRegAddress(v); setRegErrors(p => ({ ...p, address: '' })); }}
              placeholder="123 Street, Bued, Calasiao, Pangasinan"
              placeholderTextColor={COLORS.textLight}
            />
            {regErrors.address ? <Text style={[styles.fieldError, { marginTop: -14 }]}>{regErrors.address}</Text> : null}

            <View style={[styles.formRow, isCompact && styles.formRowCompact]}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={inputStyle(!!regErrors.password)}
                  value={regPassword}
                  onChangeText={(v) => { setRegPassword(v); setRegErrors(p => ({ ...p, password: '' })); }}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="Min. 8 characters"
                  placeholderTextColor={COLORS.textLight}
                />
                {regErrors.password ? <Text style={styles.fieldError}>{regErrors.password}</Text> : null}
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={inputStyle(!!regErrors.confirm)}
                  value={regConfirm}
                  onChangeText={(v) => { setRegConfirm(v); setRegErrors(p => ({ ...p, confirm: '' })); }}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="Repeat password"
                  placeholderTextColor={COLORS.textLight}
                />
                {regErrors.confirm ? <Text style={styles.fieldError}>{regErrors.confirm}</Text> : null}
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleRegister}>
              <Text style={styles.submitBtnText}>Create Account →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.footer}>ITP09 | Systems Integration and Architecture | UDagupan</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#174f6b', flex: 1 },
  container: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 56,
  },
  branding: { alignItems: 'center', marginBottom: 30 },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#e0b800',
    borderRadius: 15,
    height: 64,
    justifyContent: 'center',
    marginBottom: 18,
    width: 64,
  },
  brandingIcon: { fontSize: 30, lineHeight: 36 },
  title: { color: '#fff', fontSize: 23, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#bdd0de', fontSize: 14, marginBottom: 5 },
  location: { color: 'rgba(189,208,222,0.62)', fontSize: 12 },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e8eff5',
    borderRadius: 18,
    borderWidth: 1,
    elevation: 6,
    maxWidth: 440,
    overflow: 'hidden',
    padding: 10,
    shadowColor: '#08293b',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    width: '100%',
  },
  tabs: {
    backgroundColor: '#edf1f5',
    borderRadius: 8,
    flexDirection: 'row',
    height: 36,
    marginBottom: 34,
    padding: 2,
  },
  tabButton: { alignItems: 'center', borderRadius: 6, flex: 1, justifyContent: 'center' },
  tabActive: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#143a50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: COLORS.text },
  body: { paddingBottom: 12, paddingHorizontal: 12 },
  formRow: { flexDirection: 'row', gap: 16 },
  formRowCompact: { flexDirection: 'column', gap: 0 },
  halfField: { flex: 1 },
  label: { color: '#001b32', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cfe0ee',
    borderRadius: 7,
    borderWidth: 1,
    color: '#001b32',
    fontSize: 14,
    height: 40,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  // ── Inline error styles ──
  errorBox: {
    alignItems: 'center',
    backgroundColor: '#fdf0f0',
    borderColor: '#e74c3c',
    borderLeftWidth: 3,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    marginTop: -8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorIcon: { fontSize: 14 },
  errorText: { color: '#c0392b', flex: 1, fontSize: 13, fontWeight: '600' },
  fieldError: {
    color: '#e74c3c',
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: -14,
  },

  demoBox: { marginBottom: 14, marginTop: 1 },
  demoTitle: { color: COLORS.textMuted, fontSize: 12, fontWeight: '800', lineHeight: 19 },
  demoText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 19 },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: '#205f83',
    borderRadius: 7,
    height: 36,
    justifyContent: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  footer: {
    color: 'rgba(189,208,222,0.42)',
    fontSize: 11,
    marginTop: 20,
    textAlign: 'center',
  },
});