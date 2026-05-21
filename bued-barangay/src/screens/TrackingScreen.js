// src/screens/TrackingScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { DB } from '../database/db';
import { COLORS } from '../theme/theme';

function formatDateTime(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status) {
  return status.replace(/_/g, ' ');
}

function buildVerificationUrl(request) {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}?verify=${encodeURIComponent(request.request_code)}`;
  }
  return `barangay-bued://verify/${encodeURIComponent(request.request_code)}`;
}

function CertificatePreview({ request, user, cert }) {
  const verificationUrl = useMemo(() => buildVerificationUrl(request), [request]);

  return (
    <View>
      <View style={styles.certificatePaper}>
        <View style={styles.certificateBorder}>
          <Text style={styles.countryMark}>PH</Text>
          <Text style={styles.republic}>REPUBLIC OF THE PHILIPPINES</Text>
          <Text style={styles.certBarangay}>Barangay Bued, Calasiao, Pangasinan</Text>
          <Text style={styles.office}>Office of the Barangay Captain</Text>

          <Text style={styles.italicLine}>This is to certify that</Text>
          <Text style={styles.residentName}>{user.full_name}</Text>
          <Text style={styles.certBody}>
            residing at {user.address || 'Barangay Bued, Calasiao, Pangasinan'} has requested
          </Text>
          <Text style={styles.certBody}>and is hereby granted</Text>
          <Text style={styles.certType}>{cert?.name || 'Certificate'}</Text>
          <Text style={styles.italicLine}>for the purpose of</Text>
          <Text style={styles.purpose}>{request.purpose}</Text>
          <Text style={styles.period}>.</Text>

          <View style={styles.certFooter}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signName}>Barangay Captain</Text>
              <Text style={styles.signOffice}>Barangay Bued</Text>
            </View>

            <View style={styles.qrBox}>
              <QRCode value={verificationUrl} size={96} />
              <Text style={styles.qrLabel}>Scan to verify</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.certificateCode}>
        Code: <Text style={styles.bold}>{request.request_code}</Text> | Approved: {formatDateTime(request.approved_at)}
      </Text>
    </View>
  );
}

export default function TrackingScreen({ user }) {
  const isFocused = useIsFocused();
  const [requests, setRequests] = useState([]);
  const [typesMap, setTypesMap] = useState({});
  const [activeModalItem, setActiveModalItem] = useState(null);

  useEffect(() => {
    if (isFocused) {
      loadRequests();
    }
  }, [isFocused]);

  const loadRequests = async () => {
    const certs = await DB.getCertTypes();
    const mapping = {};
    certs.forEach(c => { mapping[c.id] = c; });
    setTypesMap(mapping);

    const all = await DB.getRequests();
    const filtered = all.filter(r => r.user_id === user.id);
    setRequests(filtered.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at)));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return COLORS.success;
      case 'released': return COLORS.primary;
      case 'rejected': return COLORS.danger;
      case 'under_review': return COLORS.primaryLight;
      default: return COLORS.warning;
    }
  };

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  const activeCert = activeModalItem ? typesMap[activeModalItem.certificate_type_id] : null;
  const hasCertificate = activeModalItem && ['approved', 'released'].includes(activeModalItem.status);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Requests</Text>
        <Text style={styles.subtitle}>Open an approved request to view and verify the generated certificate.</Text>

        {requests.length === 0 ? (
          <View style={styles.empty}><Text>No records verified on this account profile.</Text></View>
        ) : (
          requests.map(item => (
            <TouchableOpacity key={item.id} style={styles.itemRow} onPress={() => setActiveModalItem(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.codeText}>{item.request_code}</Text>
                <Text style={styles.typeText}>{typesMap[item.certificate_type_id]?.name || 'Document'}</Text>
                <Text style={styles.dateText}>{formatDateTime(item.requested_at)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={!!activeModalItem} animationType="fade" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            {activeModalItem && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {hasCertificate ? 'QR Certificate Verification' : 'Application Details'}
                  </Text>
                  <TouchableOpacity onPress={() => setActiveModalItem(null)} style={styles.closeIconButton}>
                    <Text style={styles.closeIcon}>×</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.modalBody}>
                  {hasCertificate ? (
                    <CertificatePreview request={activeModalItem} user={user} cert={activeCert} />
                  ) : (
                    <View style={styles.pendingPanel}>
                      <Text style={styles.pendingTitle}>{activeModalItem.request_code}</Text>
                      <Text style={styles.detailText}>Certificate: {activeCert?.name || 'Document'}</Text>
                      <Text style={styles.detailText}>Purpose: {activeModalItem.purpose}</Text>
                      <Text style={styles.detailText}>Priority: {activeModalItem.priority.toUpperCase()}</Text>
                      <Text style={styles.detailText}>Status: {statusLabel(activeModalItem.status)}</Text>
                      {activeModalItem.admin_remarks ? (
                        <Text style={[styles.detailText, { color: COLORS.danger }]}>Remarks: {activeModalItem.admin_remarks}</Text>
                      ) : null}
                      <View style={styles.pendingQrPlaceholder}>
                        <Text style={styles.pendingQrText}>QR certificate becomes available after approval.</Text>
                      </View>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.footerGhost} onPress={() => setActiveModalItem(null)}>
                    <Text style={styles.footerGhostText}>Close</Text>
                  </TouchableOpacity>
                  {hasCertificate ? (
                    <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
                      <Text style={styles.printButtonText}>🖨️ Print</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: COLORS.primaryDark, flex: 1 },
  content: { padding: 28, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13.5, marginBottom: 20 },
  empty: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 40 },
  itemRow: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
  },
  codeText: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  typeText: { color: COLORS.textMuted, fontSize: 13, marginVertical: 2 },
  dateText: { color: COLORS.textLight, fontSize: 11.5 },
  badge: { borderRadius: 18, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  modalBg: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', flex: 1, justifyContent: 'center', padding: 18 },
  modalContent: { backgroundColor: '#fff', borderRadius: 18, maxHeight: '94%', maxWidth: 540, overflow: 'hidden', width: '100%' },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 70,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  closeIconButton: { padding: 4 },
  closeIcon: { color: COLORS.textMuted, fontSize: 30, lineHeight: 32 },
  modalBody: { padding: 24 },

  // Certificate paper
  certificatePaper: {
    backgroundColor: '#fff',
    borderColor: COLORS.primaryDark,
    borderRadius: 4,
    borderWidth: 2,
    padding: 6,
  },
  certificateBorder: {
    borderColor: COLORS.accent,
    borderRadius: 2,
    borderWidth: 1,
    minHeight: 520,
    padding: 28,
  },
  countryMark: { color: COLORS.primaryDark, fontSize: 12, marginBottom: 14, textAlign: 'center' },
  republic: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 2.4, marginBottom: 8, textAlign: 'center' },
  certBarangay: { color: COLORS.primaryDark, fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  office: { color: COLORS.textMuted, fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  italicLine: { color: COLORS.text, fontFamily: 'Georgia, serif', fontSize: 16, fontStyle: 'italic', marginBottom: 14, textAlign: 'center' },
  residentName: { color: COLORS.primaryDark, fontFamily: 'Georgia, serif', fontSize: 21, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  certBody: { color: COLORS.text, fontFamily: 'Georgia, serif', fontSize: 16, fontStyle: 'italic', lineHeight: 28, textAlign: 'center' },
  certType: { color: COLORS.primaryDark, fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: '800', marginBottom: 16, marginTop: 12, textAlign: 'center' },
  purpose: { color: COLORS.primaryDark, fontFamily: 'Georgia, serif', fontSize: 19, fontStyle: 'italic', fontWeight: '800', marginBottom: 14, textAlign: 'center' },
  period: { color: COLORS.text, fontSize: 18, marginBottom: 22, textAlign: 'center' },

  // Footer: signature left, QR right — both inset from yellow border
  certFooter: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingRight: 8,
  },
  signatureBlock: { alignItems: 'center', width: 150 },
  signatureLine: { borderTopColor: COLORS.text, borderTopWidth: 1.5, marginBottom: 7, width: 140 },
  signName: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  signOffice: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  qrBox: { alignItems: 'center', width: 104 },
  qrLabel: { color: COLORS.textMuted, fontSize: 10.5, fontWeight: '700', marginTop: 6 },

  certificateCode: { color: COLORS.textMuted, fontSize: 13, marginTop: 20, textAlign: 'center' },
  bold: { fontWeight: '800' },

  // Pending state
  pendingPanel: { backgroundColor: COLORS.bg, borderRadius: 12, padding: 18 },
  pendingTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  detailText: { color: COLORS.text, fontSize: 13, marginBottom: 8 },
  pendingQrPlaceholder: {
    alignItems: 'center', backgroundColor: '#fff', borderColor: COLORS.border,
    borderRadius: 8, borderStyle: 'dashed', borderWidth: 1.5,
    height: 100, justifyContent: 'center', marginTop: 12, paddingHorizontal: 16,
  },
  pendingQrText: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },

  modalFooter: {
    alignItems: 'center',
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 14,
    height: 68,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  footerGhost: { paddingHorizontal: 10, paddingVertical: 10 },
  footerGhostText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '800' },
  printButton: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11 },
  printButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});