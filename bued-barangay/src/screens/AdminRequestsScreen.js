import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert, Modal, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Custom dropdown — replaces @react-native-picker/picker so the options
// never get clipped by the native sheet on mobile.
function FilterPicker({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value) || options[0];
  return (
    <View>
      <TouchableOpacity
        style={styles.filterBtn}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.filterBtnText} numberOfLines={1}>{selected.label}</Text>
        <Text style={styles.filterBtnChevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.filterDropdown}>
            {options.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.filterOption,
                  opt.value === value && styles.filterOptionActive,
                ]}
                onPress={() => { onChange(opt.value); setOpen(false); }}
              >
                <Text style={[
                  styles.filterOptionText,
                  opt.value === value && styles.filterOptionTextActive,
                ]}>
                  {opt.label}
                </Text>
                {opt.value === value && (
                  <Text style={styles.filterOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Released', value: 'released' },
  { label: 'Rejected', value: 'rejected' },
];

const PRIORITY_OPTIONS = [
  { label: 'All Priority', value: 'all' },
  { label: 'Normal', value: 'normal' },
  { label: 'Urgent', value: 'urgent' },
];
import QRCode from 'react-native-qrcode-svg';
import { DB } from '../database/db';
import { COLORS } from '../theme/theme';

const NEXT_ACTIONS = {
  pending: [
    { status: 'under_review', label: '🔍 Mark Under Review', style: 'outline' },
    { status: 'approved', label: '✅ Approve', style: 'success' },
    { status: 'rejected', label: '❌ Reject', style: 'danger' },
  ],
  under_review: [
    { status: 'approved', label: '✅ Approve', style: 'success' },
    { status: 'rejected', label: '❌ Reject', style: 'danger' },
  ],
  approved: [{ status: 'released', label: '📬 Mark as Released', style: 'primary' }],
};

const STATUS_META = {
  pending: { bg: '#fff4d9', color: COLORS.warning },
  under_review: { bg: '#eaf4fb', color: COLORS.primary },
  approved: { bg: '#eafaf1', color: COLORS.success },
  released: { bg: '#ebf5fb', color: COLORS.primary },
  rejected: { bg: '#fdedec', color: COLORS.danger },
};

const PRIORITY_META = {
  urgent: { bg: '#fdecea', color: COLORS.danger },
  normal: { bg: '#f4f6f7', color: COLORS.textMuted },
};

function textLabel(value) {
  return String(value || '').replace(/_/g, ' ');
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-CA');
}

function Pill({ value, type = 'status' }) {
  const meta = type === 'priority'
    ? PRIORITY_META[value] || PRIORITY_META.normal
    : STATUS_META[value] || STATUS_META.pending;
  return (
    <View style={[styles.pill, { backgroundColor: meta.bg }]}>
      <Text style={[styles.pillText, { color: meta.color }]}>{textLabel(value)}</Text>
    </View>
  );
}

function initials(name = '') {
  return name.split(' ').map(p => p[0]).join('').slice(0, 1).toUpperCase() || '?';
}

function buildVerificationUrl(request) {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}?verify=${encodeURIComponent(request.request_code)}`;
  }
  return `barangay-bued://verify/${encodeURIComponent(request.request_code)}`;
}

function CertificatePreview({ request, resident, cert }) {
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
          <Text style={styles.residentName}>{resident?.full_name || 'Resident'}</Text>
          <Text style={styles.certBody}>
            residing at {resident?.address || 'Barangay Bued, Calasiao, Pangasinan'} has requested
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

// ─── Mobile Request Card ──────────────────────────────────────────────────────
function RequestCard({ request, resident, cert, onManage, onQr }) {
  const hasQr = ['approved', 'released'].includes(request.status);
  return (
    <View style={styles.requestCard}>
      {/* Top row: code + status badge */}
      <View style={styles.cardTopRow}>
        <Text style={styles.cardCode} numberOfLines={1}>{request.request_code}</Text>
        <Pill value={request.status} />
      </View>

      {/* Resident */}
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Resident</Text>
        <Text style={styles.cardValue} numberOfLines={1}>
          {resident?.full_name || 'Resident'}
        </Text>
      </View>

      {/* Certificate */}
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Certificate</Text>
        <Text style={styles.cardValue} numberOfLines={1}>
          {cert?.name || 'Certificate'}
        </Text>
      </View>

      {/* Purpose */}
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Purpose</Text>
        <Text style={styles.cardValue} numberOfLines={1}>{request.purpose}</Text>
      </View>

      {/* Priority + Date */}
      <View style={styles.cardBottomRow}>
        <Pill value={request.priority} type="priority" />
        <Text style={styles.cardDate}>{formatDateTime(request.requested_at)}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.manageButton} onPress={() => onManage(request)}>
          <Text style={styles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
        {hasQr && (
          <TouchableOpacity style={styles.qrButton} onPress={() => onQr(request)}>
            <Text style={styles.qrButtonText}>QR</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function AdminRequestsScreen({ user, mode = 'requests' }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 760;

  const [requests, setRequests] = useState([]);
  const [userRows, setUserRows] = useState([]);
  const [users, setUsers] = useState({});
  const [certs, setCerts] = useState({});
  const [logs, setLogs] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [qrRequest, setQrRequest] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const load = useCallback(async () => {
    const [requestRows, usersData, certRows, auditRows] = await Promise.all([
      DB.getRequests(), DB.getUsers(), DB.getCertTypes(), DB.getAuditLogs(),
    ]);
    setRequests([...requestRows].sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at)));
    setUserRows(usersData);
    setUsers(usersData.reduce((map, row) => ({ ...map, [row.id]: row }), {}));
    setCerts(certRows.reduce((map, row) => ({ ...map, [row.id]: row }), {}));
    setLogs([...auditRows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setRemarks(requestRows.reduce((map, row) => ({ ...map, [row.id]: row.admin_remarks || '' }), {}));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredRequests = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return requests.filter(request => {
      const resident = users[request.user_id];
      const cert = certs[request.certificate_type_id];
      const matchesSearch = !needle || [
        request.request_code, resident?.full_name, resident?.email,
        cert?.name, request.purpose,
      ].some(v => String(v || '').toLowerCase().includes(needle));
      return matchesSearch &&
        (statusFilter === 'all' || request.status === statusFilter) &&
        (priorityFilter === 'all' || request.priority === priorityFilter);
    });
  }, [certs, priorityFilter, requests, search, statusFilter, users]);

  async function handleStatus(request, status) {
    await DB.updateRequestStatus(request.id, status, user.id, remarks[request.id] || '');
    setSelectedRequest(null);
    await load();
    Alert.alert('Request Updated', `${request.request_code} is now ${textLabel(status)}.`);
  }

  function printCertificate() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.print();
  }

  // ── Residents mode ──────────────────────────────────────────────────────────
  if (mode === 'residents') {
    const residents = userRows.filter(row => row.role === 'resident');
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}>
        <Text style={styles.pageTitle}>Registered Residents</Text>
        <Text style={styles.pageSubtitle}>All residents with accounts in the system.</Text>

        {isMobile ? (
          // Mobile: cards
          residents.map(resident => {
            const total = requests.filter(r => r.user_id === resident.id).length;
            return (
              <View key={resident.id} style={styles.requestCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.nameCell}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(resident.full_name)}</Text>
                    </View>
                    <Text style={styles.cardCode}>{resident.full_name}</Text>
                  </View>
                  <View style={styles.greenPill}>
                    <Text style={styles.greenPillText}>{total} req{total !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Email</Text>
                  <Text style={styles.cardValue} numberOfLines={1}>{resident.email}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Phone</Text>
                  <Text style={styles.cardValue}>{resident.phone || '-'}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Address</Text>
                  <Text style={styles.cardValue} numberOfLines={2}>{resident.address || '-'}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Joined</Text>
                  <Text style={styles.cardValue}>{formatDate(resident.created_at)}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.tableCard}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, styles.nameCol]}>NAME</Text>
              <Text style={[styles.th, styles.emailCol]}>EMAIL</Text>
              <Text style={[styles.th, styles.phoneCol]}>PHONE</Text>
              <Text style={[styles.th, styles.addressCol]}>ADDRESS</Text>
              <Text style={[styles.th, styles.requestsCol]}>REQUESTS</Text>
              <Text style={[styles.th, styles.joinedCol]}>JOINED</Text>
            </View>
            {residents.map(resident => {
              const total = requests.filter(r => r.user_id === resident.id).length;
              return (
                <View key={resident.id} style={styles.tableRow}>
                  <View style={[styles.nameCell, styles.nameCol]}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{initials(resident.full_name)}</Text></View>
                    <Text style={styles.tdStrong}>{resident.full_name}</Text>
                  </View>
                  <Text style={[styles.td, styles.emailCol]} numberOfLines={1}>{resident.email}</Text>
                  <Text style={[styles.td, styles.phoneCol]} numberOfLines={1}>{resident.phone || '-'}</Text>
                  <Text style={[styles.td, styles.addressCol]} numberOfLines={1}>{resident.address || '-'}</Text>
                  <View style={styles.requestsCol}>
                    <View style={styles.greenPill}><Text style={styles.greenPillText}>{total} request{total === 1 ? '' : 's'}</Text></View>
                  </View>
                  <Text style={[styles.td, styles.joinedCol]}>{formatDate(resident.created_at)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  }

  // ── Audit mode ──────────────────────────────────────────────────────────────
  if (mode === 'audit') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}>
        <Text style={styles.pageTitle}>Audit Trail</Text>
        <Text style={styles.pageSubtitle}>Complete log of all system actions.</Text>

        {isMobile ? (
          logs.map(log => (
            <View key={log.id} style={styles.requestCard}>
              <View style={styles.cardTopRow}>
                <View style={[styles.actionPill, log.action.includes('REQUEST') && styles.actionPillGreen]}>
                  <Text style={[styles.actionPillText, log.action.includes('REQUEST') && styles.actionPillGreenText]} numberOfLines={1}>
                    {log.action}
                  </Text>
                </View>
                <Text style={styles.cardDate}>{formatDateTime(log.created_at)}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>User</Text>
                <Text style={styles.cardValue}>{users[log.user_id]?.full_name || 'System'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Entity</Text>
                <Text style={styles.cardValue}>{log.entity_type} #{log.entity_id}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Details</Text>
                <Text style={[styles.cardValue, { color: COLORS.textMuted }]} numberOfLines={2}>{log.new_value}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.tableCard}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, styles.timeCol]}>TIMESTAMP</Text>
              <Text style={[styles.th, styles.auditUserCol]}>USER</Text>
              <Text style={[styles.th, styles.auditActionCol]}>ACTION</Text>
              <Text style={[styles.th, styles.entityCol]}>ENTITY</Text>
              <Text style={[styles.th, styles.detailsCol]}>DETAILS</Text>
            </View>
            {logs.map(log => (
              <View key={log.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.timeCol]} numberOfLines={1}>{formatDateTime(log.created_at)}</Text>
                <Text style={[styles.td, styles.auditUserCol]} numberOfLines={1}>{users[log.user_id]?.full_name || 'System'}</Text>
                <View style={styles.auditActionCol}>
                  <View style={[styles.actionPill, log.action.includes('REQUEST') && styles.actionPillGreen]}>
                    <Text style={[styles.actionPillText, log.action.includes('REQUEST') && styles.actionPillGreenText]} numberOfLines={1}>{log.action}</Text>
                  </View>
                </View>
                <Text style={[styles.td, styles.entityCol]} numberOfLines={1}>{log.entity_type} #{log.entity_id}</Text>
                <Text style={[styles.muted, styles.detailsCol]} numberOfLines={1}>{log.new_value}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  // ── Requests mode (default) ─────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}>
      <Text style={styles.pageTitle}>All Certificate Requests</Text>
      <Text style={styles.pageSubtitle}>Review, approve, and manage all resident requests.</Text>

      {/* Filters */}
      <View style={[styles.filters, isMobile && styles.filtersMobile]}>
        <View style={[styles.searchBox, isMobile && styles.searchBoxMobile]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, code..."
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
          <FilterPicker
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />
          <FilterPicker
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={PRIORITY_OPTIONS}
          />
        </View>
      </View>

      {/* Table (desktop) / Cards (mobile) */}
      {isMobile ? (
        <View>
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyTitle}>No Requests Found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
            </View>
          ) : (
            filteredRequests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                resident={users[request.user_id]}
                cert={certs[request.certificate_type_id]}
                onManage={setSelectedRequest}
                onQr={setQrRequest}
              />
            ))
          )}
        </View>
      ) : (
        <View style={styles.tableCard}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.reqCodeCol]}>CODE</Text>
            <Text style={[styles.th, styles.reqResidentCol]}>RESIDENT</Text>
            <Text style={[styles.th, styles.reqCertCol]}>CERTIFICATE</Text>
            <Text style={[styles.th, styles.purposeCol]}>PURPOSE</Text>
            <Text style={[styles.th, styles.reqPriorityCol]}>PRIORITY</Text>
            <Text style={[styles.th, styles.reqDateCol]}>DATE</Text>
            <Text style={[styles.th, styles.reqStatusCol]}>STATUS</Text>
            <Text style={[styles.th, styles.reqActionsCol]}>ACTIONS</Text>
          </View>
          {filteredRequests.map(request => {
            const resident = users[request.user_id];
            const cert = certs[request.certificate_type_id];
            const hasQr = ['approved', 'released'].includes(request.status);
            return (
              <View key={request.id} style={styles.tableRow}>
                <Text style={[styles.tdStrong, styles.reqCodeCol]} numberOfLines={1}>{request.request_code}</Text>
                <View style={styles.reqResidentCol}>
                  <Text style={styles.td} numberOfLines={1}>{resident?.full_name || 'Resident'}</Text>
                  <Text style={styles.muted} numberOfLines={1}>{resident?.email || ''}</Text>
                </View>
                <Text style={[styles.td, styles.reqCertCol]} numberOfLines={1}>{cert?.name || 'Certificate'}</Text>
                <Text style={[styles.td, styles.purposeCol]} numberOfLines={1}>{request.purpose}</Text>
                <View style={styles.reqPriorityCol}><Pill value={request.priority} type="priority" /></View>
                <Text style={[styles.td, styles.reqDateCol]} numberOfLines={1}>{formatDateTime(request.requested_at)}</Text>
                <View style={styles.reqStatusCol}><Pill value={request.status} /></View>
                <View style={[styles.reqActionsCol, styles.actionButtons]}>
                  <TouchableOpacity style={styles.manageButton} onPress={() => setSelectedRequest(request)}>
                    <Text style={styles.manageButtonText}>Manage</Text>
                  </TouchableOpacity>
                  {hasQr && (
                    <TouchableOpacity style={styles.qrButton} onPress={() => setQrRequest(request)}>
                      <Text style={styles.qrButtonText}>QR</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Manage Modal */}
      <Modal visible={!!selectedRequest} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.manageModalCard}>
            {selectedRequest ? (() => {
              const resident = users[selectedRequest.user_id];
              const cert = certs[selectedRequest.certificate_type_id];
              const actions = NEXT_ACTIONS[selectedRequest.status] || [];
              return (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.manageTitle} numberOfLines={1}>
                      Manage: {selectedRequest.request_code}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedRequest(null)} style={styles.closeIconButton}>
                      <Text style={styles.closeIcon}>×</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView contentContainerStyle={styles.manageBody}>
                    <View style={styles.manageInfoBox}>
                      <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>Resident:</Text>
                        <Text style={styles.infoValue}>{resident?.full_name || 'Resident'}</Text>
                        <Text style={styles.infoMuted}>{resident?.email || '-'}</Text>
                        <Text style={styles.infoLabel}>Certificate:</Text>
                        <Text style={styles.infoValue}>{cert?.name || 'Certificate'}</Text>
                        <Text style={styles.infoLabel}>Purpose:</Text>
                        <Text style={styles.infoValue}>{selectedRequest.purpose}</Text>
                        <Text style={styles.infoLabel}>Phone:</Text>
                        <Text style={styles.infoValue}>{resident?.phone || '-'}</Text>
                      </View>
                      <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>Address:</Text>
                        <Text style={styles.infoValue}>{resident?.address || '-'}</Text>
                        <Text style={styles.infoLabel}>Fee:</Text>
                        <Text style={styles.infoValue}>₱{(cert?.fee || 0).toFixed(2)}</Text>
                        <Text style={styles.infoLabel}>Priority:</Text>
                        <Pill value={selectedRequest.priority} type="priority" />
                        <Text style={styles.infoLabel}>Submitted:</Text>
                        <Text style={styles.infoValue}>{formatDateTime(selectedRequest.requested_at)}</Text>
                      </View>
                    </View>
                    <View style={styles.statusLine}>
                      <Text style={styles.currentStatus}>Current Status:</Text>
                      <Pill value={selectedRequest.status} />
                    </View>
                    <Text style={styles.remarksLabel}>Remarks / Notes for Resident</Text>
                    <TextInput
                      style={styles.manageInput}
                      value={remarks[selectedRequest.id] || ''}
                      onChangeText={text => setRemarks(prev => ({ ...prev, [selectedRequest.id]: text }))}
                      placeholder="Enter any remarks or reason for decision..."
                      placeholderTextColor={COLORS.textLight}
                      multiline
                    />
                    {actions.length ? (
                      <View style={styles.manageActionRow}>
                        {actions.map(action => (
                          <TouchableOpacity
                            key={action.status}
                            style={[styles.manageActionButton, styles[action.style]]}
                            onPress={() => handleStatus(selectedRequest, action.status)}
                          >
                            <Text style={[styles.manageActionText, action.style === 'outline' && styles.outlineText]}>
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <Text style={[styles.finalStatusText, selectedRequest.status === 'released' ? styles.finalReleased : styles.finalRejected]}>
                        {selectedRequest.status === 'released' ? '✅ Fully Processed' : 'Request was rejected.'}
                      </Text>
                    )}
                  </ScrollView>
                  <View style={styles.manageFooter}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedRequest(null)}>
                      <Text style={styles.cancelButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })() : null}
          </View>
        </View>
      </Modal>

      {/* QR Modal */}
      <Modal visible={!!qrRequest} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalCard}>
            {qrRequest ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.manageTitle}>QR Certificate Verification</Text>
                  <TouchableOpacity onPress={() => setQrRequest(null)} style={styles.closeIconButton}>
                    <Text style={styles.closeIcon}>×</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.qrModalBody}>
                  <CertificatePreview
                    request={qrRequest}
                    resident={users[qrRequest.user_id]}
                    cert={certs[qrRequest.certificate_type_id]}
                  />
                </ScrollView>
                <View style={styles.manageFooter}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setQrRequest(null)}>
                    <Text style={styles.cancelButtonText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.printButton} onPress={printCertificate}>
                    <Text style={styles.printButtonText}>🖨️ Print</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.primaryDark, flex: 1 },
  content: { padding: 28, paddingBottom: 40 },
  contentMobile: { padding: 14, paddingBottom: 24 },

  pageTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  pageSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13.5, marginBottom: 22 },

  // Filters
  filters: { flexDirection: 'row', gap: 10, marginBottom: 18, alignItems: 'flex-start' },
  filtersMobile: { flexDirection: 'column', gap: 8 },
  searchBox: {
    alignItems: 'center', backgroundColor: '#fff', borderColor: COLORS.border,
    borderRadius: 7, borderWidth: 1, flexDirection: 'row', height: 42,
    paddingHorizontal: 14, width: 280,
  },
  searchBoxMobile: { width: '100%' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { color: COLORS.text, flex: 1, fontSize: 14, outlineWidth: 0 },

  filterRow: { flexDirection: 'row', gap: 10 },
  filterRowMobile: { flexDirection: 'row', gap: 8, flex: 1 },

  filterBtn: {
    alignItems: 'center', backgroundColor: '#fff', borderColor: COLORS.border,
    borderRadius: 7, borderWidth: 1, flexDirection: 'row', height: 42,
    paddingHorizontal: 12, minWidth: 130,
  },
  filterBtnText: { color: COLORS.text, flex: 1, fontSize: 13.5, fontWeight: '600' },
  filterBtnChevron: { color: COLORS.textMuted, fontSize: 12, marginLeft: 6 },

  filterModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  filterDropdown: {
    backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden',
    minWidth: 200, elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12,
  },
  filterOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomColor: COLORS.border, borderBottomWidth: 1,
  },
  filterOptionActive: { backgroundColor: '#eaf4fb' },
  filterOptionText: { flex: 1, color: COLORS.text, fontSize: 14 },
  filterOptionTextActive: { color: COLORS.primary, fontWeight: '800' },
  filterOptionCheck: { color: COLORS.primary, fontSize: 15, fontWeight: '800' },

  // Desktop table
  tableCard: {
    backgroundColor: '#fff', borderColor: COLORS.border,
    borderRadius: 10, borderWidth: 1, overflow: 'hidden',
  },
  tableHead: {
    backgroundColor: COLORS.bg, borderBottomColor: COLORS.border,
    borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12,
  },
  th: { color: '#3d536a', fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  tableRow: {
    alignItems: 'center', borderBottomColor: COLORS.border, borderBottomWidth: 1,
    flexDirection: 'row', minHeight: 70, paddingHorizontal: 14, paddingVertical: 10,
  },
  td: { color: COLORS.text, fontSize: 12.5 },
  tdStrong: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  muted: { color: COLORS.textMuted, fontSize: 11 },

  // Mobile request card
  requestCard: {
    backgroundColor: '#fff', borderColor: COLORS.border, borderRadius: 12,
    borderWidth: 1, marginBottom: 10, overflow: 'hidden', padding: 14,
    elevation: 1, shadowColor: '#1a5276', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardTopRow: {
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'space-between', marginBottom: 10,
  },
  cardCode: { color: COLORS.text, fontSize: 13.5, fontWeight: '800', flex: 1, marginRight: 8 },
  cardRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 4, borderTopColor: COLORS.border, borderTopWidth: 0.5,
  },
  cardLabel: {
    color: COLORS.textMuted, fontSize: 11.5, fontWeight: '700',
    width: 80, paddingTop: 1,
  },
  cardValue: { color: COLORS.text, fontSize: 12.5, flex: 1 },
  cardBottomRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 10,
    paddingTop: 8, borderTopColor: COLORS.border, borderTopWidth: 0.5,
  },
  cardDate: { color: COLORS.textMuted, fontSize: 11.5 },
  cardActions: {
    flexDirection: 'row', gap: 8, marginTop: 10,
    paddingTop: 10, borderTopColor: COLORS.border, borderTopWidth: 0.5,
  },

  // Shared pill / badge
  pill: { alignSelf: 'flex-start', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: '800', textTransform: 'lowercase' },

  // Buttons
  actionButtons: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  manageButton: {
    alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 7,
    flex: 1, paddingHorizontal: 14, paddingVertical: 10,
  },
  manageButtonText: { color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  qrButton: {
    alignItems: 'center', borderColor: COLORS.primary, borderRadius: 7,
    borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 10,
  },
  qrButtonText: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },

  // Avatar / name cell
  nameCell: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  avatar: {
    alignItems: 'center', backgroundColor: COLORS.primaryLight,
    borderRadius: 15, height: 30, justifyContent: 'center', width: 30,
  },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  greenPill: {
    alignSelf: 'flex-start', backgroundColor: '#eafaf1',
    borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6,
  },
  greenPillText: { color: COLORS.success, fontSize: 11, fontWeight: '800' },
  actionPill: {
    alignSelf: 'flex-start', backgroundColor: '#eaf4fb',
    borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6,
  },
  actionPillText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
  actionPillGreen: { backgroundColor: '#eafaf1' },
  actionPillGreenText: { color: COLORS.success },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 42, marginBottom: 10, opacity: 0.45 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 13.5, textAlign: 'center' },

  // Modals
  modalOverlay: {
    alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1, justifyContent: 'center', padding: 16,
  },
  manageModalCard: {
    backgroundColor: '#fff', borderRadius: 12, maxHeight: '94%',
    maxWidth: 536, overflow: 'hidden', width: '100%',
  },
  qrModalCard: {
    backgroundColor: '#fff', borderRadius: 12, maxHeight: '94%',
    maxWidth: 536, overflow: 'hidden', width: '100%',
  },
  modalHeader: {
    alignItems: 'center', borderBottomColor: COLORS.border, borderBottomWidth: 1,
    flexDirection: 'row', height: 72, justifyContent: 'space-between', paddingHorizontal: 20,
  },
  manageTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', flex: 1 },
  closeIconButton: { padding: 4 },
  closeIcon: { color: COLORS.textMuted, fontSize: 28, lineHeight: 30 },
  manageBody: { padding: 20 },
  manageInfoBox: {
    backgroundColor: COLORS.bg, borderRadius: 7,
    flexDirection: 'row', gap: 24, padding: 14,
  },
  infoColumn: { flex: 1 },
  infoLabel: { color: COLORS.textMuted, fontSize: 13, marginTop: 11 },
  infoValue: { color: COLORS.text, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  infoMuted: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  statusLine: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 18 },
  currentStatus: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  remarksLabel: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 18 },
  manageInput: {
    borderColor: COLORS.border, borderRadius: 7, borderWidth: 1,
    color: COLORS.text, fontSize: 15, minHeight: 89, outlineWidth: 0,
    padding: 13, textAlignVertical: 'top',
  },
  manageActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 },
  manageActionButton: { borderRadius: 7, paddingHorizontal: 12, paddingVertical: 8 },
  manageActionText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  finalStatusText: { fontSize: 16, fontWeight: '800', marginTop: 24 },
  finalRejected: { color: COLORS.danger },
  finalReleased: { color: COLORS.success },
  manageFooter: {
    alignItems: 'center', borderTopColor: COLORS.border, borderTopWidth: 1,
    flexDirection: 'row', gap: 14, height: 64,
    justifyContent: 'flex-end', paddingHorizontal: 18,
  },
  qrModalBody: { padding: 20 },
  primary: { backgroundColor: COLORS.primary },
  success: { backgroundColor: COLORS.success },
  danger: { backgroundColor: COLORS.danger },
  outline: { backgroundColor: '#fff', borderColor: COLORS.primary, borderWidth: 1.2 },
  outlineText: { color: COLORS.primary },
  cancelButton: { paddingHorizontal: 12, paddingVertical: 9 },
  cancelButtonText: { color: COLORS.textMuted, fontSize: 12.5, fontWeight: '800' },
  printButton: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11 },
  printButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Certificate
  certificatePaper: { backgroundColor: '#fff', borderColor: COLORS.primaryDark, borderRadius: 4, borderWidth: 2, padding: 6 },
  certificateBorder: { borderColor: COLORS.accent, borderRadius: 2, borderWidth: 1, minHeight: 520, padding: 28 },
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
  certFooter: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingRight: 8 },
  signatureBlock: { alignItems: 'center', width: 150, marginLeft: 0 },
  signatureLine: { borderTopColor: COLORS.text, borderTopWidth: 1.5, marginBottom: 7, width: 140 },
  signName: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  signOffice: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  qrBox: { alignItems: 'center', width: 104, marginRight: 0 },
  qrLabel: { color: COLORS.textMuted, fontSize: 10.5, fontWeight: '700', marginTop: 6 },
  certificateCode: { color: COLORS.textMuted, fontSize: 13, marginTop: 20, textAlign: 'center' },
  bold: { fontWeight: '800' },

  // Desktop column widths
  reqCodeCol: { flex: 1.0 },
  reqResidentCol: { flex: 1.25 },
  reqCertCol: { flex: 1.6 },
  purposeCol: { flex: 1.3 },
  reqPriorityCol: { flex: 0.65 },
  reqDateCol: { flex: 1.0 },
  reqStatusCol: { flex: 0.85 },
  reqActionsCol: { flex: 1.3, alignItems: 'flex-end' },
  nameCol: { flex: 1.5 },
  emailCol: { flex: 1.5 },
  phoneCol: { flex: 1.2 },
  addressCol: { flex: 2.0 },
  requestsCol: { flex: 1.1 },
  joinedCol: { flex: 1.0 },
  timeCol: { flex: 1.3 },
  auditUserCol: { flex: 1.2 },
  auditActionCol: { flex: 1.3 },
  entityCol: { flex: 1.2 },
  detailsCol: { flex: 1.9 },
});