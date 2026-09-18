"use client";

import { useEffect } from "react";
import { dueInfo } from "@/lib/utils";
import { labelOf, PRIORITIES, type Priority } from "@/lib/types";

export function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {hint}
    </div>
  );
}

export function Check({
  checked, onChange, small, label,
}: { checked: boolean; onChange: () => void; small?: boolean; label: string }) {
  return (
    <button
      type="button"
      className={small ? "check sm" : "check"}
      aria-pressed={checked}
      aria-label={label}
      onClick={onChange}
    >
      <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M1 6.5L4.2 9.5L11 2.5"
          stroke="var(--accent-ink)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function PriorityBadge({ value }: { value: Priority }) {
  return (
    <span className="pri">
      <i className={`dot ${value}`} />
      {labelOf(PRIORITIES, value)}
    </span>
  );
}

export function DueBadge({ date, completed = false }: { date: string; completed?: boolean }) {
  if (completed) return <span className="tag">Selesai</span>;
  const info = dueInfo(date);
  if (!info) return null;
  return <span className={`tag ${info.cls}`}>{info.text}</span>;
}

export function Modal({
  title, children, onClose, onSubmit, submitLabel, danger,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  danger?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button type="button" className="icobtn" aria-label="Tutup" onClick={onClose}>
            ✕
          </button>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="content">{children}</div>
          <footer>
            <button type="button" className="btn" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className={danger ? "btn btn-danger" : "btn btn-primary"}>
              {submitLabel}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}