/**
 * Hook to get fullscreen state and apply fullscreen styles to a container
 */

"use client";

import { useEffect, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Hook that returns whether sidebar is collapsed and applies fullscreen styles
 */
export function useSidebarFullscreen() {
  const { state } = useSidebar();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (state === "collapsed") {
      // Apply fullscreen styles
      const el = containerRef.current;
      el.style.setProperty('padding-left', '0', 'important');
      el.style.setProperty('padding-right', '0', 'important');
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('max-width', '100%', 'important');
      el.classList.add('fullscreen-mode');
    } else {
      // Remove fullscreen styles
      const el = containerRef.current;
      el.style.removeProperty('padding-left');
      el.style.removeProperty('padding-right');
      el.style.removeProperty('width');
      el.style.removeProperty('max-width');
      el.classList.remove('fullscreen-mode');
    }
  }, [state]);

  return {
    isFullscreen: state === "collapsed",
    containerRef,
  };
}

