"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { labelOf, PRIORITIES, STATUSES, type Subtask, type Task } from "@/lib/types";
import { subProgress, uid } from "@/lib/utils";
import { Check, DueBadge, Modal, PriorityBadge } from "./ui";

/* ------------------------------ baris tugas ------------------------------ */

export function TaskRow({
  task, expand, onEdit,
}: { task: Task; expand?: boolean; onEdit?: (t: Task) => void }) {
  const { upsert, remove, confirm, toast } = useStore();
  const progress = subProgress(task);
  const isDone = task.status === "COMPLETED";

  function toggleTask() {
    const subtasks = task.subtasks.map((s) => ({ ...s, done: isDone ? s.done : true }));
    upsert("tasks", {
      ...task,
      status: isDone ? "TODO" : "COMPLETED",
      subtasks,
      updatedAt: new Date().toISOString(),
    });
  }

  function toggleSub(index: number) {
    const subtasks = task.subtasks.map((s, i) => (i === index ? { ...s, done: !s.done } : s));
    const all = subtasks.length > 0 && subtasks.every((s) => s.done);
    let status = task.status;
    if (all) status = "COMPLETED";
    else if (status === "COMPLETED") status = "IN_PROGRESS";
    else if (status === "TODO" && subtasks.some((s) => s.done)) status = "IN_PROGRESS";
    upsert("tasks", { ...task, subtasks, status, updatedAt: new Date().toISOString() });
  }

  function askDelete() {
    confirm({
      title: "Hapus tugas?",
      body: "Tugas dan subtugasnya dihapus permanen dan tidak bisa dikembalikan.",
      action: "Hapus",
      onConfirm: () => {
        remove("tasks", task.id);
        toast("Tugas dihapus");
      },
    });
  }

  return (
    <li>
      <Check checked={isDone} onChange={toggleTask} label="Tandai tugas selesai" />
      <div className="body">
        <div className={isDone ? "ttl done" : "ttl"}>{task.title}</div>
        {expand && task.desc ? (
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>{task.desc}</div>
        ) : null}
        <div className="meta">
          <span className={`status ${task.status}`}>{labelOf(STATUSES, task.status)}</span>
          <PriorityBadge value={task.priority} />
          {task.category ? <span className="tag">{task.category}</span> : null}
          <DueBadge date={task.due} />
          {progress ? (
            <span className="tag">
              {progress.done}/{progress.total} subtugas
            </span>
          ) : null}
        </div>
        {progress ? (
          <div className="bar">
            <i style={{ width: `${progress.pct}%` }} />
          </div>
        ) : null}
        {expand && progress ? (
          <ul className="subs">
            {task.subtasks.map((s, i) => (
              <li key={i}>
                <Check
                  small
                  checked={s.done}
                  onChange={() => toggleSub(i)}
                  label={`Tandai subtugas ${s.title}`}
                />
                <span className={s.done ? "done-text" : undefined}>{s.title}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="acts">
        {onEdit ? (
          <button type="button" className="icobtn" aria-label="Ubah tugas" onClick={() => onEdit(task)}>
            ✎
          </button>
        ) : null}
        <button type="button" className="icobtn" aria-label="Hapus tugas" onClick={askDelete}>
          🗑
        </button>
      </div>
    </li>
  );
}

/* ------------------------------ form tugas ------------------------------- */

type Draft = Pick<Task, "title" | "desc" | "status" | "priority" | "due" | "category"> & {
  subtasks: Subtask[];
};

const emptyDraft: Draft = {
  title: "", desc: "", status: "TODO", priority: "MEDIUM", due: "", category: "", subtasks: [],
};

function toDraft(task: Task): Draft {
  return {
    title: task.title,
    desc: task.desc,
    status: task.status,
    priority: task.priority,
    due: task.due,
    category: task.category,
    subtasks: task.subtasks.map((s) => ({ ...s })),
  };
}

export function TaskForm({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { upsert, toast } = useStore();
  const [draft, setDraft] = useState<Draft>(task ? toDraft(task) : emptyDraft);
  const [showError, setShowError] = useState(false);
  const titleInvalid = !draft.title.trim();

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function submit() {
    if (titleInvalid) {
      setShowError(true);
      return;
    }
    const now = new Date().toISOString();
    const subtasks = draft.subtasks.filter((s) => s.title.trim());
    upsert("tasks", {
      id: task ? task.id : uid("t"),
      createdAt: task ? task.createdAt : now,
      ...draft,
      title: draft.title.trim(),
      desc: draft.desc.trim(),
      category: draft.category.trim(),
      subtasks,
      updatedAt: now,
    });
    toast(task ? "Tugas diperbarui" : "Tugas dibuat");
    onClose();
  }

  return (
    <Modal
      title={task ? "Ubah tugas" : "Tugas baru"}
      submitLabel={task ? "Simpan perubahan" : "Buat tugas"}
      onClose={onClose}
      onSubmit={submit}
    >
      <div className={showError && titleInvalid ? "field invalid" : "field"}>
        <label className="f" htmlFor="tTitle">Judul</label>
        <input
          id="tTitle"
          type="text"
          value={draft.title}
          placeholder="Misalnya: Bangun situs klien"
          onChange={(e) => set("title", e.target.value)}
        />
        {showError && titleInvalid ? <div className="err">Judul wajib diisi.</div> : null}
      </div>

      <div className="field">
        <label className="f" htmlFor="tDesc">Catatan</label>
        <textarea
          id="tDesc"
          value={draft.desc}
          placeholder="Konteks, tautan, atau definisi selesai"
          onChange={(e) => set("desc", e.target.value)}
        />
      </div>

      <div className="row three field">
        <div>
          <label className="f" htmlFor="tStatus">Status</label>
          <select id="tStatus" value={draft.status} onChange={(e) => set("status", e.target.value as Task["status"])}>
            {STATUSES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="f" htmlFor="tPriority">Prioritas</label>
          <select id="tPriority" value={draft.priority} onChange={(e) => set("priority", e.target.value as Task["priority"])}>
            {PRIORITIES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="f" htmlFor="tDue">Jatuh tempo</label>
          <input id="tDue" type="date" value={draft.due} onChange={(e) => set("due", e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label className="f" htmlFor="tCat">Kategori</label>
        <input
          id="tCat"
          type="text"
          value={draft.category}
          placeholder="Klien, pribadi, belajar…"
          onChange={(e) => set("category", e.target.value)}
        />
      </div>

      <div className="field">
        <label className="f">Subtugas</label>
        {draft.subtasks.map((s, i) => (
          <div className="subrow" key={i}>
            <input
              type="text"
              value={s.title}
              placeholder="Langkah kecil"
              onChange={(e) =>
                set("subtasks", draft.subtasks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
              }
            />
            <button
              type="button"
              className="icobtn"
              aria-label="Hapus subtugas"
              onClick={() => set("subtasks", draft.subtasks.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => set("subtasks", [...draft.subtasks, { title: "", done: false }])}
        >
          Tambah subtugas
        </button>
      </div>
    </Modal>
  );
}