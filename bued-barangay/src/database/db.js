// src/database/db.js
// ============================================
// Connects to XAMPP PHP API instead of AsyncStorage
// ============================================

// ⚠️ IMPORTANT: Change this IP to your computer's local IP
// - For web browser: keep as localhost
// - For Android Expo Go: use your PC's IP e.g. http://192.168.18.207
//   (run `ipconfig` on Windows to find it)

const LOCAL_IP = '172.20.10.9'; // <-- CHANGE THIS to your PC's IP address

const API_BASE =
  typeof window !== 'undefined' && window.location?.hostname === 'localhost'
    ? 'http://localhost/barangay-api'           // web browser
    : `http://${LOCAL_IP}/barangay-api`;        // Android Expo Go

async function api(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
  } catch (err) {
    console.error(`[DB] API error (${endpoint}):`, err.message);
    throw err;
  }
}

export const DB = {
  // No-op: DB is initialized via SQL import in phpMyAdmin
  async init() {
    console.log('[DB] Using XAMPP MySQL API at', API_BASE);
  },

  // ── AUTH ─────────────────────────────────────────────────────────────────

  async login(email, password) {
    try {
      const user = await api('auth.php?action=login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return user;
    } catch {
      return null;
    }
  },

  async createUser(userData) {
    return await api('auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getUserByEmail(email) {
    const users = await this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  // ── USERS ─────────────────────────────────────────────────────────────────

  async getUsers() {
    return await api('users.php');
  },

  // ── CERTIFICATE TYPES ────────────────────────────────────────────────────

  async getCertTypes() {
    return await api('cert_types.php');
  },

  // ── REQUESTS ─────────────────────────────────────────────────────────────

  async getRequests() {
    return await api('requests.php');
  },

  async getRequestByCode(requestCode) {
    try {
      return await api(`requests.php?action=by_code&code=${encodeURIComponent(requestCode)}`);
    } catch {
      return null;
    }
  },

  async createRequest(userId, certTypeId, purpose, priority, notes = '') {
    return await api('requests.php?action=create', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        certificate_type_id: certTypeId,
        purpose,
        priority,
        notes,
      }),
    });
  },

  async updateRequestStatus(requestId, status, adminId, remarks = '') {
    return await api('requests.php?action=update_status', {
      method: 'POST',
      body: JSON.stringify({
        request_id: requestId,
        status,
        admin_id: adminId,
        remarks,
      }),
    });
  },

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────

  async getNotifications(userId) {
    return await api(`notifications.php?user_id=${userId}`);
  },

  async markAllNotificationsAsRead(userId) {
    return await api(`notifications.php?action=mark_read&user_id=${userId}`, {
      method: 'POST',
    });
  },

  // ── AUDIT LOGS ────────────────────────────────────────────────────────────

  async getAuditLogs() {
    return await api('audit_logs.php');
  },

  // These are handled server-side in PHP now, kept as no-ops for compatibility
  async addNotification() {},
  async addAuditLog() {},
};
