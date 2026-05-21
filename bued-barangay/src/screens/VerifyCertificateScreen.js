import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
  if (!status) return '-';
  return status.replace(/_/g, ' ');
}

// ── QR Scanner Modal ──────────────────────────────────────────────────────────
function QRScannerModal({ visible, onClose, onScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    onScanned(data);
    onClose();
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to scan QR codes.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={scanStyles.container}>
        <View style={scanStyles.header}>
          <Text style={scanStyles.headerTitle}>Scan QR Code</Text>
          <TouchableOpacity onPress={onClose} style={scanStyles.closeBtn}>
            <Text style={scanStyles.closeBtnText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        {!permission ? (
          <View style={scanStyles.centered}>
            <Text style={scanStyles.permText}>Checking camera permission...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={scanStyles.centered}>
            <Text style={scanStyles.permIcon}>📷</Text>
            <Text style={scanStyles.permTitle}>Camera Access Needed</Text>
            <Text style={scanStyles.permText}>
              To scan QR codes, please allow this app to use your camera.
            </Text>
            <TouchableOpacity style={scanStyles.permBtn} onPress={handleRequestPermission}>
              <Text style={scanStyles.permBtnText}>Allow Camera</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={scanStyles.cameraWrapper}>
            <CameraView
              style={scanStyles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            <View style={scanStyles.overlay}>
              <View style={scanStyles.overlayTop} />
              <View style={scanStyles.overlayMiddle}>
                <View style={scanStyles.overlaySide} />
                <View style={scanStyles.scanFrame}>
                  <View style={[scanStyles.corner, scanStyles.cornerTL]} />
                  <View style={[scanStyles.corner, scanStyles.cornerTR]} />
                  <View style={[scanStyles.corner, scanStyles.cornerBL]} />
                  <View style={[scanStyles.corner, scanStyles.cornerBR]} />
                </View>
                <View style={scanStyles.overlaySide} />
              </View>
              <View style={scanStyles.overlayBottom}>
                <Text style={scanStyles.scanHint}>
                  {scanned ? '✅ QR Code detected!' : 'Point your camera at the QR code'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const scanStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d2535' },
  header: {
    alignItems: 'center',
    backgroundColor: '#174f6b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 32 },
  permIcon: { fontSize: 48, marginBottom: 16 },
  permTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  permText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 24, textAlign: 'center' },
  permBtn: { backgroundColor: '#205f83', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 14 },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cameraWrapper: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { backgroundColor: 'rgba(0,0,0,0.55)', flex: 1 },
  overlayMiddle: { flexDirection: 'row', height: 260 },
  overlaySide: { backgroundColor: 'rgba(0,0,0,0.55)', flex: 1 },
  overlayBottom: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    flex: 1,
    justifyContent: 'center',
  },
  scanFrame: { borderRadius: 4, height: 260, position: 'relative', width: 260 },
  corner: { borderColor: '#e0b800', height: 36, position: 'absolute', width: 36 },
  cornerTL: { borderLeftWidth: 4, borderTopWidth: 4, left: 0, top: 0, borderTopLeftRadius: 6 },
  cornerTR: { borderRightWidth: 4, borderTopWidth: 4, right: 0, top: 0, borderTopRightRadius: 6 },
  cornerBL: { borderBottomWidth: 4, borderLeftWidth: 4, bottom: 0, left: 0, borderBottomLeftRadius: 6 },
  cornerBR: { borderBottomWidth: 4, borderRightWidth: 4, bottom: 0, right: 0, borderBottomRightRadius: 6 },
  scanHint: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 24, textAlign: 'center' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function VerifyCertificateScreen({ initialCode = '', onBackToLogin }) {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState(null);
  const [resident, setResident] = useState(null);
  const [cert, setCert] = useState(null);
  const [searched, setSearched] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  useEffect(() => {
    if (initialCode) verify(initialCode);
  }, [initialCode]);

  const extractCode = (data) => {
    const trimmed = data.trim();
    if (trimmed.includes('://')) {
      if (trimmed.includes('?verify=')) {
        return decodeURIComponent(trimmed.split('?verify=')[1]);
      }
      const parts = trimmed.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    }
    if (trimmed.includes('?verify=')) {
      return decodeURIComponent(trimmed.split('?verify=')[1]);
    }
    return trimmed.split('|')[0];
  };

  async function verify(nextCode = code) {
    const cleanCode = extractCode(String(nextCode));
    setSearched(true);

    if (!cleanCode) {
      setResult(null);
      setResident(null);
      setCert(null);
      return;
    }

    // The API now returns full_name, address, phone, email, cert_name via JOIN
    const request = await DB.getRequestByCode(cleanCode);

    setResult(request || null);
    // Use the joined fields directly from the API response
    setResident(request ? { full_name: request.full_name, address: request.address } : null);
    setCert(request ? { name: request.cert_name } : null);
  }

  const handleScanned = (data) => {
    const clean = extractCode(data);
    setCode(clean);
    verify(clean);
  };

  const isAuthentic = result && ['approved', 'released'].includes(result.status);
  const isPending = result && !isAuthentic;

  return (
    <>
      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleScanned}
      />

      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        {onBackToLogin ? (
          <View style={styles.publicHeader}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>🏛️</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>Barangay Bued</Text>
              <Text style={styles.brandSub}>Certificate Verification</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.pageTitle}>Certificate Verification</Text>
        <Text style={styles.pageSubtitle}>
          Verify the authenticity of a barangay certificate using its code or by scanning its QR code.
        </Text>

        <View style={styles.searchCard}>
          <Text style={styles.label}>Request Code or QR Data</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="e.g. BUED-2025-0001"
            placeholderTextColor={COLORS.textLight}
            autoCapitalize="characters"
            style={styles.input}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.scanBtn} onPress={() => setScannerVisible(true)}>
              <Text style={styles.scanBtnText}>📷 Scan QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.verifyButton} onPress={() => verify()}>
              <Text style={styles.verifyButtonText}>🔍 Verify</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Not found */}
        {searched && !result ? (
          <View style={styles.invalidBox}>
            <Text style={styles.invalidIcon}>❌</Text>
            <Text style={styles.invalidTitle}>Certificate Not Found</Text>
            <Text style={styles.invalidText}>
              No official certificate record matches this code. Please double-check and try again.
            </Text>
          </View>
        ) : null}

        {/* ✅ VERIFIED — green banner */}
        {isAuthentic ? (
          <View style={styles.verifiedBox}>
            <View style={styles.verifiedBanner}>
              <Text style={styles.verifiedCheckmark}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.verifiedTitle}>Certificate Verified</Text>
                <Text style={styles.verifiedSub}>
                  This is an official record from the Barangay Bued certificate database.
                </Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Code</Text>
                <Text style={styles.value}>{result.request_code}</Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{statusLabel(result.status)}</Text>
                </View>
              </View>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Resident</Text>
                <Text style={styles.value}>{resident?.full_name || '-'}</Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Certificate</Text>
                <Text style={styles.value}>{cert?.name || '-'}</Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Purpose</Text>
                <Text style={styles.value}>{result.purpose || '-'}</Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Approved</Text>
                <Text style={styles.value}>{formatDateTime(result.approved_at)}</Text>
              </View>
              <View style={styles.detailWide}>
                <Text style={styles.detailLabel}>Registered Address</Text>
                <Text style={styles.value}>{resident?.address || '-'}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ⚠️ PENDING — warning banner */}
        {isPending ? (
          <View style={styles.warningBox}>
            <View style={styles.warningBanner}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Certificate Not Yet Valid</Text>
                <Text style={styles.warningSub}>
                  This request exists, but it is not yet approved or released.
                </Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Code</Text>
                <Text style={styles.value}>{result.request_code}</Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.value, { color: COLORS.warning }]}>{statusLabel(result.status)}</Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Resident</Text>
                <Text style={styles.value}>{resident?.full_name || '-'}</Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.detailLabel}>Certificate</Text>
                <Text style={styles.value}>{cert?.name || '-'}</Text>
              </View>
              <View style={styles.detailWide}>
                <Text style={styles.detailLabel}>Purpose</Text>
                <Text style={styles.value}>{result.purpose || '-'}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {onBackToLogin ? (
          <TouchableOpacity style={styles.backButton} onPress={onBackToLogin}>
            <Text style={styles.backButtonText}>← Back to Sign In</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: COLORS.primaryDark, flex: 1 },
  content: { alignItems: 'center', padding: 28, paddingBottom: 40 },

  publicHeader: {
    alignItems: 'center', alignSelf: 'stretch',
    flexDirection: 'row', gap: 12, marginBottom: 18,
  },
  brandIcon: {
    alignItems: 'center', backgroundColor: COLORS.accent,
    borderRadius: 10, height: 42, justifyContent: 'center', width: 42,
  },
  brandIconText: { fontSize: 20 },
  brandTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  brandSub: {
    color: 'rgba(255,255,255,0.55)', fontSize: 11,
    letterSpacing: 1, marginTop: 4, textTransform: 'uppercase',
  },

  pageTitle: { alignSelf: 'stretch', color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 10 },
  pageSubtitle: { alignSelf: 'stretch', color: 'rgba(255,255,255,0.7)', fontSize: 13.5, marginBottom: 28 },

  searchCard: {
    backgroundColor: '#fff', borderColor: COLORS.border, borderRadius: 10,
    borderWidth: 1, maxWidth: 520, padding: 24, width: '100%',
  },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  input: {
    borderColor: COLORS.border, borderRadius: 7, borderWidth: 1,
    color: COLORS.text, fontSize: 16, height: 42,
    marginBottom: 18, paddingHorizontal: 14, textAlign: 'center',
  },
  buttonRow: { flexDirection: 'row', gap: 10 },
  scanBtn: {
    alignItems: 'center', backgroundColor: '#e0b800',
    borderRadius: 7, flex: 1, height: 46, justifyContent: 'center',
  },
  scanBtnText: { color: '#001b32', fontSize: 15, fontWeight: '800' },
  verifyButton: {
    alignItems: 'center', backgroundColor: '#205f83',
    borderRadius: 7, flex: 1, height: 46, justifyContent: 'center',
  },
  verifyButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Not found
  invalidBox: {
    alignItems: 'center', backgroundColor: '#fdedec', borderColor: '#f1948a',
    borderRadius: 12, borderWidth: 1, marginTop: 18,
    maxWidth: 520, padding: 24, width: '100%',
  },
  invalidIcon: { fontSize: 36, marginBottom: 10 },
  invalidTitle: { color: COLORS.danger, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  invalidText: { color: COLORS.textMuted, fontSize: 13.5, textAlign: 'center' },

  // ✅ Verified (green)
  verifiedBox: {
    backgroundColor: '#eafaf1', borderColor: '#58d68d',
    borderRadius: 12, borderWidth: 1.5,
    marginTop: 18, maxWidth: 760, overflow: 'hidden', width: '100%',
  },
  verifiedBanner: {
    alignItems: 'center', backgroundColor: '#27ae60',
    flexDirection: 'row', gap: 14, padding: 16,
  },
  verifiedCheckmark: { fontSize: 32 },
  verifiedTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 2 },
  verifiedSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5 },

  statusPill: {
    alignSelf: 'flex-start', backgroundColor: '#d5f5e3',
    borderRadius: 20, marginTop: 4, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusPillText: { color: '#1e8449', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },

  // ⚠️ Pending (yellow)
  warningBox: {
    backgroundColor: '#fef9e7', borderColor: '#f5c76a',
    borderRadius: 12, borderWidth: 1.5,
    marginTop: 18, maxWidth: 760, overflow: 'hidden', width: '100%',
  },
  warningBanner: {
    alignItems: 'center', backgroundColor: '#f39c12',
    flexDirection: 'row', gap: 14, padding: 16,
  },
  warningIcon: { fontSize: 28 },
  warningTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 2 },
  warningSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12.5 },

  // Shared detail grid
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14 },
  detail: { backgroundColor: '#fff', borderRadius: 8, flexBasis: '47%', flexGrow: 1, padding: 12 },
  detailWide: { backgroundColor: '#fff', borderRadius: 8, flexBasis: '100%', padding: 12 },
  detailLabel: {
    color: COLORS.textMuted, fontSize: 11, fontWeight: '800',
    marginBottom: 4, textTransform: 'uppercase',
  },
  value: { color: COLORS.text, fontSize: 13.5, fontWeight: '700' },

  backButton: { alignSelf: 'flex-start', marginTop: 18, paddingVertical: 8 },
  backButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});