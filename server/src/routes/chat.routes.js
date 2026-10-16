const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const chatUpload = require('../middleware/chatUpload.middleware');
const {
  createDirectChatSchema,
  createGroupChatSchema,
  sendMessageSchema
} = require('../validators/chat.validator');

// All chat routes require authenticated user session
router.use(authenticate);

// 1. Conversations
router.get('/conversations', chatController.getConversations);
router.post('/conversations/direct', validate(createDirectChatSchema), chatController.getOrCreateDirectChat);
router.post('/conversations/group', validate(createGroupChatSchema), chatController.createGroupChat);

// 2. Colleague Directory for starting chats
router.get('/directory', chatController.getDirectory);

// 3. Messages within a conversation
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', validate(sendMessageSchema), chatController.sendMessage);
router.put('/conversations/:id/read', chatController.markAsRead);

// 4. File Attachment Upload
router.post('/upload', chatUpload.single('file'), chatController.uploadAttachment);

// 5. Delete Message
router.delete('/messages/:messageId', chatController.deleteMessage);

module.exports = router;
