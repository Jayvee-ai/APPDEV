// src/screens/DashboardScreen.js
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
};

const BADGE_COLORS = {
  pending: { bg: '#fef9e7', color: COLORS.warning },
  under_review: { bg: '#eaf4fb', color: COLORS.primary },
  approved: { bg: '#eafaf1', color: COLORS.success },
  released: { bg: '#ebf5fb', color: COLORS.primary },
  rejected: { bg: '#fdedec', color: COLORS.danger },
};

function statusLabel(status) {
  return status.replace(/_/g, ' ');
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

export default function DashboardScreen({ user, navigation }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;
  const isMobile = width < 760;
  const [stats, setStats] = useState({
    pending: 0,
    under_review: 0,
    approved: 0,
    released: 0,
  });
  const [availableCerts, setAvailableCerts] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [certMap, setCertMap] = useState({});

  const loadDashboardData = useCallback(async () => {
    const certs = await DB.getCertTypes();
    const activeCerts = certs.filter(cert => cert.is_active);
    const nextCertMap = certs.reduce((map, cert) => ({ ...map, [cert.id]: cert }), {});

    const requests = await DB.getRequests();
    const userRequests = requests
      .filter(request => request.user_id === user.id)
      .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));

    const counts = { pending: 0, under_review: 0, approved: 0, released: 0 };
    userRequests.forEach(request => {
      if (counts[request.status] !== undefined) counts[request.status] += 1;
    });

    setAvailableCerts(activeCerts);
    setCertMap(nextCertMap);
    setRecentRequests(userRequests.slice(0, 5));
    setStats(counts);
  }, [user.id]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}>
      <Text style={styles.pageTitle}>Welcome back, {user.full_name.split(' ')[0]}! 👋</Text>
      <Text style={styles.pageSubtitle}>Here's a summary of your certificate requests.</Text>

      <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <Card key={key} style={[styles.statCard, isWide && styles.statCardWide, isMobile && styles.statCardMobile]}>
            <View style={[styles.statAccent, { backgroundColor: meta.color }]} />
            <View style={[styles.statIcon, isMobile && styles.statIconMobile, { backgroundColor: meta.bg }]}>
              <Text style={styles.statIconText}>{meta.icon}</Text>
            </View>
            <Text style={[styles.statValue, isMobile && styles.statValueMobile]}>{stats[key]}</Text>
            <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>{meta.label}</Text>
          </Card>
        ))}
      </View>

      <View style={[styles.dashGrid, isWide && styles.dashGridWide]}>
        <Card style={[styles.recentCard, isWide && styles.recentCardWide, isMobile && styles.recentCardMobile]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Requests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Track')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadText, styles.colRequest]}>REQUEST</Text>
            <Text style={[styles.tableHeadText, styles.colType]}>TYPE</Text>
            <Text style={[styles.tableHeadText, styles.colStatus]}>STATUS</Text>
          </View>

          {recentRequests.length > 0 ? (
            recentRequests.slice(0, isMobile ? 3 : 5).map(request => {
              const cert = certMap[request.certificate_type_id];

              return (
                <TouchableOpacity
                  key={request.id}
                  style={styles.tableRow}
                  onPress={() => navigation.navigate('Track')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.requestCode, styles.colRequest]} numberOfLines={1}>{request.request_code}</Text>
                  <Text style={[styles.requestType, styles.colType]} numberOfLines={1}>{cert?.name || 'Certificate Request'}</Text>
                  <View style={styles.colStatus}>
                    <StatusBadge status={request.status} />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyTitle}>No Requests Yet</Text>
              <Text style={styles.emptyText}>Submit your first certificate request.</Text>
            </View>
          )}
        </Card>

        <Card style={[styles.quickCard, isWide && styles.quickCardWide, isMobile && styles.quickCardMobile]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickBody}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Request')}>
              <Text style={styles.primaryButtonText}>📄 Request a Certificate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Track')}>
              <Text style={styles.secondaryButtonText}>📋 Track My Requests</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
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
  },
  statCard: { flexBasis: '48%', flexGrow: 1, minHeight: 146, padding: 20, position: 'relative' },
  statCardMobile: { flexBasis: '48%', minHeight: 82, padding: 12 },
  statCardWide: { flexBasis: '23%' },
  statAccent: { height: 3, left: 0, position: 'absolute', right: 0, top: 0 },
  statIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 42,
    justifyContent: 'center',
    marginBottom: 12,
    width: 42,
  },
  statIconText: { fontSize: 20 },
  statIconMobile: { height: 30, marginBottom: 4, width: 30 },
  statValue: { color: COLORS.text, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  statValueMobile: { fontSize: 21, lineHeight: 25 },
  statLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500', marginTop: 4 },
  statLabelMobile: { fontSize: 10.5, marginTop: 2 },
  dashGrid: { gap: 18, marginBottom: 20 },
  dashGridWide: { flexDirection: 'row' },
  recentCard: { minHeight: 254 },
  recentCardMobile: { minHeight: 0 },
  recentCardWide: { flex: 1 },
  quickCard: { minHeight: 254 },
  quickCardMobile: { minHeight: 0 },
  quickCardWide: { flex: 1 },
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
    minHeight: 51,
    paddingHorizontal: 14,
  },
  colRequest: { flex: 1.2 },
  colType: { flex: 1.9 },
  colStatus: { flex: 0.8 },
  requestCode: { color: COLORS.text, fontSize: 13.5, fontWeight: '800' },
  requestType: { color: COLORS.text, fontSize: 12.5 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11.5, fontWeight: '700', textTransform: 'lowercase' },
  emptyState: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  emptyIcon: { fontSize: 42, marginBottom: 10, opacity: 0.45 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptyText: { color: COLORS.textMuted, fontSize: 13.5, textAlign: 'center' },
  quickBody: { gap: 10, padding: 20, paddingTop: 18 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minHeight: 46,
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  outlineButton: {
    alignItems: 'center',
    borderColor: COLORS.primary,
    borderRadius: 8,
    borderWidth: 1.3,
    minHeight: 38,
    justifyContent: 'center',
  },
  outlineButtonText: { color: COLORS.primary, fontSize: 13.5, fontWeight: '700' },
  ghostButton: { alignItems: 'center', borderRadius: 8, minHeight: 38, justifyContent: 'center', marginTop: 2 },
  ghostActionText: { color: COLORS.textMuted, fontSize: 13.5, fontWeight: '600' },
  certGrid: { gap: 12, padding: 20 },
  certGridMobile: { padding: 14, paddingRight: 2 },
  certGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  certCard: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1.3,
    minHeight: 194,
    padding: 20,
  },
  certCardMobile: { minHeight: 146, padding: 14, width: 174 },
  certCardWide: { width: 212 },
  certIcon: { fontSize: 21, marginBottom: 16, opacity: 0.8 },
  certName: { color: COLORS.text, fontSize: 13.5, fontWeight: '800', lineHeight: 19, marginBottom: 6 },
  certDesc: { color: COLORS.textMuted, flex: 1, fontSize: 12, lineHeight: 18 },
  certFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  certFee: { color: COLORS.primary, fontSize: 12.5, fontWeight: '800' },
  certDays: { color: COLORS.textMuted, fontSize: 11.5 },
});
