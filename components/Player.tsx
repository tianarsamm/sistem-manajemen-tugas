"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

type PlayerState = "idle" | "playing" | "paused";

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId: string) => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubeApi = {
  Player: new (element: HTMLElement, options: {
    height: string;
    width: string;
    videoId: string;
    playerVars: { autoplay: number; controls: number; playsinline: number; rel: number };
    events: {
      onReady: () => void;
      onStateChange: (event: { data: number }) => void;
    };
  }) => YouTubePlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; CUED: number };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function Player() {
  const { data, playing, queuePosition, step, stopPlayer, upsert } = useStore();
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const currentVideoId = useRef<string | null>(null);
  const nextRef = useRef(step);
  const repeatRef = useRef(false);
  const [status, setStatus] = useState<PlayerState>("idle");
  const [repeat, setRepeat] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    nextRef.current = step;
    repeatRef.current = repeat;
  }, [repeat, step]);

  useEffect(() => {
    if (!playing || !hostRef.current) {
      playerRef.current?.pauseVideo();
      setStatus("idle");
      return;
    }

    let cancelled = false;
    loadYouTubeApi().then((youtube) => {
      if (cancelled || !hostRef.current) return;

      if (!playerRef.current) {
        playerRef.current = new youtube.Player(hostRef.current, {
          height: "1",
          width: "1",
          videoId: playing.videoId,
          playerVars: { autoplay: 1, controls: 0, playsinline: 1, rel: 0 },
          events: {
            onReady: () => {
              playerRef.current?.playVideo();
              setStatus("playing");
            },
            onStateChange: (event) => {
              if (event.data === youtube.PlayerState.PLAYING) setStatus("playing");
              if (event.data === youtube.PlayerState.PAUSED) setStatus("paused");
              if (event.data === youtube.PlayerState.ENDED) {
                if (repeatRef.current) {
                  playerRef.current?.seekTo(0, true);
                  playerRef.current?.playVideo();
                } else {
                  nextRef.current(1);
                }
              }
            },
          },
        });
        currentVideoId.current = playing.videoId;
      } else if (currentVideoId.current !== playing.videoId) {
        playerRef.current.loadVideoById(playing.videoId);
        currentVideoId.current = playing.videoId;
      } else {
        playerRef.current.playVideo();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [playing]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (
        !player
        || typeof player.getCurrentTime !== "function"
        || typeof player.getDuration !== "function"
      ) return;
      setCurrentTime(player.getCurrentTime());
      setDuration(player.getDuration());
    }, 500);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (!playing || !/^Video\s/.test(playing.title)) return;
    const controller = new AbortController();
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${playing.videoId}&format=json`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() as Promise<{ title?: string }> : null))
      .then((metadata) => {
        if (metadata?.title) upsert("music", { ...playing, title: metadata.title });
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [playing, upsert]);

  if (!playing) return null;

  const playlist = data.playlists.find((p) => p.id === playing.playlistId);
  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="player">
      <div className="frame">
        <div ref={hostRef} />
      </div>
      <div className="np">
        <b>{playing.title || `Video ${playing.videoId}`}</b>
        <span>
          {playlist ? `${playlist.name} · ` : ""}
          {queuePosition.index} dari {queuePosition.total}
        </span>
      </div>
      <div className="player-center">
        <div className="ctrl">
          <button type="button" className="icobtn" aria-label="Lagu sebelumnya" onClick={() => step(-1)}>
            ‹‹
          </button>
          <button
            type="button"
            className="icobtn player-play"
            aria-label={status === "playing" ? "Jeda" : "Putar"}
            onClick={() => {
              if (status === "playing") {
                playerRef.current?.pauseVideo();
                setStatus("paused");
              } else {
                playerRef.current?.playVideo();
                setStatus("playing");
              }
            }}
          >
            {status === "playing" ? "❚❚" : "▶"}
          </button>
          <button type="button" className="icobtn" aria-label="Lagu berikutnya" onClick={() => step(1)}>
            ››
          </button>
          <button
            type="button"
            className={repeat ? "icobtn player-repeat active" : "icobtn player-repeat"}
            aria-label="Ulangi lagu"
            aria-pressed={repeat}
            onClick={() => setRepeat((value) => !value)}
          >
            ↻
          </button>
        </div>
        <div className="progress-row">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            aria-label="Posisi lagu"
            onChange={(event) => {
              const nextProgress = Number(event.target.value);
              setCurrentTime((duration * nextProgress) / 100);
              playerRef.current?.seekTo((duration * nextProgress) / 100, true);
            }}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <div className="ctrl player-extra">
        <a
          className="icobtn"
          href={`https://www.youtube.com/watch?v=${playing.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Buka di YouTube"
        >
          ↗
        </a>
        <button type="button" className="icobtn" aria-label="Tutup pemutar" onClick={stopPlayer}>
          ✕
        </button>
      </div>
    </div>
  );
}