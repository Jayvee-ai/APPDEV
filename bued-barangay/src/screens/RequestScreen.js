// src/screens/RequestScreen.js
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { DB } from '../database/db';
import { COLORS } from '../theme/theme';

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgent' },
];

export default function RequestScreen({ user, navigation }) {
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;
  const isMobile = width < 760;
  const [certTypes, setCertTypes] = useState([]);
  const [selectedCertId, setSelectedCertId] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isFocused) {
      DB.getCertTypes().then(res => {
        const active = res.filter(c => c.is_active);
        setCertTypes(active);
      });
    }
  }, [isFocused]);

  const handleSubmit = async () => {
    if (!selectedCertId) {
      Alert.alert('Select Certificate Type', 'Please choose the certificate you want to request.');
      return;
    }
    if (!purpose.trim()) {
      Alert.alert('Required Info Missing', 'Please enter the purpose of your request.');
      return;
    }

    await DB.createRequest(user.id, selectedCertId, purpose, priority, notes);
    Alert.alert('Success', 'Your application request has been saved successfully.');
    setSelectedCertId(null);
    setPurpose('');
    setPriority('normal');
    setNotes('');
    navigation.navigate('Track');
  };

  const currentSelectedCert = certTypes.find(c => c.id === selectedCertId);
  const detailsEnabled = !!selectedCertId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}>
      <View style={[styles.progress, isMobile && styles.progressMobile]}>
        <View style={styles.progressLine} />
        <View style={styles.step}>
          <View style={[styles.stepCircle, styles.stepCurrent]}>
            <Text style={[styles.stepNumber, styles.stepNumberCurrent]}>1</Text>
          </View>
          <Text style={[styles.stepLabel, styles.stepLabelCurrent]}>{isMobile ? 'Type' : 'Select Type'}</Text>
        </View>
        <View style={styles.step}>
          <View style={[styles.stepCircle, detailsEnabled && styles.stepCurrent]}>
            <Text style={[styles.stepNumber, detailsEnabled && styles.stepNumberCurrent]}>2</Text>
          </View>
          <Text style={[styles.stepLabel, detailsEnabled && styles.stepLabelCurrent]}>Details</Text>
        </View>
        <View style={styles.step}>
          <View style={[styles.stepCircle, purpose.trim() && styles.stepCurrent]}>
            <Text style={[styles.stepNumber, purpose.trim() && styles.stepNumberCurrent]}>3</Text>
          </View>
          <Text style={[styles.stepLabel, purpose.trim() && styles.stepLabelCurrent]}>Submit</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>1. Select Certificate Type</Text>
        </View>

        <View style={[styles.certGrid, isWide && styles.certGridWide, isMobile && styles.certGridMobile]}>
          {certTypes.map(cert => {
            const isSelected = selectedCertId === cert.id;

            return (
              <TouchableOpacity
                key={cert.id}
                style={[styles.certCard, isWide && styles.certCardWide, isMobile && styles.certCardMobile, isSelected && styles.certCardSelected]}
                onPress={() => setSelectedCertId(cert.id)}
                activeOpacity={0.86}
              >
                <Text style={styles.certIcon}>📃</Text>
                <Text style={styles.certName} numberOfLines={2}>{cert.name}</Text>
                <Text style={styles.certDesc} numberOfLines={isMobile ? 2 : undefined}>{cert.description}</Text>
                <View style={styles.certFooter}>
                  <Text style={styles.certFee}>
                    ₱{cert.fee.toFixed(2)} {cert.fee === 0 ? '(Free)' : ''}
                  </Text>
                  <Text style={styles.certDays}>
                    {cert.processing_days} day{cert.processing_days > 1 ? 's' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, !detailsEnabled && styles.disabledCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>2. Request Details</Text>
        </View>

        <View style={[styles.formBody, isMobile && styles.formBodyMobile]} pointerEvents={detailsEnabled ? 'auto' : 'none'}>
          {currentSelectedCert ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>{currentSelectedCert.name}</Text>
              <Text style={styles.infoText}>Requirements: {currentSelectedCert.requirements}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Purpose of Request <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            multiline
            placeholder="e.g. For employment, school enrollment, government application..."
            placeholderTextColor={COLORS.textLight}
            value={purpose}
            onChangeText={setPurpose}
          />

          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityOptions}>
            {PRIORITY_OPTIONS.map(option => {
              const isSelected = priority === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.priorityOption, isSelected && styles.priorityOptionSelected]}
                  onPress={() => setPriority(option.value)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.priorityOptionText, isSelected && styles.priorityOptionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.notesArea]}
            multiline
            placeholder="Any additional information for the barangay officials..."
            placeholderTextColor={COLORS.textLight}
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </View>

      <View style={[styles.actions, isMobile && styles.actionsMobile]}>
        <TouchableOpacity style={[styles.cancelBtn, isMobile && styles.cancelBtnMobile]} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.submitBtn, isMobile && styles.submitBtnMobile, (!detailsEnabled || !purpose.trim()) && styles.submitDisabled]} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Submit Request</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.primaryDark, flex: 1 },
  content: { padding: 28, paddingBottom: 40 },
  contentMobile: { padding: 14, paddingBottom: 18 },
  progress: {
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    maxWidth: 1090,
    position: 'relative',
    width: '72%',
  },
  progressMobile: { marginBottom: 14, width: '100%' },
  progressLine: {
    backgroundColor: COLORS.border,
    height: 2,
    left: '8%',
    position: 'absolute',
    right: '8%',
    top: 16,
  },
  step: { alignItems: 'center', gap: 8, zIndex: 1 },
  stepCircle: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepCurrent: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNumber: { color: COLORS.textMuted, fontSize: 13, fontWeight: '800' },
  stepNumberCurrent: { color: '#fff' },
  stepLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 11.5, fontWeight: '700' },
  stepLabelCurrent: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  disabledCard: { opacity: 0.62 },
  cardHeader: {
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    height: 58,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  certGrid: { gap: 14, padding: 22 },
  certGridMobile: { gap: 10, padding: 14 },
  certGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  certCard: {
    backgroundColor: '#fff',
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1.4,
    minHeight: 212,
    padding: 18,
  },
  certCardMobile: { minHeight: 132, padding: 14 },
  certCardWide: { width: 246 },
  certCardSelected: {
    backgroundColor: '#ebf5fb',
    borderColor: COLORS.primary,
    borderWidth: 2,
    elevation: 2,
    shadowColor: COLORS.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  certIcon: { fontSize: 22, marginBottom: 16, opacity: 0.8 },
  certIconMobile: { marginBottom: 8 },
  certName: { color: COLORS.text, fontSize: 13.5, fontWeight: '800', lineHeight: 19, marginBottom: 7 },
  certDesc: { color: COLORS.textMuted, flex: 1, fontSize: 12.5, lineHeight: 20 },
  certFooter: {
    alignItems: 'center',
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
  },
  certFee: { color: COLORS.primary, fontSize: 12.5, fontWeight: '800' },
  certDays: { color: COLORS.textMuted, fontSize: 11.5 },
  formBody: { padding: 22 },
  formBodyMobile: { padding: 14 },
  infoBox: { backgroundColor: COLORS.bg, borderLeftColor: COLORS.accent, borderLeftWidth: 3, borderRadius: 8, marginBottom: 16, padding: 14 },
  infoTitle: { color: COLORS.text, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  infoText: { color: COLORS.textMuted, fontSize: 12.5 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  required: { color: COLORS.dangerLight },
  input: {
    backgroundColor: '#fff',
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1.3,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 18,
    padding: 12,
  },
  textarea: { minHeight: 76, textAlignVertical: 'top' },
  notesArea: { minHeight: 70, textAlignVertical: 'top' },
  priorityOptions: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  priorityOption: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1.3,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  priorityOptionSelected: { backgroundColor: '#ebf5fb', borderColor: COLORS.primary },
  priorityOptionText: { color: COLORS.textMuted, fontSize: 13.5, fontWeight: '800' },
  priorityOptionTextSelected: { color: COLORS.primary },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  actionsMobile: { backgroundColor: '#fff', borderRadius: 12, padding: 10 },
  cancelBtn: { borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12 },
  cancelBtnMobile: { alignItems: 'center', flex: 1 },
  cancelText: { color: COLORS.textMuted, fontSize: 13.5, fontWeight: '800' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 22, paddingVertical: 12 },
  submitBtnMobile: { alignItems: 'center', flex: 1 },
  submitDisabled: { opacity: 0.55 },
  submitBtnText: { color: '#fff', fontSize: 13.5, fontWeight: '800' },
});
