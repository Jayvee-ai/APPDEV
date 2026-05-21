import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DB } from '../database/db';
import { COLORS } from '../theme/theme';
 
const STATUS_META = {
  pending: { icon: '⌛', label: 'Pending', color: '#f39c12', bg: '#fef9e7' },
  under_review: { icon: '🔍', label: 'Under Review', color: COLORS.primaryLight, bg: '#eaf4fb' },
  approved: { icon: '✅', label: 'Approved', color: COLORS.successLight, bg: '#eafaf1' },
  released: { icon: '📫', label: 'Released', color: COLORS.primary, bg: '#ebf5fb' },
  total: { icon: '📊', label: 'Total Requests', color: COLORS.accent, bg: '#fff9d9' },
  residents: { icon: '👥', label: 'Residents', color: COLORS.primaryLight, bg: '#eaf2f8' },
};
 
const BADGE_COLORS = {
  pending: { bg: '#fef9e7', color: COLORS.warning },
  under_review: { bg: '#eaf4fb', color: COLORS.primary },
  approved: { bg: '#eafaf1', color: COLORS.success },
  released: { bg: '#ebf5fb', color: COLORS.primary },
  rejected: { bg: '#fdedec', color: COLORS.danger },
};
 
const PRIORITY_COLORS = {
  urgent: { bg: '#fdecea', color: COLORS.danger },
  normal: { bg: '#f4f6f7', color: COLORS.textMuted },
};
 
function statusLabel(status) {
  return status.replace(/_/g, ' ');
}
 
function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}
 
function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
 
function StatusBadge({ status }) {
  const meta = BADGE_COLORS[status] || BADGE_COLORS.pending;
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.color }]}>{statusLabel(status)}</Text>
    </View>
  );
}
 
function PriorityBadge({ priority }) {
  const meta = PRIORITY_COLORS[priority] || PRIORITY_COLORS.normal;
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.color }]}>{priority || 'normal'}</Text>
    </View>
  );
}
 
export default function AdminDashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;
  const isMobile = width < 760;
 
  const [stats, setStats] = useState({
    pending: 0,
    under_review: 0,
    approved: 0,
    released: 0,
    total: 0,
    residents: 0,
  });
  const [recent, setRecent] = useState([]);
  const [users, setUsers] = useState({});
  const [certs, setCerts] = useState({});
 
  const load = useCallback(async () => {
    const [requests, userRows, certRows] = await Promise.all([
      DB.getRequests(),
      DB.getUsers(),
      DB.getCertTypes(),
    ]);
 
    const counts = { pending: 0, under_review: 0, approved: 0, released: 0 };
    requests.forEach(r => {
      if (counts[r.status] !== undefined) counts[r.status] += 1;
    });
 
    setStats({
      ...counts,
      total: requests.length,
      residents: userRows.filter(u => u.role === 'resident').length,
    });
 
    setRecent(
      [...requests]
        .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))
        .slice(0, 5)
    );
    setUsers(userRows.reduce((map, u) => ({ ...map, [u.id]: u }), {}));
    setCerts(certRows.reduce((map, c) => ({ ...map, [c.id]: c }), {}));
  }, []);
 
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
 
  const statKeys = ['pending', 'under_review', 'approved', 'released', 'total', 'residents'];
 
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
    >
      <Text style={styles.pageTitle}>Admin Dashboard 🛠️</Text>
      <Text style={styles.pageSubtitle}>
        Barangay Bued — Digital Certificate Request Management System
      </Text>
 
      {/* Stats Grid */}
      <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
        {statKeys.map(key => {
          const meta = STATUS_META[key];
          return (
            <Card
              key={key}
              style={[
                styles.statCard,
                isWide && styles.statCardWide,
                isMobile && styles.statCardMobile,
              ]}
            >
              <View style={[styles.statAccent, { backgroundColor: meta.color }]} />
              <View
                style={[
                  styles.statIcon,
                  isMobile && styles.statIconMobile,
                  { backgroundColor: meta.bg },
                ]}
              >
                <Text style={styles.statIconText}>{meta.icon}</Text>
              </View>
              <Text style={[styles.statValue, isMobile && styles.statValueMobile]}>
                {stats[key] ?? 0}
              </Text>
              <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>
                {meta.label}
              </Text>
            </Card>
          );
        })}
      </View>
 
      {/* Recent Requests Table */}
      <Card style={styles.recentCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Requests — Action Required</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AdminRequests')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
 
        <View style={styles.tableHead}>
          <Text style={[styles.tableHeadText, styles.colCode]}>CODE</Text>
          {!isMobile && <Text style={[styles.tableHeadText, styles.colResident]}>RESIDENT</Text>}
          <Text style={[styles.tableHeadText, styles.colCert]}>TYPE</Text>
          {!isMobile && <Text style={[styles.tableHeadText, styles.colPriority]}>PRIORITY</Text>}
          {!isMobile && <Text style={[styles.tableHeadText, styles.colDate]}>DATE</Text>}
          <Text style={[styles.tableHeadText, styles.colStatus]}>STATUS</Text>
          <Text style={[styles.tableHeadText, styles.colAction]}>ACTION</Text>
        </View>
 
        {recent.length > 0 ? (
          recent.map(request => (
            <View key={request.id} style={styles.tableRow}>
              <Text style={[styles.requestCode, styles.colCode]} numberOfLines={1}>
                {request.request_code}
              </Text>
              {!isMobile && (
                <Text style={[styles.requestType, styles.colResident]} numberOfLines={1}>
                  {users[request.user_id]?.full_name || 'Resident'}
                </Text>
              )}
              <Text style={[styles.requestType, styles.colCert]} numberOfLines={1}>
                {certs[request.certificate_type_id]?.name || 'Certificate'}
              </Text>
              {!isMobile && (
                <View style={styles.colPriority}>
                  <PriorityBadge priority={request.priority} />
                </View>
              )}
              {!isMobile && (
                <Text style={[styles.requestType, styles.colDate]} numberOfLines={1}>
                  {formatShortDate(request.requested_at)}
                </Text>
              )}
              <View style={styles.colStatus}>
                <StatusBadge status={request.status} />
              </View>
              <View style={styles.colAction}>
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => navigation.navigate('AdminRequests')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.manageButtonText}>Manage</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No Requests Yet</Text>
            <Text style={styles.emptyText}>Requests from residents will appear here.</Text>
          </View>
        )}
      </Card>
 
      {/* Quick Actions */}
      <Card style={[styles.quickCard, isMobile && styles.quickCardMobile]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickBody}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('AdminRequests')}
          >
            <Text style={styles.primaryButtonText}>📋 Manage All Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('AdminResidents')}
          >
            <Text style={styles.secondaryButtonText}>👥 Manage Residents</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('AdminAuditLogs')}
          >
            <Text style={styles.secondaryButtonText}>📄 Manage Audit Logs</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
}
 
const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.primaryDark, flex: 1 },
  content: { padding: 28, paddingBottom: 40 },
  contentMobile: { padding: 14, paddingBottom: 18 },
  pageTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  pageSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13.5, marginBottom: 26 },
 
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  statsGridMobile: { gap: 8, marginBottom: 14 },
 
  card: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    overflow: 'hidden',
    shadowColor: '#1a5276',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 18,
  },
 
  statCard: { flexBasis: '48%', flexGrow: 1, minHeight: 146, padding: 20, position: 'relative' },
  statCardMobile: { flexBasis: '48%', minHeight: 82, padding: 12 },
  statCardWide: { flexBasis: '15%' },
  statAccent: { height: 3, left: 0, position: 'absolute', right: 0, top: 0 },
  statIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 42,
    justifyContent: 'center',
    marginBottom: 12,
    width: 42,
  },
  statIconMobile: { height: 30, marginBottom: 4, width: 30 },
  statIconText: { fontSize: 20 },
  statValue: { color: COLORS.text, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  statValueMobile: { fontSize: 21, lineHeight: 25 },
  statLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500', marginTop: 4 },
  statLabelMobile: { fontSize: 10.5, marginTop: 2 },
 
  recentCard: { marginBottom: 18 },
  cardHeader: {
    alignItems: 'center',
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  viewAll: { color: COLORS.primary, fontSize: 12, fontWeight: '500' },
 
  tableHead: {
    backgroundColor: COLORS.bg,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  tableHeadText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  tableRow: {
    alignItems: 'center',
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  colCode: { flex: 1.1 },
  colResident: { flex: 1.2 },
  colCert: { flex: 1.6 },
  colPriority: { flex: 0.7 },
  colDate: { flex: 0.7 },
  colStatus: { flex: 0.9 },
  colAction: { flex: 1.0, alignItems: 'flex-end' },
 
  requestCode: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  requestType: { color: COLORS.text, fontSize: 12.5 },
 
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11.5, fontWeight: '700', textTransform: 'lowercase' },
 
  manageButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  manageButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
 
  emptyState: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  emptyIcon: { fontSize: 42, marginBottom: 10, opacity: 0.45 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptyText: { color: COLORS.textMuted, fontSize: 13.5, textAlign: 'center' },
 
  quickCard: {},
  quickCardMobile: {},
  quickBody: { gap: 10, padding: 20, paddingTop: 18 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minHeight: 46,
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: COLORS.primary,
    borderRadius: 8,
    borderWidth: 1.3,
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});