"use client";

import React from "react";
import { getLogoUrlViaApi } from "@/lib/logo-api";
import { fallbackIconUrls } from "@/lib/logos";
import { GeneratedAvatar } from "@/components/gen-avatar";

/**
 * Component that displays a logo for a subscription service by name
 * Fetches logo from API and handles loading/error states
 */
export function LogoByName({ 
  name, 
  className = "size-10" 
}: { 
  name: string; 
  className?: string;
}) {
  const [src, setSrc] = React.useState<string>("");
  
  React.useEffect(() => {
    let mounted = true;
    const q = String(name || "").trim();
    
    if (!q) { 
      setSrc(""); 
      return; 
    }
    
    getLogoUrlViaApi(q).then((url) => {
      if (!mounted) return;
      if (url) {
        setSrc(url);
      } else {
        // Fallback to generated icon URLs if API doesn't return a logo
        const fallbacks = fallbackIconUrls(q, 128);
        setSrc(fallbacks[0] || "");
      }
    });
    
    return () => { 
      mounted = false; 
    };
  }, [name]);

  if (!name) {
    return <div className={className} />;
  }

  if (!src) {
    return <div className={`${className} rounded bg-muted`} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`${className} rounded`}
      onError={(e) => {
        const el = e.currentTarget as HTMLImageElement;
        const fallbacks = fallbackIconUrls(name, 128);
        const idx = Number(el.dataset.fbIndex || 0);
        
        if (idx < fallbacks.length) {
          el.dataset.fbIndex = String(idx + 1);
          el.src = fallbacks[idx];
        } else {
          el.onerror = null;
        }
      }}
    />
  );
}

