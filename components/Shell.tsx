"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { today } from "@/lib/utils";
import { Modal } from "./ui";
import Player from "./Player";

const NAV = [
  { href: "/", label: "Dasbor", icon: "◱", tab: true },
  { href: "/tasks", label: "Tugas", icon: "▤", tab: true },
  { href: "/todos", label: "To-Do", icon: "✓", tab: true },
  { href: "/calendar", label: "Kalender", icon: "▦", tab: true },
  { href: "/meetings", label: "Rapat", icon: "◷", tab: false },
  { href: "/music", label: "Musik", icon: "♪", tab: true },
  { href: "/settings", label: "Pengaturan", icon: "⚙", tab: false },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { data, toastMessage, confirmRequest, closeConfirm } = useStore();

  const counts: Record<string, number> = {
    "/tasks": data.tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length,
    "/todos": data.todos.filter((t) => !t.done).length,
    "/meetings": data.meetings.filter((m) => m.date >= today()).length,
  };
  const current = (href: string) => (path === href ? "page" : undefined);

  return (
    <>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <span className="mark">Fokus</span>
            {/* <span className="sub">ruang kerja harian</span> */}
          </div>
          <nav className="nav">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-current={current(item.href)}>
                <span className="ico">{item.icon}</span>
                <span>{item.label}</span>
                {counts[item.href] ? <span className="count">{counts[item.href]}</span> : null}
              </Link>
            ))}
          </nav>
        </aside>

        <div>
          <header className="mobile-head">
            <span className="mark">Fokus</span>
            <span style={{ display: "flex", gap: 8 }}>
              <Link className="btn btn-sm" href="/meetings">
                Rapat
              </Link>
              <Link className="btn btn-sm" href="/settings">
                Pengaturan
              </Link>
            </span>
          </header>
          <main>{children}</main>
        </div>
      </div>

      <nav className="tabbar">
        {NAV.filter((i) => i.tab).map((item) => (
          <Link key={item.href} href={item.href} aria-current={current(item.href)}>
            <span className="ico">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <Player />

      {toastMessage ? <div className="toast">{toastMessage}</div> : null}

      {confirmRequest ? (
        <Modal
          title={confirmRequest.title}
          submitLabel={confirmRequest.action}
          danger
          onClose={closeConfirm}
          onSubmit={() => {
            confirmRequest.onConfirm();
            closeConfirm();
          }}
        >
          <p style={{ margin: 0, color: "var(--muted)" }}>{confirmRequest.body}</p>
        </Modal>
      ) : null}
    </>
  );
}