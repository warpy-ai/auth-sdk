/**
 * MCPNotification Component
 * @module ai-mode/components/MCPNotification
 *
 * Displays a notification when an MCP tool is used by an AI agent
 */

'use client';

import React, { useEffect, useState } from 'react';
import type { MCPNotificationProps } from '../types';

/**
 * Get notification colors based on type and theme
 */
function getNotificationColors(type: string, theme: 'light' | 'dark') {
  const colors = {
    info: {
      bg: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
      border: theme === 'dark' ? '#3b82f6' : '#2563eb',
      text: theme === 'dark' ? '#93c5fd' : '#1e40af',
      icon: 'ℹ️',
    },
    success: {
      bg: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
      border: theme === 'dark' ? '#10b981' : '#059669',
      text: theme === 'dark' ? '#6ee7b7' : '#047857',
      icon: '✅',
    },
    warning: {
      bg: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
      border: theme === 'dark' ? '#f59e0b' : '#d97706',
      text: theme === 'dark' ? '#fcd34d' : '#b45309',
      icon: '⚠️',
    },
    error: {
      bg: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
      border: theme === 'dark' ? '#ef4444' : '#dc2626',
      text: theme === 'dark' ? '#fca5a5' : '#b91c1c',
      icon: '❌',
    },
  };

  return colors[type as keyof typeof colors] || colors.info;
}

/**
 * MCPNotification component that displays a notification toast
 *
 * @example
 * ```tsx
 * import { MCPNotification } from '@warpy-auth-sdk/core/ai-mode';
 *
 * function NotificationsList() {
 *   const notifications = [...]; // MCPNotification[]
 *
 *   return (
 *     <div>
 *       {notifications.map((notification) => (
 *         <MCPNotification
 *           key={notification.id}
 *           notification={notification}
 *           onDismiss={handleDismiss}
 *           position="bottom"
 *           theme="auto"
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function MCPNotification({ notification, onDismiss, position, theme: themeProp }: MCPNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Determine actual theme
  const theme =
    themeProp === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : themeProp;

  const colors = getNotificationColors(notification.type, theme);

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Handle dismissal with fade out
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Match animation duration
  };

  // Format timestamp
  const timeAgo = () => {
    const seconds = Math.floor((Date.now() - notification.timestamp.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Position styles
  const positionStyle =
    position === 'bottom'
      ? { bottom: '80px', right: '16px' }
      : { top: '80px', right: '16px' };

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid={`mcp-notification-${notification.id}`}
      style={{
        position: 'fixed',
        ...positionStyle,
        zIndex: 10000,
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '300px',
        maxWidth: '400px',
        boxShadow:
          theme === 'dark'
            ? '0 10px 25px rgba(0, 0, 0, 0.5)'
            : '0 10px 25px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        opacity: isExiting ? 0 : isVisible ? 1 : 0,
        transform: isExiting
          ? 'translateX(100%)'
          : isVisible
            ? 'translateX(0)'
            : 'translateX(100%)',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '20px',
          flexShrink: 0,
        }}
        role="img"
        aria-label={`${notification.type} icon`}
      >
        {colors.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Tool name */}
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: colors.text,
            marginBottom: '4px',
            fontFamily: 'monospace',
          }}
        >
          {notification.toolName}
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: '13px',
            color: colors.text,
            marginBottom: '6px',
            lineHeight: '1.4',
            wordBreak: 'break-word',
          }}
        >
          {notification.message}
        </div>

        {/* Timestamp */}
        <div
          style={{
            fontSize: '11px',
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          }}
        >
          {timeAgo()}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          color: colors.text,
          cursor: 'pointer',
          padding: '4px',
          fontSize: '16px',
          flexShrink: 0,
          opacity: 0.7,
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7';
        }}
      >
        ✕
      </button>
    </div>
  );
}
