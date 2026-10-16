const chatService = require('../services/chat.service');
const { getIO } = require('../config/websocket');
const ApiResponse = require('../utils/apiResponse');
const { BadRequestError } = require('../utils/apiError');

const getConversations = async (req, res, next) => {
  try {
    const { search } = req.query;
    const conversations = await chatService.getUserConversations(req.user.id, search);
    return ApiResponse.success(res, {
      message: 'Conversations fetched successfully',
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};

const getOrCreateDirectChat = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const result = await chatService.getOrCreateDirectConversation(req.user.id, targetUserId);

    const io = getIO();
    if (io && result.conversation) {
      try {
        io.in(`user:${req.user.id}`).socketsJoin(`conv:${result.conversation.id}`);
        io.in(`user:${targetUserId}`).socketsJoin(`conv:${result.conversation.id}`);
      } catch {}
    }

    return ApiResponse.success(res, {
      message: result.isNew ? 'Direct conversation created' : 'Direct conversation retrieved',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const createGroupChat = async (req, res, next) => {
  try {
    const { name, description, participantIds } = req.body;
    const group = await chatService.createGroupConversation(req.user.id, {
      name,
      description,
      participantIds
    });

    const io = getIO();
    if (io && group) {
      try {
        [req.user.id, ...participantIds].forEach((uId) => {
          io.in(`user:${uId}`).socketsJoin(`conv:${group.id}`);
        });
      } catch {}
    }

    return ApiResponse.created(res, {
      message: 'Group chat created successfully',
      data: group
    });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit, before } = req.query;
    const result = await chatService.getConversationMessages(req.user.id, id, { limit, before });
    return ApiResponse.success(res, {
      message: 'Messages fetched successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, messageType, fileUrl, fileName, fileSize, mimeType, replyToId } = req.body;

    const message = await chatService.saveMessage(req.user.id, {
      conversationId: id,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      replyToId
    });

    // Broadcast through socket if available
    const io = getIO();
    if (io) {
      io.to(`conv:${id}`).emit('chat:receive', { message });

      try {
        const { ConversationParticipant } = require('../models');
        const parts = await ConversationParticipant.findAll({
          where: { conversationId: id },
          attributes: ['userId']
        });
        parts.forEach((p) => {
          if (p.userId !== req.user.id) {
            io.to(`user:${p.userId}`).emit('chat:receive', { message });
          }
        });
      } catch {}
    }

    return ApiResponse.created(res, {
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const relativeUrl = `/uploads/chat/${req.file.filename}`;
    return ApiResponse.success(res, {
      message: 'File uploaded successfully',
      data: {
        fileUrl: relativeUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await chatService.markConversationAsRead(req.user.id, id);

    // Notify other room participants of read receipt
    const io = getIO();
    if (io) {
      io.to(`conv:${id}`).emit('chat:read_receipt', {
        conversationId: id,
        readerId: req.user.id,
        readAt: new Date().toISOString()
      });
    }

    return ApiResponse.success(res, {
      message: 'Conversation marked as read'
    });
  } catch (error) {
    next(error);
  }
};

const getDirectory = async (req, res, next) => {
  try {
    const { search } = req.query;
    const directory = await chatService.getEmployeeDirectory(req.user.id, search);
    return ApiResponse.success(res, {
      message: 'Employee directory fetched successfully',
      data: directory
    });
  } catch (error) {
    next(error);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const deleted = await chatService.deleteMessageForEveryone(req.user.id, messageId);

    const io = getIO();
    if (io) {
      io.to(`conv:${deleted.conversationId}`).emit('chat:msg_deleted', {
        messageId: deleted.id,
        conversationId: deleted.conversationId
      });
    }

    return ApiResponse.success(res, {
      message: 'Message deleted for everyone'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getOrCreateDirectChat,
  createGroupChat,
  getMessages,
  sendMessage,
  uploadAttachment,
  markAsRead,
  getDirectory,
  deleteMessage
};
