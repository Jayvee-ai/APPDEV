// src/screens/AuthScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { DB } from '../database/db';
import { COLORS } from '../theme/theme';

export default function AuthScreen({ onLoginSuccess }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('juan@email.com');
  const [password, setPassword] = useState('Resident@2025');

  // Register Fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please fill in credentials.');
      return;
    }
    const user = await DB.login(email.trim(), password);
    if (user) {
      onLoginSuccess(user);
    } else {
      Alert.alert('Authentication Failed', 'Invalid email or password.');
    }
  };

  const handleRegister = async () => {
    if (!regName || !regEmail || !regPassword || !regAddress) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (regPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (regPassword !== regConfirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    const exists = await DB.getUserByEmail(regEmail);
    if (exists) {
      Alert.alert('Error', 'An account with this email already exists.');
      return;
    }

    const user = await DB.createUser({
      full_name: regName,
      email: regEmail,
      phone: regPhone,
      address: regAddress,
      password: regPassword,
    });
    onLoginSuccess(user);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.branding}>
        <View style={styles.iconContainer}><Text style={styles.brandingIcon}>🏛️</Text></View>
        <Text style={styles.title}>Barangay Bued</Text>
        <Text style={styles.subtitle}>Digital Certificate Request System</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tabButton, tab === 'login' && styles.tabActive]} onPress={() => setTab('login')}>
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, tab === 'register' && styles.tabActive]} onPress={() => setTab('register')}>
            <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {tab === 'login' ? (
          <View style={styles.body}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
            
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"/>
            
            <View style={styles.demoBox}>
              <Text style={[styles.demoText, { fontWeight: 'bold', marginBottom: 4 }]}>Demo account credentials:</Text>
              <Text style={styles.demoText}>Resident: juan@email.com / Resident@2025</Text>
              <Text style={styles.demoText}>Admin panel functions are handled on the desktop view simulator portal.</Text>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleLogin}>
              <Text style={styles.submitBtnText}>Sign In →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.body}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput style={styles.input} value={regName} onChangeText={setRegName} placeholder="Juan dela Cruz"/>
            
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={regPhone} onChangeText={setRegPhone} keyboardType="phone-pad" placeholder="09XXXXXXXXX"/>
            
            <Text style={styles.label}>Email Address *</Text>
            <TextInput style={styles.input} value={regEmail} onChangeText={setRegEmail} keyboardType="email-address" autoCapitalize="none"/>
            
            <Text style={styles.label}>Home Address *</Text>
            <TextInput style={styles.input} value={regAddress} onChangeText={setRegAddress} placeholder="St. Address, Bued, Calasiao"/>
            
            <Text style={styles.label}>Password *</Text>
            <TextInput style={styles.input} value={regPassword} onChangeText={setRegPassword} secureTextEntry autoCapitalize="none"/>
            
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput style={styles.input} value={regConfirm} onChangeText={setRegConfirm} secureTextEntry autoCapitalize="none"/>

            <TouchableOpacity style={styles.submitBtn} onPress={handleRegister}>
              <Text style={styles.submitBtnText}>Create Account →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.primaryDark, justifyContent: 'center', padding: 20 },
  branding: { alignItems: 'center', marginBottom: 25 },
  iconContainer: { width: 64, height: 64, backgroundColor: COLORS.accent, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  brandingIcon: { fontSize: 32 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 20, overflow: 'hidden', elevation: 4 },
  tabs: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },
  body: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 14, color: COLORS.text, backgroundColor: '#fff' },
  demoBox: { backgroundColor: COLORS.bg, padding: 12, borderRadius: 8, marginBottom: 15 },
  demoText: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },
  submitBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});