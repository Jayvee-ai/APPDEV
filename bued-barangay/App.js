// App.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';

import { DB } from './src/database/db';
import { COLORS } from './src/theme/theme';

import AuthScreen from './src/screens/AuthScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminRequestsScreen from './src/screens/AdminRequestsScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RequestScreen from './src/screens/RequestScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import VerifyCertificateScreen from './src/screens/VerifyCertificateScreen';

const Tab = createBottomTabNavigator();

const PAGE_TITLES = {
  Dashboard: 'Dashboard',
  AdminDashboard: 'Admin Dashboard',
  AdminRequests: 'All Requests',
  AdminResidents: 'Residents',
  AdminAuditLogs: 'Audit Logs',
  Request: 'Request Certificate',
  Track: 'My Requests',
  Notifications: 'Notifications',
  Verify: 'Verify Certificate',
};

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const { width } = useWindowDimensions();
  const [dbReady, setDbReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeScreen, setActiveScreen] = useState('Dashboard');
  const [counts, setCounts] = useState({ pending: 0, unread: 0 });
  const [verificationCode, setVerificationCode] = useState('');
  const isAdmin = currentUser && ['admin', 'super_admin'].includes(currentUser.role);
  const isMobile = width < 760;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.title = 'Barangay Bued \u2013 Digital Certificate';

    const faviconSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="8" fill="#2b2d31"/>
        <text x="32" y="45" text-anchor="middle" font-size="38">&#x1F3DB;&#xFE0F;</text>
      </svg>
    `);
    const faviconHref = `data:image/svg+xml,${faviconSvg}`;
    let favicon = document.querySelector("link[rel='icon']");

    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }

    favicon.href = faviconHref;
  }, []);

  useEffect(() => {
    async function prepare() {
      await DB.init();
      if (typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search || '');
        const code = params.get('verify');
        if (code) setVerificationCode(code);
      }
      setDbReady(true);
    }
    prepare();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    refreshBadges();
  }, [currentUser, activeScreen]);

  const navItems = useMemo(() => {
    if (isAdmin) {
      return [
        { label: 'DASHBOARD', items: [{ page: 'AdminDashboard', icon: '📊', name: 'Overview' }] },
        {
          label: 'MANAGEMENT',
          items: [
            { page: 'AdminRequests', icon: '📋', name: 'All Requests', badge: counts.pending },
            { page: 'AdminResidents', icon: '👥', name: 'Residents' },
          ],
        },
        {
          label: 'SYSTEM',
          items: [
            { page: 'AdminAuditLogs', icon: '🔐', name: 'Audit Logs' },
            { page: 'Notifications', icon: '🔔', name: 'Notifications', badge: counts.unread },
            { page: 'Verify', icon: '🔍', name: 'Verify QR' },
          ],
        },
      ];
    }

    return [
      {
        label: 'MAIN',
        items: [
          { page: 'Dashboard', icon: '🏠', name: 'Dashboard' },
          { page: 'Request', icon: '📄', name: 'Request Certificate' },
          { page: 'Track', icon: '📋', name: 'My Requests', badge: counts.pending },
          { page: 'Notifications', icon: '🔔', name: 'Notifications', badge: counts.unread },
        ],
      },
      {
        label: 'TOOLS',
        items: [{ page: 'Verify', icon: '🔍', name: 'Verify Certificate' }],
      },
    ];
  }, [counts.pending, counts.unread, isAdmin]);

  const flatNavItems = useMemo(() => navItems.flatMap(section => section.items), [navItems]);

  async function refreshBadges() {
    const requests = await DB.getRequests();
    const notifications = await DB.getNotifications(currentUser.id);
    setCounts({
      pending: isAdmin
        ? requests.filter(request => request.status === 'pending').length
        : requests.filter(request => request.user_id === currentUser.id && request.status === 'pending').length,
      unread: notifications.filter(notification => !notification.is_read).length,
    });
  }

  function goTo(page) {
    setActiveScreen(page);
    navigationRef.navigate(page);
  }

  function logout() {
    setCurrentUser(null);
    setActiveScreen('Dashboard');
  }

  function clearVerification() {
    setVerificationCode('');
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  function handleLoginSuccess(user) {
    setCurrentUser(user);
    setActiveScreen(['admin', 'super_admin'].includes(user.role) ? 'AdminDashboard' : 'Dashboard');
  }

  if (!dbReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (verificationCode && !currentUser) {
    return (
      <SafeAreaView style={styles.authRoot}>
        <StatusBar barStyle="light-content" />
        <VerifyCertificateScreen initialCode={verificationCode} onBackToLogin={clearVerification} />
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.authRoot}>
        <StatusBar barStyle="light-content" />
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle={isMobile ? 'light-content' : 'dark-content'} />
      <View style={[styles.layout, isMobile && styles.layoutMobile]}>
        <View style={[styles.sidebar, isMobile && styles.sidebarHidden]}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>🏛️</Text>
            </View>
            <View>
              <Text style={styles.logoTitle}>Barangay Bued</Text>
              <Text style={styles.logoSubtitle}>{isAdmin ? 'ADMIN PANEL' : 'RESIDENT PORTAL'}</Text>
            </View>
          </View>

          <View style={styles.nav}>
            {navItems.map(section => (
              <View key={section.label} style={styles.navSection}>
                <Text style={styles.navSectionLabel}>{section.label}</Text>
                {section.items.map(item => {
                  const isActive = activeScreen === item.page;

                  return (
                    <TouchableOpacity
                      key={`${section.label}-${item.name}`}
                      style={[styles.navItem, isActive && styles.navItemActive]}
                      onPress={() => goTo(item.page)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.navIcon}>{item.icon}</Text>
                      <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.name}</Text>
                      {item.badge ? (
                        <View style={styles.navBadge}>
                          <Text style={styles.navBadgeText}>{item.badge}</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.sidebarUser}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{currentUser.full_name[0].toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{currentUser.full_name}</Text>
              <Text style={styles.userRole}>{isAdmin ? currentUser.role.replace('_', ' ') : 'Resident'}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>⏻</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.main}>
          <View style={[styles.topbar, isMobile && styles.topbarMobile]}>
            <View style={styles.topbarHeading}>
              {isMobile ? <Text style={styles.topbarKicker}>Barangay Bued</Text> : null}
              <Text style={[styles.topbarTitle, isMobile && styles.topbarTitleMobile]} numberOfLines={1}>
                {PAGE_TITLES[activeScreen]}
              </Text>
            </View>
            <View style={styles.topbarRight}>
              {!isMobile ? (
              <TouchableOpacity style={styles.notifButton} onPress={() => goTo('Notifications')}>
                <Text style={styles.notifIcon}>🔔</Text>
                {counts.unread ? <View style={styles.notifDot} /> : null}
              </TouchableOpacity>
              ) : null}
              {!isMobile ? <Text style={styles.topbarName}>{currentUser.full_name.split(' ')[0]}</Text> : null}
              {isMobile ? (
                <TouchableOpacity style={styles.mobileLogoutButton} onPress={logout}>
                  <Text style={styles.mobileLogoutLabel}>Log out</Text>
                  <Text style={styles.mobileLogoutText}>â»</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.pageFrame}>
            <NavigationContainer
              ref={navigationRef}
              onReady={() => setActiveScreen(navigationRef.getCurrentRoute()?.name || 'Dashboard')}
              onStateChange={() => setActiveScreen(navigationRef.getCurrentRoute()?.name || 'Dashboard')}
            >
              <Tab.Navigator
                initialRouteName={isAdmin ? 'AdminDashboard' : 'Dashboard'}
                screenOptions={{ headerShown: false }}
                tabBar={() => null}
              >
                <Tab.Screen name="AdminDashboard">
                  {props => <AdminDashboardScreen {...props} user={currentUser} />}
                </Tab.Screen>
                <Tab.Screen name="AdminRequests">
                  {props => <AdminRequestsScreen {...props} user={currentUser} />}
                </Tab.Screen>
                <Tab.Screen name="AdminResidents">
                  {props => <AdminRequestsScreen {...props} user={currentUser} mode="residents" />}
                </Tab.Screen>
                <Tab.Screen name="AdminAuditLogs">
                  {props => <AdminRequestsScreen {...props} user={currentUser} mode="audit" />}
                </Tab.Screen>
                <Tab.Screen name="Dashboard">
                  {props => <DashboardScreen {...props} user={currentUser} />}
                </Tab.Screen>
                <Tab.Screen name="Request">
                  {props => <RequestScreen {...props} user={currentUser} />}
                </Tab.Screen>
                <Tab.Screen name="Track">
                  {props => <TrackingScreen {...props} user={currentUser} />}
                </Tab.Screen>
                <Tab.Screen name="Notifications">
                  {props => <NotificationsScreen {...props} user={currentUser} />}
                </Tab.Screen>
                <Tab.Screen name="Verify">
                  {props => <VerifyCertificateScreen {...props} />}
                </Tab.Screen>
              </Tab.Navigator>
            </NavigationContainer>
          </View>
          {isMobile ? (
            <View style={styles.mobileNav}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mobileNavContent}
              >
                {flatNavItems.map(item => {
                  const isActive = activeScreen === item.page;

                  return (
                    <TouchableOpacity
                      key={`mobile-${item.page}`}
                      style={[styles.mobileNavItem, isActive && styles.mobileNavItemActive]}
                      onPress={() => goTo(item.page)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.mobileNavIcon}>{item.icon}</Text>
                      <Text style={[styles.mobileNavText, isActive && styles.mobileNavTextActive]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.badge ? (
                        <View style={styles.mobileNavBadge}>
                          <Text style={styles.navBadgeText}>{item.badge}</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', backgroundColor: COLORS.bg, flex: 1, justifyContent: 'center' },
  authRoot: { backgroundColor: COLORS.primaryDark, flex: 1 },
  shell: { backgroundColor: COLORS.primaryDark, flex: 1 },
  layout: { flex: 1, flexDirection: 'row' },
  layoutMobile: { flexDirection: 'column' },
  sidebar: {
    backgroundColor: COLORS.primaryDark,
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderRightWidth: 1,
    width: 262,
  },
  sidebarHidden: { display: 'none' },
  logoRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    height: 78,
    paddingHorizontal: 20,
  },
  logoIcon: {
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  logoIconText: { fontSize: 20 },
  logoTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  logoSubtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 1, marginTop: 6 },
  nav: { flex: 1, paddingHorizontal: 12, paddingTop: 16 },
  navSection: { marginBottom: 18 },
  navSectionLabel: {
    color: 'rgba(255,255,255,0.32)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  navItem: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  navItemActive: {
    backgroundColor: COLORS.primaryLight,
    shadowColor: COLORS.primaryLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  navIcon: { fontSize: 17, width: 20 },
  navText: { color: 'rgba(255,255,255,0.7)', flex: 1, fontSize: 14, fontWeight: '700' },
  navTextActive: { color: '#fff' },
  navBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
  },
  navBadgeText: { color: COLORS.primaryDark, fontSize: 10, fontWeight: '800' },
  sidebarUser: {
    alignItems: 'center',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 80,
    paddingHorizontal: 18,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 12.5, fontWeight: '800' },
  userRole: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 4 },
  logoutButton: { padding: 8 },
  logoutText: { color: 'rgba(255,255,255,0.45)', fontSize: 18 },
  main: { backgroundColor: COLORS.primaryDark, flex: 1 },
  topbar: {
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topbarMobile: { height: 62, paddingHorizontal: 14 },
  topbarHeading: { flex: 1, paddingRight: 12 },
  topbarKicker: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', marginBottom: 3, textTransform: 'uppercase' },
  topbarTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  topbarTitleMobile: { fontSize: 17 },
  topbarRight: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  notifButton: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    position: 'relative',
    width: 38,
  },
  notifIcon: { fontSize: 18 },
  notifDot: {
    backgroundColor: COLORS.dangerLight,
    borderColor: '#fff',
    borderRadius: 4,
    borderWidth: 2,
    height: 9,
    position: 'absolute',
    right: 7,
    top: 7,
    width: 9,
  },
  topbarName: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  pageFrame: { flex: 1 },
  mobileLogoutButton: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  mobileLogoutLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '800' },
  mobileLogoutText: { display: 'none' },
  mobileNav: {
    backgroundColor: COLORS.bgCard,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    minHeight: 74,
    paddingBottom: 6,
    paddingTop: 6,
  },
  mobileNavContent: { paddingHorizontal: 8 },
  mobileNavItem: {
    alignItems: 'center',
    borderRadius: 10,
    justifyContent: 'center',
    marginHorizontal: 3,
    minHeight: 58,
    minWidth: 74,
    paddingHorizontal: 8,
    position: 'relative',
  },
  mobileNavItemActive: { backgroundColor: '#eaf4fb' },
  mobileNavIcon: { fontSize: 20, marginBottom: 3 },
  mobileNavText: { color: COLORS.textMuted, fontSize: 10.5, fontWeight: '800', maxWidth: 86 },
  mobileNavTextActive: { color: COLORS.primary },
  mobileNavBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 18,
    paddingHorizontal: 5,
    position: 'absolute',
    right: 7,
    top: 5,
  },
});
