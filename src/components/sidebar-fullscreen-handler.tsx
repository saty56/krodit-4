/**
 * Sidebar Fullscreen Handler
 * Ensures content area and pages take full width when sidebar is collapsed
 */

"use client";

import React, { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarFullscreenHandler() {
  const { state } = useSidebar();
  const styleTagRef = React.useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Create or get style tag for dynamic CSS
    if (!styleTagRef.current) {
      const styleTag = document.createElement('style');
      styleTag.id = 'sidebar-fullscreen-styles';
      document.head.appendChild(styleTag);
      styleTagRef.current = styleTag;
    }

    const styleTag = styleTagRef.current;

    if (state === "collapsed") {
      // Inject CSS rules for fullscreen mode
      styleTag.textContent = `
        [data-slot="sidebar-wrapper"][data-state="collapsed"] {
          width: 100vw !important;
          max-width: 100vw !important;
        }
        [data-slot="sidebar-wrapper"][data-state="collapsed"] [data-slot="sidebar-gap"] {
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          flex-shrink: 0 !important;
        }
        [data-slot="sidebar-wrapper"][data-state="collapsed"] [data-slot="sidebar-inset"] {
          width: 100vw !important;
          max-width: 100vw !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          flex: 1 1 100vw !important;
        }
        [data-slot="sidebar-wrapper"][data-state="collapsed"] [data-slot="sidebar-inset"] > div {
          width: 100% !important;
          max-width: 100% !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
        [data-slot="sidebar-wrapper"][data-state="collapsed"] .sidebar-page-container {
          padding-left: 1rem !important;
          padding-right: 1rem !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        [data-slot="sidebar-wrapper"][data-state="collapsed"] .navbar-container {
          width: 100% !important;
          max-width: 100% !important;
        }
      `;

      // Also add class to body
      document.body.classList.add('sidebar-collapsed');
    } else {
      // Remove CSS rules
      styleTag.textContent = '';
      document.body.classList.remove('sidebar-collapsed');
    }

    return () => {
      // Cleanup on unmount
      if (styleTagRef.current && styleTagRef.current.parentNode) {
        styleTagRef.current.parentNode.removeChild(styleTagRef.current);
        styleTagRef.current = null;
      }
    };
  }, [state]);

  return null;
}

