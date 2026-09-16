"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PRIORITIES, type Todo } from "@/lib/types";
import { Check, DueBadge, Modal, PriorityBadge } from "./ui";

export function TodoRow({ todo, onEdit }: { todo: Todo; onEdit?: (t: Todo) => void }) {
  const { upsert, remove, confirm, toast } = useStore();

  return (
    <li>
      <Check
        checked={todo.done}
        label="Tandai to-do selesai"
        onChange={() => upsert("todos", { ...todo, done: !todo.done })}
      />
      <div className="body">
        <div className={todo.done ? "ttl done" : "ttl"}>{todo.title}</div>
        <div className="meta">
          <PriorityBadge value={todo.priority} />
          {todo.category ? <span className="tag">{todo.category}</span> : null}
          <DueBadge date={todo.due} />
        </div>
      </div>
      <div className="acts">
        {onEdit ? (
          <button type="button" className="icobtn" aria-label="Ubah to-do" onClick={() => onEdit(todo)}>
            ✎
          </button>
        ) : null}
        <button
          type="button"
          className="icobtn"
          aria-label="Hapus to-do"
          onClick={() =>
            confirm({
              title: "Hapus to-do?",
              body: "Item ini dihapus permanen.",
              action: "Hapus",
              onConfirm: () => {
                remove("todos", todo.id);
                toast("To-do dihapus");
              },
            })
          }
        >
          🗑
        </button>
      </div>
    </li>
  );
}

export function TodoForm({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const { upsert, toast } = useStore();
  const [draft, setDraft] = useState<Todo>({ ...todo });
  const [showError, setShowError] = useState(false);
  const invalid = !draft.title.trim();

  return (
    <Modal
      title="Ubah to-do"
      submitLabel="Simpan perubahan"
      onClose={onClose}
      onSubmit={() => {
        if (invalid) {
          setShowError(true);
          return;
        }
        upsert("todos", { ...draft, title: draft.title.trim(), category: draft.category.trim() });
        toast("To-do diperbarui");
        onClose();
      }}
    >
      <div className={showError && invalid ? "field invalid" : "field"}>
        <label className="f" htmlFor="dTitle">Judul</label>
        <input
          id="dTitle"
          type="text"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        {showError && invalid ? <div className="err">Judul wajib diisi.</div> : null}
      </div>
      <div className="row three field">
        <div>
          <label className="f" htmlFor="dPriority">Prioritas</label>
          <select
            id="dPriority"
            value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: e.target.value as Todo["priority"] })}
          >
            {PRIORITIES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="f" htmlFor="dDue">Jatuh tempo</label>
          <input
            id="dDue"
            type="date"
            value={draft.due}
            onChange={(e) => setDraft({ ...draft, due: e.target.value })}
          />
        </div>
        <div>
          <label className="f" htmlFor="dCat">Kategori</label>
          <input
            id="dCat"
            type="text"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
}