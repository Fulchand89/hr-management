import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  FileText,
  FileSpreadsheet,
  Download,
  CornerUpLeft,
  Trash2,
  MoreVertical
} from 'lucide-react';

export const MessageBubble = ({
  message,
  isOwn,
  onReply,
  onDelete,
  onImageClick
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderStatusTicks = () => {
    if (!isOwn) return null;

    if (message.status === 'read') {
      return <CheckCheck className="w-3.5 h-3.5 text-sky-500" title="Read" />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck className="w-3.5 h-3.5 text-slate-400" title="Delivered" />;
    }
    if (message.status === 'sent') {
      return <Check className="w-3.5 h-3.5 text-slate-400" title="Sent" />;
    }
    return <Clock className="w-3 h-3 text-slate-400 animate-spin" title="Sending" />;
  };

  const isImage = message.messageType === 'image' && Boolean(message.fileUrl);
  const isDoc = (message.messageType === 'document' || message.messageType === 'file') && Boolean(message.fileUrl);
  const fullFileUrl = message.fileUrl || '';

  // Check if message is within 15 min delete window
  const isDeletable = isOwn && !message.isDeletedForEveryone && (Date.now() - new Date(message.createdAt).getTime() < 15 * 60 * 1000);

  return (
    <div className={`flex w-full mb-2 ${isOwn ? 'justify-end' : 'justify-start'} group/bubble relative`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl p-2.5 shadow-2xs transition-all ${
          isOwn
            ? 'bg-[#D9FDD3] border border-emerald-100/90 rounded-tr-xs text-slate-800'
            : 'bg-white border border-slate-200/80 rounded-tl-xs text-slate-800'
        }`}
      >
        {/* Reply Menu Trigger Button on Hover */}
        <div
          className={`absolute top-1.5 ${
            isOwn ? '-left-8' : '-right-8'
          } opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1`}
        >
          <button
            type="button"
            onClick={() => onReply(message)}
            className="p-1 rounded-full bg-white shadow-xs border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
            title="Reply"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
          </button>
          {isDeletable && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              className="p-1 rounded-full bg-white shadow-xs border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
              title="Delete for everyone"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sender Name in Group Chat (if received) */}
        {!isOwn && message.senderName && (
          <div className="text-[11px] font-extrabold text-[#8B1D2C] mb-1">
            {message.senderName}
          </div>
        )}

        {/* Quoted Message / Reply Preview Box */}
        {message.replyTo && (
          <div
            className={`mb-2 p-2 rounded-lg border-l-4 text-xs select-none ${
              isOwn
                ? 'bg-emerald-50/70 border-emerald-600 text-slate-700'
                : 'bg-slate-100 border-[#8B1D2C] text-slate-700'
            }`}
          >
            <span className="font-bold text-[11px] text-[#8B1D2C] block">
              {message.replyTo.senderName || 'Replied message'}
            </span>
            <span className="truncate block text-[11px] text-slate-500">
              {message.replyTo.content || message.replyTo.fileName || 'Attachment'}
            </span>
          </div>
        )}

        {/* Image Attachment */}
        {isImage && (
          <div className="mb-1.5 overflow-hidden rounded-xl cursor-pointer">
            <img
              src={fullFileUrl}
              alt="Attachment"
              onClick={() => onImageClick(fullFileUrl)}
              className="w-full max-h-72 object-cover hover:scale-102 transition-transform duration-200 rounded-xl"
            />
          </div>
        )}

        {/* Document / File Attachment */}
        {isDoc && (
          <div className="mb-1.5 flex items-center gap-3 p-2.5 rounded-xl bg-black/5 border border-black/5">
            <div className="w-9 h-9 rounded-lg bg-white shadow-xs flex items-center justify-center shrink-0">
              {message.fileName?.endsWith('.xlsx') || message.fileName?.endsWith('.csv') ? (
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              ) : (
                <FileText className="w-5 h-5 text-rose-700" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{message.fileName}</p>
              <p className="text-[10px] text-slate-400">{formatFileSize(message.fileSize)}</p>
            </div>
            <a
              href={fullFileUrl}
              download={message.fileName}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-white text-slate-700 hover:text-black hover:bg-slate-100 shadow-xs cursor-pointer transition-colors shrink-0"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Message Text Content */}
        {message.content && (
          <p
            className={`text-xs sm:text-[13px] leading-relaxed break-words whitespace-pre-wrap ${
              message.isDeletedForEveryone ? 'italic text-slate-400' : 'text-slate-800'
            }`}
          >
            {message.content}
          </p>
        )}

        {/* Bottom Metadata: Timestamp & Status Checkmarks */}
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 select-none">
          <span>{formatTime(message.createdAt)}</span>
          {renderStatusTicks()}
        </div>
      </div>
    </div>
  );
};
