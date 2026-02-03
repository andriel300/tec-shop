'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Smile, ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface Attachment {
  file: File;
  preview: string;
  type: 'image';
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, attachments?: Attachment[]) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  isConnecting?: boolean;
  placeholder?: string;
  maxAttachments?: number;
  maxFileSize?: number; // in MB
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onTyping,
  disabled = false,
  isConnecting = false,
  placeholder = 'Type a message...',
  maxAttachments = 4,
  maxFileSize = 5, // 5MB default
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      // Handle typing indicator
      if (onTyping) {
        onTyping(true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing indicator after 2 seconds of no input
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 2000);
      }
    },
    [onChange, onTyping]
  );

  const handleEmojiClick = useCallback(
    (emojiData: EmojiClickData) => {
      const emoji = emojiData.emoji;
      const input = inputRef.current;

      if (input) {
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const newValue = value.slice(0, start) + emoji + value.slice(end);
        onChange(newValue);

        // Set cursor position after emoji
        setTimeout(() => {
          input.setSelectionRange(start + emoji.length, start + emoji.length);
          input.focus();
        }, 0);
      } else {
        onChange(value + emoji);
      }

      setShowEmojiPicker(false);
    },
    [value, onChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setUploadError(null);

      if (attachments.length + files.length > maxAttachments) {
        setUploadError(`Maximum ${maxAttachments} images allowed`);
        return;
      }

      const validFiles: Attachment[] = [];

      for (const file of files) {
        // Check file type
        if (!file.type.startsWith('image/')) {
          setUploadError('Only image files are allowed');
          continue;
        }

        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
          setUploadError(`File size must be less than ${maxFileSize}MB`);
          continue;
        }

        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          type: 'image',
        });
      }

      setAttachments((prev) => [...prev, ...validFiles]);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [attachments.length, maxAttachments, maxFileSize]
  );

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const newAttachments = [...prev];
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(newAttachments[index].preview);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if ((!value.trim() && attachments.length === 0) || disabled) return;

      onSend(value.trim(), attachments.length > 0 ? attachments : undefined);

      // Clear attachments after sending
      attachments.forEach((att) => URL.revokeObjectURL(att.preview));
      setAttachments([]);

      // Stop typing indicator
      if (onTyping) {
        onTyping(false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    },
    [value, attachments, disabled, onSend, onTyping]
  );

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((att) => URL.revokeObjectURL(att.preview));
    };
  }, [attachments]);

  return (
    <div className="border-t border-gray-700 bg-gray-800">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="p-2 border-b border-gray-700 flex gap-2 flex-wrap">
          {attachments.map((attachment, index) => (
            <div key={`attachment-${index}`} className="relative group">
              <Image
                src={attachment.preview}
                alt={`Attachment ${index + 1}`}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-lg border border-gray-600"
              />
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-900/20">
          {uploadError}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-center gap-2">
          {/* Emoji picker button */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-full transition"
              disabled={disabled}
            >
              <Smile size={20} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-50">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={Theme.DARK}
                  width={320}
                  height={400}
                  searchPlaceHolder="Search emoji..."
                  previewConfig={{
                    showPreview: false,
                  }}
                  skinTonesDisabled
                  lazyLoadEmojis
                />
              </div>
            )}
          </div>

          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-full transition"
            disabled={disabled || attachments.length >= maxAttachments}
          >
            <ImagePlus size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-800 disabled:cursor-not-allowed placeholder-gray-400"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={(!value.trim() && attachments.length === 0) || disabled}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Connection status */}
        {isConnecting && (
          <p className="text-xs text-yellow-400 mt-2 text-center">
            Connecting to chat server...
          </p>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
