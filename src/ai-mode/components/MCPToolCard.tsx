/**
 * MCPToolCard Component
 * @module ai-mode/components/MCPToolCard
 *
 * Displays information about an MCP tool in a card format
 */

'use client';

import React from 'react';
import type { MCPToolCardProps } from '../types';

/**
 * Get category color based on tool category
 */
function getCategoryColor(category: string, theme: 'light' | 'dark'): string {
  const colors = {
    auth: theme === 'dark' ? '#3b82f6' : '#2563eb', // blue
    flight: theme === 'dark' ? '#8b5cf6' : '#7c3aed', // purple
    user: theme === 'dark' ? '#10b981' : '#059669', // green
    payment: theme === 'dark' ? '#f59e0b' : '#d97706', // amber
    custom: theme === 'dark' ? '#6b7280' : '#4b5563', // gray
  };

  return colors[category as keyof typeof colors] || colors.custom;
}

/**
 * Get category icon based on tool category
 */
function getCategoryIcon(category: string): string {
  const icons = {
    auth: '🔐',
    flight: '✈️',
    user: '👤',
    payment: '💳',
    custom: '🔧',
  };

  return icons[category as keyof typeof icons] || icons.custom;
}

/**
 * MCPToolCard component that displays information about an MCP tool
 *
 * @example
 * ```tsx
 * import { MCPToolCard } from '@warpy-auth-sdk/core/ai-mode';
 *
 * function ToolsList() {
 *   const tools = [...]; // MCPToolInfo[]
 *
 *   return (
 *     <div>
 *       {tools.map((tool) => (
 *         <MCPToolCard
 *           key={tool.name}
 *           tool={tool}
 *           theme="auto"
 *           onClick={(tool) => console.log('Clicked:', tool.name)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function MCPToolCard({ tool, isActive = false, theme: themeProp = 'auto', onClick }: MCPToolCardProps) {
  // Determine actual theme
  const theme =
    themeProp === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : themeProp;

  const isDark = theme === 'dark';

  // Colors based on theme
  const bgColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isActive ? getCategoryColor(tool.category, theme) : isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const mutedColor = isDark ? '#9ca3af' : '#6b7280';
  const hoverBgColor = isDark ? '#374151' : '#f9fafb';

  return (
    <div
      onClick={() => onClick?.(tool)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(tool);
        }
      }}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`MCP Tool: ${tool.name}`}
      data-testid={`mcp-tool-card-${tool.name}`}
      style={{
        backgroundColor: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '12px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? `0 0 12px ${borderColor}` : 'none',
        position: 'relative',
        minWidth: '200px',
        maxWidth: '250px',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = hoverBgColor;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 4px 12px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = bgColor;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isActive ? `0 0 12px ${borderColor}` : 'none';
        }
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: getCategoryColor(tool.category, theme),
            border: `2px solid ${bgColor}`,
            animation: 'pulse 2s infinite',
          }}
          aria-label="Active indicator"
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }} role="img" aria-label={`${tool.category} icon`}>
          {getCategoryIcon(tool.category)}
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: textColor,
              marginBottom: '2px',
              fontFamily: 'monospace',
            }}
          >
            {tool.name}
          </div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 500,
              color: getCategoryColor(tool.category, theme),
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {tool.category}
          </div>
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: '12px',
          color: mutedColor,
          marginBottom: '8px',
          lineHeight: '1.4',
        }}
      >
        {tool.description}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Auth badge */}
        {tool.requiresAuth && (
          <div
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
              color: isDark ? '#fca5a5' : '#dc2626',
              fontWeight: 500,
            }}
          >
            🔒 Auth Required
          </div>
        )}

        {/* Scopes */}
        {tool.scopes && tool.scopes.length > 0 && (
          <div
            style={{
              fontSize: '10px',
              color: mutedColor,
              fontFamily: 'monospace',
            }}
            title={`Required scopes: ${tool.scopes.join(', ')}`}
          >
            {tool.scopes.slice(0, 2).join(', ')}
            {tool.scopes.length > 2 && ` +${tool.scopes.length - 2}`}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `
      }} />
    </div>
  );
}
