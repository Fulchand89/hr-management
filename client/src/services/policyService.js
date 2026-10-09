import apiClient from './apiClient';

/**
 * Fetch all policies (filtered by category, status, search)
 */
export const getPolicies = async (params = {}) => {
  const res = await apiClient.get('/policies', { params });
  return res.data;
};

/**
 * Fetch single policy by ID
 */
export const getPolicyById = async (id) => {
  const res = await apiClient.get(`/policies/${id}`);
  return res.data;
};

/**
 * Create new policy (HR / Admin) - multipart FormData
 */
export const createPolicy = async (formData) => {
  const res = await apiClient.post('/policies', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

/**
 * Update policy (HR / Admin) - multipart FormData or JSON
 */
export const updatePolicy = async (id, formData) => {
  const isFormData = formData instanceof FormData;
  const res = await apiClient.put(`/policies/${id}`, formData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
  });
  return res.data;
};

/**
 * Change status (draft, published, archived)
 */
export const setPolicyStatus = async (id, status) => {
  const res = await apiClient.patch(`/policies/${id}/status`, { status });
  return res.data;
};

/**
 * Delete policy
 */
export const deletePolicy = async (id) => {
  const res = await apiClient.delete(`/policies/${id}`);
  return res.data;
};

/**
 * Employee Digital Acknowledgment ("I Agree")
 */
export const acknowledgePolicy = async (id) => {
  const res = await apiClient.post(`/policies/${id}/acknowledge`);
  return res.data;
};

/**
 * Get Policy Compliance Report for HR
 */
export const getPolicyCompliance = async (id) => {
  const res = await apiClient.get(`/policies/${id}/compliance`);
  return res.data;
};

/**
 * Send Policy Reminders to Pending Staff
 */
export const sendPolicyReminders = async (id) => {
  const res = await apiClient.post(`/policies/${id}/reminders`);
  return res.data;
};
