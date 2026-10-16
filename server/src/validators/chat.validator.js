const Joi = require('joi');

const createDirectChatSchema = Joi.object({
  targetUserId: Joi.string().uuid().required().messages({
    'string.empty': 'Target user ID is required',
    'string.guid': 'Target user ID must be a valid UUID'
  })
});

const createGroupChatSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Group name is required',
    'string.min': 'Group name must be at least 2 characters',
    'string.max': 'Group name cannot exceed 100 characters'
  }),
  description: Joi.string().trim().max(255).allow('', null).optional(),
  participantIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.min': 'At least one participant must be added to the group'
  })
});

const sendMessageSchema = Joi.object({
  conversationId: Joi.string().uuid().optional(),
  content: Joi.string().trim().allow('', null).optional(),
  messageType: Joi.string().valid('text', 'image', 'document', 'audio', 'system').default('text'),
  fileUrl: Joi.string().trim().allow('', null).optional(),
  fileName: Joi.string().trim().allow('', null).optional(),
  fileSize: Joi.number().integer().min(0).allow(null).optional(),
  mimeType: Joi.string().trim().allow('', null).optional(),
  replyToId: Joi.string().uuid().allow(null).optional()
}).or('content', 'fileUrl');

module.exports = {
  createDirectChatSchema,
  createGroupChatSchema,
  sendMessageSchema
};
