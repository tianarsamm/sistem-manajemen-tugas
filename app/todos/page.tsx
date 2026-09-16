"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Todo } from "@/lib/types";
import { uid } from "@/lib/utils";
import { TodoForm, TodoRow } from "@/components/todos";
import { Empty } from "@/components/ui";

const FILTERS: [string, string][] = [
  ["ALL", "Semua"],
  ["OPEN", "Terbuka"],
  ["DONE", "Selesai"],
];

export default function TodosPage() {
  const { data, loaded, upsert } = useStore();
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [editing, setEditing] = useState<Todo | null>(null);

  function add() {
    const title = draft.trim();
    if (!title) return;
    upsert("todos", {
      id: uid("d"),
      title,
      done: false,
      priority: "MEDIUM",
      due: "",
      category: "",
      createdAt: new Date().toISOString(),
    });
    setDraft("");
  }

  const list = data.todos
    .filter((t) => (filter === "OPEN" ? !t.done : filter === "DONE" ? t.done : true))
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) || (a.due || "9999").localeCompare(b.due || "9999"),
    );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">To-Do</h1>
          <p className="page-sub">Hal kecil yang cukup ditulis, dikerjakan, lalu dicoret.</p>
        </div>
      </div>

      <form
        className="quickadd"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          type="text"
          value={draft}
          placeholder="Tulis satu hal, tekan Enter"
          autoComplete="off"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Tambah
        </button>
      </form>

      <div className="toolbar">
        <div className="seg">
          {FILTERS.map(([v, l]) => (
            <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)}>
              {l}
            </button>
          ))}
        </div>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          {data.todos.filter((t) => !t.done).length} belum selesai
        </span>
      </div>

      <div className="panel">
        {!loaded ? (
          <div className="skeleton">Memuat data…</div>
        ) : list.length ? (
          <ul className="list">
            {list.map((t) => (
              <TodoRow key={t.id} todo={t} onEdit={setEditing} />
            ))}
          </ul>
        ) : (
          <Empty title="Daftar masih kosong" hint="Ketik di kolom atas untuk menambah item pertama." />
        )}
      </div>

      {editing ? <TodoForm todo={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}