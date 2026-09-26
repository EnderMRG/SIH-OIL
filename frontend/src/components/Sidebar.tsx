"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Map, Layers, Activity, FlaskConical,
  AlertTriangle, FileText, Smartphone, ChevronRight
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Command Center" },
  { href: "/map",           icon: Map,             label: "Well Map" },
  { href: "/correlation",   icon: Layers,          label: "Correlation" },
  { href: "/telemetry",     icon: Activity,        label: "Live Telemetry" },
  { href: "/pore-pressure", icon: FlaskConical,    label: "Pore Pressure" },
  { href: "/advisory",      icon: AlertTriangle,   label: "Advisory" },
  { href: "/documents",     icon: FileText,        label: "Documents" },
  { href: "/pwa-field",     icon: Smartphone,      label: "Field View" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Logo / Brand */}
      <div className="px-4 py-5 border-b border-[var(--color-base-700)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[var(--color-live)] flex items-center justify-center">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, color: "#0a1929" }}>NW</span>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-base-50)", letterSpacing: "0.05em" }}>NWIS</div>
            <div className="mono-label" style={{ fontSize: "0.58rem" }}>eRTMAC Platform</div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <ul className="py-3 space-y-0.5 px-2" role="list">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150"
                style={{
                  color: active ? "var(--color-base-50)" : "var(--color-base-400)",
                  background: active ? "var(--color-base-800)" : "transparent",
                  fontWeight: active ? 600 : 400,
                }}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={15} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={12} style={{ color: "var(--color-live)" }} />}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer — system version */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-[var(--color-base-700)]">
        <p className="mono-label" style={{ fontSize: "0.58rem" }}>SIH26121 · Oil India Limited</p>
        <p className="mono-label" style={{ fontSize: "0.58rem" }}>v1.0.0-mock</p>
      </div>
    </nav>
  );
}
