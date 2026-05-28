import React from "react";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Inline SVG icons (Lucide-style, 1.75px stroke)
export function Icon({ name, size = 18, className = "", style = {} }: IconProps) {
  const s = size;
  const props: React.SVGProps<SVGSVGElement> = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "icon " + className,
    style,
  };

  switch (name) {
    case "home":
      return <svg {...props}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>;
    case "forms":
      return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
    case "users":
      return <svg {...props}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 11a3 3 0 1 0 0-6"/><path d="M18 20a5 5 0 0 0-3.5-4.8"/></svg>;
    case "draft":
      return <svg {...props}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="m12 18 1.5-1.5"/></svg>;
    case "search":
      return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case "template":
      return <svg {...props}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>;
    case "report":
      return <svg {...props}><path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h5"/></svg>;
    case "provider":
      return <svg {...props}><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/><path d="M9 11h.01M15 11h.01"/></svg>;
    case "rag":
      return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><circle cx="11" cy="11" r="2.5"/></svg>;
    case "database":
      return <svg {...props}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>;
    case "folder":
      return <svg {...props}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
    case "settings":
      return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 0 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"/></svg>;
    case "bell":
      return <svg {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>;
    case "video":
      return <svg {...props}><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/></svg>;
    case "mic":
      return <svg {...props}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>;
    case "chevron-left":
      return <svg {...props}><path d="m15 18-6-6 6-6"/></svg>;
    case "chevron-right":
      return <svg {...props}><path d="m9 18 6-6-6-6"/></svg>;
    case "chevron-down":
      return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case "plus":
      return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case "x":
      return <svg {...props}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case "maximize":
      return <svg {...props}><path d="M3 9V4a1 1 0 0 1 1-1h5"/><path d="M21 9V4a1 1 0 0 0-1-1h-5"/><path d="M21 15v5a1 1 0 0 1-1 1h-5"/><path d="M3 15v5a1 1 0 0 0 1 1h5"/></svg>;
    case "minimize":
      return <svg {...props}><path d="M9 3v5a1 1 0 0 1-1 1H3"/><path d="M15 3v5a1 1 0 0 0 1 1h5"/><path d="M15 21v-5a1 1 0 0 1 1-1h5"/><path d="M9 21v-5a1 1 0 0 0-1-1H3"/></svg>;
    case "upload":
      return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v13"/></svg>;
    case "download":
      return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 11 5 5 5-5"/><path d="M12 16V3"/></svg>;
    case "filter":
      return <svg {...props}><path d="M3 4h18l-7 9v6l-4 2v-8z"/></svg>;
    case "trend-up":
      return <svg {...props}><path d="M3 17 9 11l4 4 8-8"/><path d="M14 7h7v7"/></svg>;
    case "trend-down":
      return <svg {...props}><path d="M3 7 9 13l4-4 8 8"/><path d="M14 17h7v-7"/></svg>;
    case "clock":
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "check":
      return <svg {...props}><path d="m5 12 5 5 9-11"/></svg>;
    case "play":
      return <svg {...props}><path d="m6 4 14 8-14 8z" fill="currentColor"/></svg>;
    case "sparkles":
      return <svg {...props}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.5"/></svg>;
    case "warning":
      return <svg {...props}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>;
    case "copy":
      return <svg {...props}><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>;
    case "share":
      return <svg {...props}><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 11 7.6-3.8M8.2 13l7.6 3.8"/></svg>;
    case "trash":
      return <svg {...props}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>;
    case "more":
      return <svg {...props}><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>;
    case "calendar":
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case "map-pin":
      return <svg {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case "phone":
      return <svg {...props}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2H7a2 2 0 0 1 2 1.7c.1.8.3 1.6.6 2.4a2 2 0 0 1-.4 2.1L8 9.4a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.8.3 1.6.5 2.4.6a2 2 0 0 1 1.7 2z"/></svg>;
    case "mail":
      return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
    case "send":
      return <svg {...props}><path d="m3 11 18-8-8 18-2-8z"/></svg>;
    case "loader":
      return <svg {...props}><path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>;
    case "logo":
      return <svg {...props}><path d="M5 4h10l4 4v12a2 2 0 0 1-2 2H5z"/><path d="M14 4v5h5"/><path d="m9 14 2 2 4-4"/></svg>;
    case "panels":
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 12h6"/></svg>;
    case "zap":
      return <svg {...props}><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg>;
    case "book":
      return <svg {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/></svg>;
    case "scale":
      return <svg {...props}><path d="M12 3v18M3 7h18"/><path d="m7 7-4 7a4 4 0 0 0 8 0z"/><path d="m17 7-4 7a4 4 0 0 0 8 0z"/></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
  }
}
