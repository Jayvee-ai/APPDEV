// src/screens/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
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
    setNotifs(list.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
    // Auto clear/read indicators on layout instantiation match template actions
    await DB.markAllNotificationsAsRead(user.id);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>Alert Notifications</Text>
      {notifs.length === 0 ? (
        <View style={styles.emptyContainer}><Text>No status system alerts found.</Text></View>
      ) : (
        notifs.map(n => (
          <View key={n.id} style={[styles.notifBox, !n.is_read && styles.unread]}>
            <View style={styles.row}>
              <Text style={styles.bell}>🔔</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.nTitle}>{n.title}</Text>
                <Text style={styles.nMsg}>{n.message}</Text>
                <Text style={styles.nTime}>{new Date(n.created_at).toLocaleTimeString()}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  heading: { fontSize: 18, fontWeight: '800', marginBottom: 15, color: COLORS.text },
  emptyContainer: { padding: 40, alignItems: 'center' },
  notifBox: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 1 },
  unread: { borderLeftWidth: 4, borderLeftColor: COLORS.accent },
  row: { flexDirection: 'row', alignItems: 'center' },
  bell: { fontSize: 20, marginRight: 12 },
  nTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  nMsg: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  nTime: { fontSize: 11, color: COLORS.textLight, marginTop: 4 }
});