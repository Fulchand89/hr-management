const { Op } = require('sequelize');
const {
  Conversation,
  ConversationParticipant,
  ChatMessage,
  User,
  Department,
  Designation,
  sequelize
} = require('../models');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/apiError');

/**
 * 1. Get all active conversations for logged-in user
 */
const getUserConversations = async (userId, search = '') => {
  // Find all conversation IDs the user is a part of
  const myParticipations = await ConversationParticipant.findAll({
    where: { userId },
    attributes: ['conversationId', 'unreadCount', 'isMuted', 'lastReadAt', 'clearedAt']
  });

  if (!myParticipations.length) return [];

  const conversationMap = new Map();
  myParticipations.forEach((p) => {
    conversationMap.set(p.conversationId, p);
  });

  const conversationIds = Array.from(conversationMap.keys());

  // Fetch conversations with participants and last message
  const conversations = await Conversation.findAll({
    where: { id: { [Op.in]: conversationIds } },
    include: [
      {
        model: ConversationParticipant,
        as: 'participants',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar', 'role']
          }
        ]
      },
      {
        model: ChatMessage,
        as: 'lastMessage',
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      }
    ],
    order: [
      [sequelize.literal('COALESCE(Conversation.lastMessageAt, Conversation.updatedAt)'), 'DESC']
    ]
  });

  const formatted = conversations.map((conv) => {
    const myMeta = conversationMap.get(conv.id) || {};
    let displayName = conv.name;
    let displayAvatar = conv.avatar;
    let otherParticipant = null;

    if (conv.type === 'direct') {
      const otherPart = conv.participants.find((p) => p.userId !== userId);
      if (otherPart && otherPart.user) {
        otherParticipant = otherPart.user;
        displayName = `${otherPart.user.firstName || ''} ${otherPart.user.lastName || ''}`.trim() || otherPart.user.email;
        displayAvatar = otherPart.user.avatar;
      } else {
        const selfPart = conv.participants.find((p) => p.userId === userId);
        if (selfPart && selfPart.user) {
          otherParticipant = selfPart.user;
          displayName = `${selfPart.user.firstName || ''} ${selfPart.user.lastName || ''}`.trim() + ' (You)';
          displayAvatar = selfPart.user.avatar;
        }
      }
    }

    return {
      id: conv.id,
      type: conv.type,
      name: displayName,
      avatar: displayAvatar,
      description: conv.description,
      unreadCount: myMeta.unreadCount || 0,
      isMuted: Boolean(myMeta.isMuted),
      lastMessageAt: conv.lastMessageAt || conv.createdAt,
      otherParticipant,
      participantsCount: conv.participants.length,
      lastMessage: conv.lastMessage
        ? {
            id: conv.lastMessage.id,
            content: conv.lastMessage.isDeletedForEveryone ? '🚫 This message was deleted' : conv.lastMessage.content,
            messageType: conv.lastMessage.messageType,
            fileName: conv.lastMessage.fileName,
            senderId: conv.lastMessage.senderId,
            senderName: conv.lastMessage.sender
              ? `${conv.lastMessage.sender.firstName || ''} ${conv.lastMessage.sender.lastName || ''}`.trim()
              : 'Unknown',
            status: conv.lastMessage.status,
            createdAt: conv.lastMessage.createdAt
          }
        : null
    };
  });

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    return formatted.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.otherParticipant && c.otherParticipant.email.toLowerCase().includes(q))
    );
  }

  return formatted;
};

/**
 * 2. Get or create 1-on-1 direct conversation with another employee or self
 */
const getOrCreateDirectConversation = async (userId, targetUserId) => {
  const isSelf = String(userId) === String(targetUserId);

  const targetUser = await User.findByPk(targetUserId, {
    attributes: ['id', 'firstName', 'lastName', 'email', 'avatar', 'role', 'status']
  });

  if (!targetUser) {
    throw new NotFoundError('Target user not found');
  }

  // Find if direct conversation already exists
  const userConvs = await ConversationParticipant.findAll({
    where: { userId },
    attributes: ['conversationId']
  });

  const convIds = userConvs.map((c) => c.conversationId);

  if (convIds.length > 0) {
    if (isSelf) {
      const existingSelf = await Conversation.findOne({
        where: {
          id: { [Op.in]: convIds },
          type: 'direct',
          createdBy: userId
        },
        include: [
          {
            model: ConversationParticipant,
            as: 'participants',
            attributes: ['id', 'userId']
          }
        ]
      });

      if (existingSelf && existingSelf.participants.length === 1) {
        return {
          conversation: existingSelf,
          isNew: false,
          otherParticipant: targetUser
        };
      }
    } else {
      const sharedDirect = await ConversationParticipant.findOne({
        where: {
          conversationId: { [Op.in]: convIds },
          userId: targetUserId
        },
        include: [
          {
            model: Conversation,
            as: 'conversation',
            where: { type: 'direct' }
          }
        ]
      });

      if (sharedDirect && sharedDirect.conversation) {
        return {
          conversation: sharedDirect.conversation,
          isNew: false,
          otherParticipant: targetUser
        };
      }
    }
  }

  // Create new direct conversation
  const newConv = await Conversation.create({
    type: 'direct',
    createdBy: userId,
    lastMessageAt: new Date()
  });

  if (isSelf) {
    await ConversationParticipant.create({
      conversationId: newConv.id,
      userId,
      role: 'admin'
    });
  } else {
    await ConversationParticipant.bulkCreate([
      { conversationId: newConv.id, userId, role: 'admin' },
      { conversationId: newConv.id, userId: targetUserId, role: 'member' }
    ]);
  }

  return {
    conversation: newConv,
    isNew: true,
    otherParticipant: targetUser
  };
};

/**
 * 3. Create Group Chat
 */
const createGroupConversation = async (creatorId, { name, description, participantIds = [] }) => {
  const uniqueUserIds = Array.from(new Set([creatorId, ...participantIds]));

  const newConv = await Conversation.create({
    type: 'group',
    name: name.trim(),
    description: description ? description.trim() : null,
    createdBy: creatorId,
    lastMessageAt: new Date()
  });

  const participantRows = uniqueUserIds.map((uId) => ({
    conversationId: newConv.id,
    userId: uId,
    role: uId === creatorId ? 'admin' : 'member'
  }));

  await ConversationParticipant.bulkCreate(participantRows);

  return newConv;
};

/**
 * 4. Fetch Paginated Messages for a conversation
 */
const getConversationMessages = async (userId, conversationId, { limit = 40, before } = {}) => {
  // Check membership
  const participant = await ConversationParticipant.findOne({
    where: { conversationId, userId }
  });

  if (!participant) {
    throw new ForbiddenError('You are not a member of this conversation');
  }

  const whereClause = { conversationId };

  if (participant.clearedAt) {
    whereClause.createdAt = { [Op.gt]: participant.clearedAt };
  }

  if (before) {
    whereClause.createdAt = {
      ...(whereClause.createdAt || {}),
      [Op.lt]: new Date(before)
    };
  }

  const maxLimit = Math.min(parseInt(limit, 10) || 40, 100);

  const rawMessages = await ChatMessage.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'avatar', 'role']
      },
      {
        model: ChatMessage,
        as: 'replyTo',
        attributes: ['id', 'content', 'messageType', 'fileName', 'senderId'],
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: maxLimit + 1
  });

  const hasMore = rawMessages.length > maxLimit;
  const messages = hasMore ? rawMessages.slice(0, maxLimit) : rawMessages;

  // Reverse so frontend gets chronological order (oldest to newest in current batch)
  messages.reverse();

  const formatted = messages.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderName: m.sender ? `${m.sender.firstName || ''} ${m.sender.lastName || ''}`.trim() : 'Unknown',
    senderAvatar: m.sender?.avatar || null,
    messageType: m.messageType,
    content: m.isDeletedForEveryone ? '🚫 This message was deleted' : m.content,
    fileUrl: m.fileUrl,
    fileName: m.fileName,
    fileSize: m.fileSize,
    mimeType: m.mimeType,
    status: m.status,
    isDeletedForEveryone: m.isDeletedForEveryone,
    replyTo: m.replyTo
      ? {
          id: m.replyTo.id,
          content: m.replyTo.content,
          messageType: m.replyTo.messageType,
          fileName: m.replyTo.fileName,
          senderName: m.replyTo.sender
            ? `${m.replyTo.sender.firstName || ''} ${m.replyTo.sender.lastName || ''}`.trim()
            : 'Unknown'
        }
      : null,
    createdAt: m.createdAt
  }));

  const nextCursor = hasMore && rawMessages[maxLimit - 1] ? rawMessages[maxLimit - 1].createdAt : null;

  return {
    messages: formatted,
    hasMore,
    nextCursor
  };
};

/**
 * 5. Save incoming message
 */
const saveMessage = async (senderId, {
  conversationId,
  content,
  messageType = 'text',
  fileUrl = null,
  fileName = null,
  fileSize = null,
  mimeType = null,
  replyToId = null
}) => {
  // Verify membership
  const participant = await ConversationParticipant.findOne({
    where: { conversationId, userId: senderId }
  });

  if (!participant) {
    throw new ForbiddenError('You are not a participant in this conversation');
  }

  const message = await ChatMessage.create({
    conversationId,
    senderId,
    content: content ? content.trim() : null,
    messageType,
    fileUrl,
    fileName,
    fileSize,
    mimeType,
    replyToId,
    status: 'sent'
  });

  // Update conversation last message pointer
  await Conversation.update(
    {
      lastMessageId: message.id,
      lastMessageAt: message.createdAt
    },
    { where: { id: conversationId } }
  );

  // Increment unread count for other participants
  await ConversationParticipant.increment('unreadCount', {
    by: 1,
    where: {
      conversationId,
      userId: { [Op.ne]: senderId }
    }
  });

  // Fetch with associations for emission
  const saved = await ChatMessage.findByPk(message.id, {
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'avatar', 'role']
      },
      {
        model: ChatMessage,
        as: 'replyTo',
        attributes: ['id', 'content', 'messageType', 'fileName', 'senderId'],
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      }
    ]
  });

  return {
    id: saved.id,
    conversationId: saved.conversationId,
    senderId: saved.senderId,
    senderName: saved.sender ? `${saved.sender.firstName || ''} ${saved.sender.lastName || ''}`.trim() : 'Unknown',
    senderAvatar: saved.sender?.avatar || null,
    messageType: saved.messageType,
    content: saved.content,
    fileUrl: saved.fileUrl,
    fileName: saved.fileName,
    fileSize: saved.fileSize,
    mimeType: saved.mimeType,
    status: saved.status,
    isDeletedForEveryone: saved.isDeletedForEveryone,
    replyTo: saved.replyTo
      ? {
          id: saved.replyTo.id,
          content: saved.replyTo.content,
          messageType: saved.replyTo.messageType,
          fileName: saved.replyTo.fileName,
          senderName: saved.replyTo.sender
            ? `${saved.replyTo.sender.firstName || ''} ${saved.replyTo.sender.lastName || ''}`.trim()
            : 'Unknown'
        }
      : null,
    createdAt: saved.createdAt
  };
};

/**
 * 6. Mark Conversation Read
 */
const markConversationAsRead = async (userId, conversationId) => {
  await ConversationParticipant.update(
    {
      unreadCount: 0,
      lastReadAt: new Date()
    },
    {
      where: { conversationId, userId }
    }
  );

  // Mark all unread messages received by this user in this conversation as 'read'
  await ChatMessage.update(
    { status: 'read' },
    {
      where: {
        conversationId,
        senderId: { [Op.ne]: userId },
        status: { [Op.ne]: 'read' }
      }
    }
  );

  return { success: true };
};

/**
 * 7. Employee Directory search for starting new chats
 */
const getEmployeeDirectory = async (currentUserId, search = '') => {
  const whereClause = {
    id: { [Op.ne]: currentUserId },
    status: { [Op.ne]: 'terminated' }
  };

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    const words = search.trim().split(/\s+/).filter(Boolean);
    const orConditions = [
      sequelize.where(
        sequelize.fn('concat', sequelize.col('firstName'), ' ', sequelize.col('lastName')),
        { [Op.like]: q }
      ),
      { firstName: { [Op.like]: q } },
      { lastName: { [Op.like]: q } },
      { email: { [Op.like]: q } },
      { designation: { [Op.like]: q } }
    ];

    if (words.length > 1) {
      orConditions.push({
        [Op.and]: words.map((w) => ({
          [Op.or]: [
            { firstName: { [Op.like]: `%${w}%` } },
            { lastName: { [Op.like]: `%${w}%` } },
            { email: { [Op.like]: `%${w}%` } }
          ]
        }))
      });
    }

    whereClause[Op.or] = orConditions;
  }

  const employees = await User.findAll({
    where: whereClause,
    attributes: ['id', 'firstName', 'lastName', 'email', 'avatar', 'role', 'designation', 'status'],
    order: [
      [sequelize.literal("CASE WHEN role = 'hr' THEN 0 ELSE 1 END"), 'ASC'],
      ['firstName', 'ASC']
    ],
    limit: 250
  });

  return employees.map((u) => ({
    id: u.id,
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    designation: u.designation || u.role
  }));
};

/**
 * 8. Delete message for everyone (within 15 minutes)
 */
const deleteMessageForEveryone = async (userId, messageId) => {
  const message = await ChatMessage.findByPk(messageId);
  if (!message) throw new NotFoundError('Message not found');

  if (message.senderId !== userId) {
    throw new ForbiddenError('You can only delete your own messages');
  }

  const ageMs = Date.now() - new Date(message.createdAt).getTime();
  if (ageMs > 15 * 60 * 1000) {
    throw new BadRequestError('Messages can only be deleted for everyone within 15 minutes of sending');
  }

  message.isDeletedForEveryone = true;
  message.content = '🚫 This message was deleted';
  message.fileUrl = null;
  message.fileName = null;
  message.deletedAt = new Date();
  await message.save();

  return message;
};

module.exports = {
  getUserConversations,
  getOrCreateDirectConversation,
  createGroupConversation,
  getConversationMessages,
  saveMessage,
  markConversationAsRead,
  getEmployeeDirectory,
  deleteMessageForEveryone
};
