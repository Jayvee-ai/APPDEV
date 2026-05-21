// src/screens/NotificationsScreen.js
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { DB } from '../database/db';
import { COLORS } from '../theme/theme';

export default function NotificationsScreen({ user }) {
  const isFocused = useIsFocused();
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (isFocused) {
      loadNotifs();
    }
  }, [isFocused]);

  const loadNotifs = async () => {
    const list = await DB.getNotifications(user.id);
    setNotifs(list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  };

  const markAllRead = async () => {
    await DB.markAllNotificationsAsRead(user.id);
    await loadNotifs();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.pageTitle}>Notifications</Text>
          <Text style={styles.pageSubtitle}>Stay updated on your request status.</Text>
        </View>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markRead}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {notifs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>You're all caught up!</Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {notifs.map(notification => (
            <View key={notification.id} style={[styles.notificationRow, !notification.is_read && styles.unread]}>
              <Text style={styles.bell}>🔔</Text>
              <View style={styles.notificationBody}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{new Date(notification.created_at).toLocaleString('en-PH')}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.primaryDark, flex: 1 },
  content: { padding: 32, paddingBottom: 40 },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 48 },
  pageTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 10 },
  pageSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13.5 },
  markRead: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700', marginTop: 28 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 260,
    justifyContent: 'center',
    width: '100%',
  },
  emptyIcon: { fontSize: 44, marginBottom: 20 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: 10 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
  listCard: { backgroundColor: '#fff', borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  notificationRow: { alignItems: 'flex-start', borderBottomColor: COLORS.border, borderBottomWidth: 1, flexDirection: 'row', gap: 14, padding: 18 },
  unread: { backgroundColor: '#fffdf3' },
  bell: { fontSize: 20, marginTop: 2 },
  notificationBody: { flex: 1 },
  notificationTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  notificationMessage: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  notificationTime: { color: COLORS.textLight, fontSize: 11, marginTop: 6 },
});
