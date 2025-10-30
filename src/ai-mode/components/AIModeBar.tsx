/**
 * AIModeBar Component
 * @module ai-mode/components/AIModeBar
 *
 * Displays a bar at the top or bottom of the screen showing AI Mode status and available tools
 */

"use client";

/* eslint-env browser */

import React from "react";
// @ts-expect-error - react-dom types are optional for this UI helper
import { createPortal } from "react-dom";
import type { AIModeBarProps } from "../types";

/**
 * AIModeBar component that displays AI Mode status and available MCP tools
 *
 * @example
 * ```tsx
 * import { AIModeBar } from '@warpy-auth-sdk/core/ai-mode';
 *
 * function MyApp() {
 *   const [isActive, setIsActive] = useState(false);
 *   const tools = [...]; // MCPToolInfo[]
 *
 *   return (
 *     <>
 *       <AIModeBar
 *         isActive={isActive}
 *         availableTools={tools}
 *         position="bottom"
 *         theme="auto"
 *         onToggle={() => setIsActive(!isActive)}
 *       />
 *       <YourContent />
 *     </>
 *   );
 * }
 * ```
 */
export function AIModeBar({
  isActive,
  availableTools,
  loadingTools,
  position,
  theme: themeProp,
  onToggle,
  onViewActivity,
}: AIModeBarProps) {
  // Always show tools when active
  const isExpanded = isActive;

  // Prevent page scroll when active (and restore on deactivate)
  React.useEffect(() => {
    if (!isActive) return;
    if (typeof globalThis === "undefined") return;
    const doc = (
      globalThis as unknown as {
        document?: { body: { style: { overflow: string } } };
      }
    ).document;
    if (!doc) return;
    const previousOverflow = doc.body.style.overflow;
    doc.body.style.overflow = "hidden";
    return () => {
      doc.body.style.overflow = previousOverflow;
    };
  }, [isActive]);

  // Determine actual theme
  const prefersDark =
    typeof window !== "undefined" &&
    // eslint-disable-next-line no-undef
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme =
    themeProp === "auto" ? (prefersDark ? "dark" : "light") : themeProp;

  // Body element for portal overlay (safe on SSR)
  const docBody = (() => {
    if (typeof globalThis === "undefined") return null;
    const g = globalThis as unknown as { document?: { body?: unknown } };
    return g.document && g.document.body ? (g.document.body as any) : null;
  })();

  const isDark = theme === "dark";

  // Colors based on theme
  const bgColor = isDark
    ? "rgba(17, 24, 39, 0.95)"
    : "rgba(255, 255, 255, 0.95)";
  const borderColor = isDark ? "#374151" : "#e5e7eb";
  const textColor = isDark ? "#f9fafb" : "#111827";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";
  const accentColor = isActive ? (isDark ? "#3b82f6" : "#2563eb") : mutedColor;

  // Position styles
  const positionStyle =
    position === "bottom"
      ? { bottom: 0, borderTop: `2px solid ${borderColor}` }
      : { top: 0, borderBottom: `2px solid ${borderColor}` };

  // Determine whether to show the tools card (show while loading too)
  const showToolsCard = loadingTools || availableTools.length > 0;

  // INACTIVE STATE: Show compact centered button
  if (!isActive) {
    return (
      <div
        role="button"
        aria-label="Activate AI Mode"
        data-testid="ai-mode-bar-compact"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onToggle();
          }
        }}
        tabIndex={0}
        style={{
          position: "fixed",
          bottom: position === "bottom" ? "20px" : undefined,
          top: position === "top" ? "18px" : undefined,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9998,
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          border: `2px solid ${borderColor}`,
          borderRadius: "24px",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(10px)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateX(-50%) scale(1.05)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateX(-50%) scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        }}
      >
        {/* Robot Icon */}
        <div
          style={{
            fontSize: "10px",
          }}
          role="img"
          aria-label="AI Mode icon"
        >
          ✨
        </div>

        {/* Text */}
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: textColor,
          }}
        >
          AI Mode
        </div>

        {/* Badge */}
        <div
          style={{
            fontSize: "8px",
            fontWeight: 500,
            color: mutedColor,
            backgroundColor: isDark
              ? "rgba(107, 114, 128, 0.2)"
              : "rgba(107, 114, 128, 0.1)",
            padding: "2px 8px",
            borderRadius: "12px",
          }}
        >
          Inactive
        </div>
      </div>
    );
  }

  // ACTIVE STATE: Show full bar
  return (
    <div
      role="region"
      aria-label="AI Mode Status Bar"
      data-testid="ai-mode-bar"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        ...positionStyle,
        zIndex: 10001,
        backgroundColor: bgColor,
        backdropFilter: "blur(10px)",
        boxShadow:
          position === "bottom"
            ? "0 -4px 12px rgba(0, 0, 0, 0.1)"
            : "0 4px 12px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Background overlay to block interactions and dim the page (portal) */}
      {isActive && docBody
        ? createPortal(
            <div
              aria-hidden="true"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                zIndex: 10000,
              }}
            />,
            docBody
          )
        : null}
      {/* Main Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "12px 24px",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        {/* AI Mode Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: textColor,
              }}
            >
              AI Mode
            </div>
            <div
              style={{
                fontSize: "10px",
                color: accentColor,
                fontWeight: 500,
              }}
            >
              {isActive ? "Active" : "Inactive"}
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          aria-label={isActive ? "Disable AI Mode" : "Enable AI Mode"}
          aria-pressed={isActive}
          style={{
            backgroundColor: isActive
              ? accentColor
              : isDark
                ? "#374151"
                : "#e5e7eb",
            border: "none",
            borderRadius: "20px",
            padding: "6px 16px",
            color: isActive ? "#ffffff" : textColor,
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.opacity = "1";
          }}
        >
          {isActive ? "Disable" : "Enable"}
        </button>

        {/* Tools Count */}
        {isActive && (
          <div
            style={{
              fontSize: "12px",
              color: mutedColor,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontWeight: 600, color: textColor }}>
              {availableTools.length}
            </span>{" "}
            {availableTools.length === 1 ? "tool" : "tools"} available
          </div>
        )}

        {/* View Activity Button */}
        {isActive && onViewActivity && (
          <button
            onClick={onViewActivity}
            aria-label="View activity history"
            style={{
              background: "none",
              border: `1px solid ${borderColor}`,
              borderRadius: "6px",
              padding: "6px 12px",
              color: textColor,
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark
                ? "#374151"
                : "#f9fafb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            📊 Activity
          </button>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Info Text */}
        {isActive && (
          <div
            style={{
              fontSize: "11px",
              color: mutedColor,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🔒</span>
            <span>Protected by MCP Shield</span>
          </div>
        )}
      </div>

      {/* Floating MCP Tools Card */}
      {isExpanded && isActive && showToolsCard && (
        <div
          style={{
            position: "fixed",
            bottom: position === "bottom" ? "90px" : undefined,
            top: position === "top" ? "90px" : undefined,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10002,
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "16px",
            padding: "20px",
            maxWidth: "400px",
            width: "90vw",
            maxHeight: "70vh",
            overflowY: "auto",
            overflowX: "hidden",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid #2a2a2a",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              MCP Tools
            </h3>
            <button
              onClick={() => {
                // Optional: implement view all functionality
                console.log("View all tools");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#3b82f6",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              View All
            </button>
          </div>

          {/* Tools List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {loadingTools ? (
              <div style={{ fontSize: "12px", color: mutedColor }}>
                <span>🔄</span>
                <span>Loading tools...</span>
              </div>
            ) : (
              availableTools.map((tool) => (
                <div
                  key={tool.name}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px",
                    backgroundColor: "#242424",
                    borderRadius: "8px",
                    transition: "background-color 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#2a2a2a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#242424";
                  }}
                >
                  {/* Tool Icon */}
                  <div
                    style={{
                      fontSize: "16px",
                      flexShrink: 0,
                    }}
                    role="img"
                    aria-label={`${tool.category} icon`}
                  >
                    🔧
                  </div>

                  {/* Tool Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#ffffff",
                        marginBottom: "4px",
                        fontFamily: "monospace",
                      }}
                    >
                      {tool.name}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#9ca3af",
                        lineHeight: "1.5",
                      }}
                    >
                      {tool.description}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `,
        }}
      />
    </div>
  );
}
