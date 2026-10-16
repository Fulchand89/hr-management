import apiClient from './apiClient';

/**
 * 1. Fetch conversations list for current user
 */
export const getConversations = async (search = '') => {
  const params = search ? { search } : {};
  const res = await apiClient.get('/chat/conversations', { params });
  return res.data?.data || [];
};

/**
 * 2. Start or retrieve 1-on-1 direct conversation with colleague
 */
export const getOrCreateDirectChat = async (targetUserId) => {
  const res = await apiClient.post('/chat/conversations/direct', { targetUserId });
  return res.data?.data;
};

/**
 * 3. Create Group Chat
 */
export const createGroupChat = async ({ name, description, participantIds }) => {
  const res = await apiClient.post('/chat/conversations/group', {
    name,
    description,
    participantIds
  });
  return res.data?.data;
};

/**
 * 4. Fetch paginated messages for a conversation
 */
export const getMessages = async (conversationId, { limit = 40, before = null } = {}) => {
  const params = { limit };
  if (before) params.before = before;
  const res = await apiClient.get(`/chat/conversations/${conversationId}/messages`, { params });
  return res.data?.data || { messages: [], hasMore: false };
};

/**
 * 5. Send message via REST API (fallback / attachment submission)
 */
export const sendMessage = async (conversationId, messageData) => {
  const res = await apiClient.post(`/chat/conversations/${conversationId}/messages`, messageData);
  return res.data?.data;
};

/**
 * 6. Upload file attachment (images, PDFs, documents)
 */
export const uploadAttachment = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/chat/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data?.data;
};

/**
 * 7. Mark conversation as read
 */
export const markConversationAsRead = async (conversationId) => {
  const res = await apiClient.put(`/chat/conversations/${conversationId}/read`);
  return res.data;
};

/**
 * 8. Search employee directory to start new chat
 */
export const getEmployeeDirectory = async (search = '') => {
  const params = search ? { search } : {};
  const res = await apiClient.get('/chat/directory', { params });
  return res.data?.data || [];
};

/**
 * 9. Delete message for everyone
 */
export const deleteMessageForEveryone = async (messageId) => {
  const res = await apiClient.delete(`/chat/messages/${messageId}`);
  return res.data;
};
