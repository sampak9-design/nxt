"use client";

import { useCallback, useEffect, useState } from "react";
import { X, RefreshCw } from "lucide-react";

interface Room {
  id: string;
  name: string;
  description: string;
  trader_name: string;
  price: number;
  max_pct: number;
  followers: number;
  total_trades: number;
  wins: number;
  follow_status: string | null;
}

interface Props {
  onClose: () => void;
}

/* ── mini performance chart ── */
function MiniChart() {
  const points = "0,28 12,24 24,26 36,18 48,20 60,12 72,14 84,6 96,8 108,2";
  return (
    <svg width={110} height={30} viewBox="0 0 110 30" className="flex-shrink-0">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,30 ${points} 108,30`}
        fill="url(#chartGrad)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#4ade80"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── avatar with gradient ── */
const GRADIENTS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
];

function Avatar({ name, index }: { name: string; index: number }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white"
      style={{
        width: 40,
        height: 40,
        fontSize: 16,
        background: GRADIENTS[index % GRADIENTS.length],
      }}
    >
      {letter}
    </div>
  );
}

export default function CopyTradingPanel({ onClose }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/copy-trading");
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleAction = async (room: Room) => {
    if (acting) return;
    const isFollowing = room.follow_status === "active";
    setActing(room.id);
    try {
      const action = isFollowing ? "unfollow" : "follow";
      const res = await fetch("/api/copy-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, roomId: room.id }),
      });
      if (res.ok) {
        setRooms((prev) =>
          prev.map((r) =>
            r.id === room.id
              ? {
                  ...r,
                  follow_status: action === "follow" ? "pending" : null,
                  followers:
                    r.followers + (action === "unfollow" ? -1 : 0),
                }
              : r
          )
        );
      }
    } catch {
      // silent
    } finally {
      setActing(null);
    }
  };

  const loses = (r: Room) => Math.max(0, r.total_trades - r.wins);

  return (
    <div
      className="flex flex-col h-full border-r flex-shrink-0 overflow-hidden"
      style={{
        width: "100%",
        maxWidth: 360,
        background: "var(--color-third, #111622)",
        borderColor: "var(--color-border, rgba(255,255,255,0.08))",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border, rgba(255,255,255,0.08))" }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">Copy Trading</div>
          <div className="text-[11px] text-gray-500">
            Siga traders e copie operações
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={fetchRooms}
            className="text-gray-500 hover:text-white transition-colors p-1"
            disabled={loading}
          >
            <RefreshCw
              className="w-4 h-4"
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {loading && rooms.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-gray-600 text-xs">Carregando salas...</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-gray-600 text-xs">
              Nenhuma sala disponível
            </span>
          </div>
        ) : (
          rooms.map((room, idx) => (
            <div
              key={room.id}
              className="rounded-xl overflow-hidden transition-colors"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor =
                  "rgba(255,255,255,0.12)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor =
                  "rgba(255,255,255,0.06)")
              }
            >
              {/* Card header */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <Avatar name={room.trader_name} index={idx} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {room.name}
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(249,115,22,0.15)",
                        color: "#f97316",
                      }}
                    >
                      Top
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {room.followers} seguidores
                  </div>
                </div>
                {/* Price badge */}
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={
                    room.price === 0
                      ? {
                          background: "rgba(74,222,128,0.12)",
                          color: "#4ade80",
                        }
                      : {
                          background: "rgba(249,115,22,0.12)",
                          color: "#f97316",
                        }
                  }
                >
                  {room.price === 0
                    ? "Grátis"
                    : `R$ ${room.price.toFixed(2)}`}
                </span>
              </div>

              {/* Mini chart */}
              <div className="px-4 py-1">
                <MiniChart />
              </div>

              {/* Stats text */}
              <div className="px-4 pb-2">
                <div className="text-[11px] text-gray-400">
                  <span style={{ color: "#4ade80" }}>{room.wins}</span>{" "}
                  operações lucrativas
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  Histórico baseado nas operações do trader
                </div>
              </div>

              {/* Stats row */}
              <div
                className="grid grid-cols-3 border-t"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div className="flex flex-col items-center py-2.5">
                  <span className="text-[10px] text-gray-500">
                    Negociações
                  </span>
                  <span className="text-xs font-bold text-white">
                    {room.total_trades}
                  </span>
                </div>
                <div
                  className="flex flex-col items-center py-2.5 border-x"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <span className="text-[10px] text-gray-500">Lucrativas</span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#4ade80" }}
                  >
                    {room.wins}
                  </span>
                </div>
                <div className="flex flex-col items-center py-2.5">
                  <span className="text-[10px] text-gray-500">Negativas</span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#f87171" }}
                  >
                    {loses(room)}
                  </span>
                </div>
              </div>

              {/* Action button */}
              <div className="px-4 pb-4 pt-2">
                {room.follow_status === "active" ? (
                  <button
                    onClick={() => handleAction(room)}
                    disabled={acting === room.id}
                    className="w-full py-2 rounded-lg text-xs font-bold transition-colors"
                    style={{ background: "rgba(255,255,255,0.08)", color: "#9ca3af" }}
                  >
                    {acting === room.id ? "..." : "Seguindo"}
                  </button>
                ) : room.follow_status === "pending" ? (
                  <button disabled
                    className="w-full py-2 rounded-lg text-xs font-bold"
                    style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c" }}
                  >
                    Aguardando aprovação
                  </button>
                ) : room.price > 0 ? (
                  <button
                    onClick={() => handleAction(room)}
                    disabled={acting === room.id}
                    className="w-full py-2 rounded-lg text-xs font-bold transition-colors"
                    style={{ background: "#16a34a", color: "#fff" }}
                  >
                    {acting === room.id ? "..." : `Assinar R$ ${room.price.toFixed(2)}`}
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(room)}
                    disabled={acting === room.id}
                    className="w-full py-2 rounded-lg text-xs font-bold transition-colors"
                    style={{ background: "#16a34a", color: "#fff" }}
                  >
                    {acting === room.id ? "..." : "Seguir"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
