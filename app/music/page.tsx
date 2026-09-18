"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Playlist } from "@/lib/types";
import { uid, ytId } from "@/lib/utils";
import { Empty, Modal } from "@/components/ui";

export default function MusicPage() {
  const { data, loaded, upsert, remove, confirm, toast, play, playing } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [playlistFormOpen, setPlaylistFormOpen] = useState(false);

  const active =
    data.playlists.find((p) => p.id === selectedId) ?? data.playlists[0] ?? null;
  const items = active ? data.music.filter((m) => m.playlistId === active.id) : [];

  function addVideo() {
    if (!active) return;
    const videoId = ytId(url);
    if (!videoId) {
      setUrlError(true);
      return;
    }
    upsert("music", {
      id: uid("v"),
      playlistId: active.id,
      videoId,
      title: `Video ${videoId}`,
      url: url.trim(),
      createdAt: new Date().toISOString(),
    });
    setUrl("");
    setUrlError(false);
    toast("Video ditambahkan");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Musik</h1>
          <p className="page-sub">Tempel tautan YouTube, kelompokkan jadi playlist, putar sambil bekerja.</p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setEditingPlaylist(null);
            setPlaylistFormOpen(true);
          }}
        >
          Playlist baru
        </button>
      </div>

      <div className="mus-grid">
        <div className="panel" style={{ alignSelf: "start" }}>
          <div className="panel-head"><h3>Playlist</h3></div>
          {!loaded ? (
            <div className="skeleton">Memuat…</div>
          ) : data.playlists.length ? (
            <ul className="pl">
              {data.playlists.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-current={active?.id === p.id}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <span>{p.name}</span>
                    <span className="count">
                      {data.music.filter((m) => m.playlistId === p.id).length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Belum ada playlist" hint="Buat satu, misalnya “Fokus dalam”." />
          )}
        </div>

        <div>
          {active ? (
            <>
              <div className="panel" style={{ marginBottom: 14 }}>
                <div className="panel-head">
                  <h3>{active.name}</h3>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="icobtn"
                      aria-label="Ubah nama playlist"
                      onClick={() => {
                        setEditingPlaylist(active);
                        setPlaylistFormOpen(true);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="icobtn"
                      aria-label="Hapus playlist"
                      onClick={() =>
                        confirm({
                          title: "Hapus playlist?",
                          body: "Playlist beserta seluruh videonya akan dihapus.",
                          action: "Hapus",
                          onConfirm: () => {
                            remove("playlists", active.id);
                            setSelectedId(null);
                            toast("Playlist dihapus");
                          },
                        })
                      }
                    >
                      🗑
                    </button>
                  </div>
                </div>
                <div style={{ padding: "13px 16px" }}>
                  <form
                    className="quickadd"
                    style={{ margin: 0 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      addVideo();
                    }}
                  >
                    <input
                      type="text"
                      value={url}
                      placeholder="Tempel tautan YouTube (youtube.com/watch?v=… atau youtu.be/…)"
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setUrlError(false);
                      }}
                    />
                    <button type="submit" className="btn btn-primary">Tambah</button>
                  </form>
                  {urlError ? (
                    <div className="err">
                      Tautan YouTube tidak dikenali. Pastikan berisi ID video 11 karakter.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="panel">
                {items.length ? (
                  <ul className="list">
                    {items.map((m) => (
                      <li key={m.id}>
                        <div className="body">
                          <div className="ttl">
                            {playing?.id === m.id ? (
                              <span className="now-playing" aria-label="Sedang diputar">▶ </span>
                            ) : null}
                            {m.title}
                          </div>
                          <div className="meta">
                            <span className="tag">{m.videoId}</span>
                          </div>
                        </div>
                        <div className="acts">
                          <button type="button" className="icobtn" aria-label="Putar" onClick={() => play(m)}>
                            ▶
                          </button>
                          <a
                            className="icobtn"
                            href={`https://www.youtube.com/watch?v=${m.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Buka di YouTube"
                          >
                            ↗
                          </a>
                          <button
                            type="button"
                            className="icobtn"
                            aria-label="Hapus video"
                            onClick={() =>
                              confirm({
                                title: "Hapus video?",
                                body: "Video ini dikeluarkan dari playlist.",
                                action: "Hapus",
                                onConfirm: () => {
                                  remove("music", m.id);
                                  toast("Video dihapus");
                                },
                              })
                            }
                          >
                            🗑
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty title="Playlist ini masih kosong" hint="Tempel satu tautan YouTube di kolom atas." />
                )}
              </div>
            </>
          ) : (
            <div className="panel">
              <Empty
                title="Pilih atau buat playlist dulu"
                hint="Video disimpan sebagai ID YouTube, bukan berkas audio."
              />
            </div>
          )}
        </div>
      </div>

      {playlistFormOpen ? (
        <PlaylistForm
          playlist={editingPlaylist}
          onClose={() => setPlaylistFormOpen(false)}
          onSaved={(id) => setSelectedId(id)}
        />
      ) : null}
    </>
  );
}

function PlaylistForm({
  playlist, onClose, onSaved,
}: { playlist: Playlist | null; onClose: () => void; onSaved: (id: string) => void }) {
  const { upsert, toast } = useStore();
  const [name, setName] = useState(playlist ? playlist.name : "");
  const [showError, setShowError] = useState(false);
  const invalid = !name.trim();

  return (
    <Modal
      title={playlist ? "Ubah nama playlist" : "Playlist baru"}
      submitLabel={playlist ? "Simpan" : "Buat playlist"}
      onClose={onClose}
      onSubmit={() => {
        if (invalid) {
          setShowError(true);
          return;
        }
        const id = playlist ? playlist.id : uid("p");
        upsert("playlists", {
          id,
          name: name.trim(),
          createdAt: playlist ? playlist.createdAt : new Date().toISOString(),
        });
        onSaved(id);
        toast(playlist ? "Nama playlist disimpan" : "Playlist dibuat");
        onClose();
      }}
    >
      <div className={showError && invalid ? "field invalid" : "field"}>
        <label className="f" htmlFor="pName">Nama</label>
        <input
          id="pName"
          type="text"
          value={name}
          placeholder="Fokus dalam"
          onChange={(e) => setName(e.target.value)}
        />
        {showError && invalid ? <div className="err">Nama wajib diisi.</div> : null}
      </div>
    </Modal>
  );
}