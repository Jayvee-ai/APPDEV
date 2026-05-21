// src/database/db.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USERS: 'bued_users',
  CERT_TYPES: 'bued_certificate_types',
  REQUESTS: 'bued_certificate_requests',
  NOTIFICATIONS: 'bued_notifications',
  AUDIT_LOGS: 'bued_audit_logs',
  INITIALIZED: 'bued_initialized',
};

export const DB = {
  async init() {
    const isInitialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInitialized) {
      await this.seed();
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  },

  async seed() {
    const users = [
      { id: 1, full_name: 'Super Admin', email: 'admin@barangaybued.gov.ph', password: 'Admin@2025', role: 'super_admin', phone: '09171234567', address: 'Barangay Hall, Bued, Calasiao, Pangasinan', created_at: new Date().toISOString() },
      { id: 2, full_name: 'Juan dela Cruz', email: 'juan@email.com', password: 'Resident@2025', role: 'resident', phone: '09281234567', address: '123 Rizal St., Bued, Calasiao, Pangasinan', created_at: new Date().toISOString() },
      { id: 3, full_name: 'Maria Santos', email: 'maria@email.com', password: 'Resident@2025', role: 'resident', phone: '09391234567', address: '456 Mabini Ave., Bued, Calasiao, Pangasinan', created_at: new Date().toISOString() },
    ];

    const certificate_types = [
      { id: 1, name: 'Barangay Clearance', description: 'Official clearance certifying good standing in the barangay.', requirements: 'Valid ID, Community Tax Certificate', fee: 50, processing_days: 1, is_active: true },
      { id: 2, name: 'Certificate of Residency', description: 'Certifies that the applicant is a resident of Barangay Bued.', requirements: 'Valid ID, Proof of Address', fee: 30, processing_days: 1, is_active: true },
      { id: 3, name: 'Certificate of Indigency', description: 'Certifies that the applicant belongs to the indigent sector.', requirements: 'Valid ID, Sworn Affidavit', fee: 0, processing_days: 1, is_active: true },
      { id: 4, name: 'Business Clearance', description: 'Clearance required for business permit applications.', requirements: 'Valid ID, Business Documents', fee: 200, processing_days: 3, is_active: true },
      { id: 5, name: 'Certificate of Good Moral Character', description: 'Certifies the moral standing of the applicant.', requirements: 'Valid ID, 2 Character References', fee: 30, processing_days: 2, is_active: true },
    ];

    const certificate_requests = [
      { id: 1, request_code: 'BUED-2025-0001', user_id: 2, certificate_type_id: 1, purpose: 'Employment requirements', status: 'approved', priority: 'normal', requested_at: '2025-12-01T08:00:00', approved_at: '2025-12-01T14:00:00', released_at: null, qr_code_data: 'BUED-2025-0001|Juan dela Cruz|Barangay Clearance|2025-12-01', admin_remarks: 'Verified and approved.', approved_by: 1 },
      { id: 2, request_code: 'BUED-2025-0002', user_id: 2, certificate_type_id: 2, purpose: 'School enrollment', status: 'pending', priority: 'normal', requested_at: '2025-12-05T09:30:00', approved_at: null, released_at: null, qr_code_data: null, admin_remarks: '', approved_by: null },
      { id: 3, request_code: 'BUED-2025-0003', user_id: 3, certificate_type_id: 3, purpose: 'Medical assistance application', status: 'under_review', priority: 'urgent', requested_at: '2025-12-06T10:00:00', approved_at: null, released_at: null, qr_code_data: null, admin_remarks: '', approved_by: null },
    ];

    const notifications = [
      { id: 1, user_id: 2, title: 'Request Approved!', message: 'Your Barangay Clearance (BUED-2025-0001) has been approved and is ready for release.', type: 'success', is_read: false, related_request_id: 1, created_at: '2025-12-01T14:01:00' },
      { id: 2, user_id: 2, title: 'Request Submitted', message: 'Your Certificate of Residency (BUED-2025-0002) has been submitted successfully.', type: 'info', is_read: true, related_request_id: 2, created_at: '2025-12-05T09:31:00' },
    ];

    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    await AsyncStorage.setItem(STORAGE_KEYS.CERT_TYPES, JSON.stringify(certificate_types));
    await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(certificate_requests));
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
  },

  async login(email, password) {
    const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return null;
    await this.addAuditLog(user.id, 'LOGIN', 'user', user.id, 'User logged in mobile client');
    return user;
  },

  async createUser(userData) {
    const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = { id: newId, role: 'resident', created_at: new Date().toISOString(), ...userData };
    users.push(newUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  async getUserByEmail(email) {
    const users = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  async getUsers() {
    return JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.USERS)) || [];
  },

  async getCertTypes() {
    return JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.CERT_TYPES)) || [];
  },

  async getRequests() {
    return JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.REQUESTS)) || [];
  },

  async getRequestByCode(requestCode) {
    const requests = await this.getRequests();
    return requests.find(r => r.request_code === requestCode) || null;
  },

  async createRequest(userId, certTypeId, purpose, priority, notes = '') {
    const requests = await this.getRequests();
    const newId = requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1;
    const year = new Date().getFullYear();
    const requestCode = `BUED-${year}-${String(newId).padStart(4, '0')}`;
    
    const newRequest = {
      id: newId,
      request_code: requestCode,
      user_id: userId,
      certificate_type_id: certTypeId,
      purpose,
      priority,
      notes,
      status: 'pending',
      requested_at: new Date().toISOString(),
      approved_at: null,
      released_at: null,
      qr_code_data: null,
      admin_remarks: '',
      approved_by: null
    };

    requests.push(newRequest);
    await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    await this.addNotification(userId, 'Request Submitted', `Your request ${requestCode} has been submitted successfully.`, 'info', newId);
    return newRequest;
  },

  async updateRequestStatus(requestId, status, adminId, remarks = '') {
    const requests = await this.getRequests();
    const users = await this.getUsers();
    const certTypes = await this.getCertTypes();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) return null;

    const now = new Date().toISOString();
    const request = requests[requestIndex];
    const resident = users.find(u => u.id === request.user_id);
    const certType = certTypes.find(c => c.id === request.certificate_type_id);
    const qrPayload = {
      system: 'Barangay Bued Digital Certificate Request System',
      verification_type: 'barangay_certificate',
      request_code: request.request_code,
      resident_id: resident?.id,
      resident_name: resident?.full_name || 'Resident',
      resident_email: resident?.email || '',
      resident_phone: resident?.phone || '',
      resident_address: resident?.address || '',
      certificate_type: certType?.name || 'Certificate',
      purpose: request.purpose,
      status,
      approved_at: request.approved_at || now,
      released_at: status === 'released' ? now : request.released_at,
      approved_by: adminId,
    };

    const nextRequest = {
      ...request,
      status,
      admin_remarks: remarks,
      approved_by: ['approved', 'released'].includes(status) ? adminId : request.approved_by,
      approved_at: status === 'approved' && !request.approved_at ? now : request.approved_at,
      released_at: status === 'released' && !request.released_at ? now : request.released_at,
      qr_code_data:
        status === 'approved' || status === 'released'
          ? request.qr_code_data || JSON.stringify(qrPayload)
          : request.qr_code_data,
    };

    requests[requestIndex] = nextRequest;
    await AsyncStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

    const titleMap = {
      under_review: 'Request Under Review',
      approved: 'Request Approved!',
      rejected: 'Request Rejected',
      released: 'Certificate Released!',
    };
    const messageMap = {
      under_review: `Your request ${request.request_code} is now under review.`,
      approved: `Your ${certType?.name || 'certificate'} (${request.request_code}) has been approved.`,
      rejected: `Your request ${request.request_code} was rejected.${remarks ? ` Remarks: ${remarks}` : ''}`,
      released: `Your ${certType?.name || 'certificate'} (${request.request_code}) has been released.`,
    };
    const typeMap = { under_review: 'info', approved: 'success', rejected: 'warning', released: 'success' };

    await this.addNotification(
      request.user_id,
      titleMap[status] || 'Request Updated',
      messageMap[status] || `Your request ${request.request_code} was updated.`,
      typeMap[status] || 'info',
      request.id
    );
    await this.addAuditLog(adminId, `REQUEST_${status.toUpperCase()}`, 'certificate_request', request.id, remarks || `Status changed to ${status}`);

    return nextRequest;
  },

  async getNotifications(userId) {
    const notifs = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
    return notifs.filter(n => n.user_id === userId);
  },

  async markAllNotificationsAsRead(userId) {
    const notifs = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
    const updated = notifs.map(n => n.user_id === userId ? { ...n, is_read: true } : n);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },

  async addNotification(userId, title, message, type, requestId) {
    const notifs = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
    const newId = notifs.length > 0 ? Math.max(...notifs.map(n => n.id)) + 1 : 1;
    notifs.push({ id: newId, user_id: userId, title, message, type, is_read: false, related_request_id: requestId, created_at: new Date().toISOString() });
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  async addAuditLog(userId, action, entityType, entityId, details) {
    const logs = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) || [];
    const newId = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
    logs.push({ id: newId, user_id: userId, action, entity_type: entityType, entity_id: entityId, new_value: details, ip_address: 'MobileClient', created_at: new Date().toISOString() });
    await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }
};
