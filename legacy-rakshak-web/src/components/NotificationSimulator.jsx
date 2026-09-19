import React from 'react';
import { X, Play, Phone, Clock } from 'lucide-react';
import { speakText } from './VoiceAssistant';

export default function NotificationSimulator({ notification, onClose, onInspect, onPlayVoice }) {
  if (!notification) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Notification Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#121A2C] rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-gray-200 dark:border-[#232E45]">
        {/* Header Gradient */}
        <div className="h-2 bg-gradient-to-r from-coral-500 via-amber-500 to-indigo-600" />

        <div className="p-6 space-y-5">
          {/* OS Notification Style */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-[#F8FAFc] to-[#F1F5F9] dark:from-[#1E293B] dark:to-[#0F172A] border border-[#E2E8F0] dark:border-[#2D3748]">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center shadow-lg shrink-0">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-coral-50 dark:bg-coral-950/50 text-coral-700 dark:text-coral-400 text-[10px] font-bold uppercase tracking-wider">
                  {notification.category}
                </span>
                <Clock className="w-3 h-3 text-[var(--text-muted)]" />
              </div>
              <h4 className="font-bold text-[var(--text-primary)] text-sm mb-0.5">{notification.title}</h4>
              <p className="text-xs text-[var(--text-muted)] mb-1">From: {notification.sender}</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{notification.app}</p>
            </div>
          </div>

          {/* Message Preview */}
          <div className="bg-[var(--bg-surface-subtle)] rounded-xl p-4 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-[var(--text-muted)]">Message Preview:</span>
            </div>
            <p className="text-sm text-[var(--text-primary)] font-medium italic leading-relaxed">
              "{notification.message}"
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (onPlayVoice) onPlayVoice();
              }}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4" />
              <span>Listen to Warning</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (onInspect) onInspect();
                  onClose();
                }}
                className="py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                Inspect Message
              </button>
              <button
                onClick={onClose}
                className="py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--bg-surface-subtle)] transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}