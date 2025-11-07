"use client";

import React from "react";

interface AuthLoadingOverlayProps {
  message: string;
  fullScreen?: boolean;
}

/**
 * Reusable loading overlay component for authentication flows
 * Prevents page blink/flash during OAuth redirects and auth state checks
 */
export function AuthLoadingOverlay({ message, fullScreen = false }: AuthLoadingOverlayProps) {
  const containerStyle: React.CSSProperties = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        background: 'var(--background, #fff)',
        zIndex: 9999,
      }
    : {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      };

  const spinnerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center' }}>
        <div style={spinnerStyle} />
        <p style={{ color: '#666', fontSize: '14px' }}>{message}</p>
      </div>
    </div>
  );
}

