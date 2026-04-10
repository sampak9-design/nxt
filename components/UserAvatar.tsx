"use client";

interface Props {
  avatarUrl: string | null;
  isVip?: boolean;
  kycStatus?: string;
  size?: number;
}

export default function UserAvatar({ avatarUrl, isVip, kycStatus, size = 34 }: Props) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full overflow-hidden w-full h-full flex items-center justify-center"
        style={{ background: avatarUrl ? "transparent" : "#c4c4c4" }}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          : <svg viewBox="0 0 24 24" fill="#9a9a9a" style={{ width: "70%", height: "70%", marginTop: size * 0.1 }}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
            </svg>
        }
      </div>
      {/* VIP badge — left side overlapping */}
      {isVip && (
        <div
          className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded px-1"
          style={{ left: -8, background: "#facc15", fontSize: 7, fontWeight: 800, color: "#000", lineHeight: "12px", letterSpacing: "0.03em", whiteSpace: "nowrap" }}
        >
          VIP
        </div>
      )}
      {/* KYC verification badge — top-right */}
      <div
        className="absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center"
        style={{
          width: size * 0.35,
          height: size * 0.35,
          background: kycStatus === "approved" ? "#22c55e" : "#f97316",
          border: "2px solid var(--color-third, #161c2c)",
        }}
      >
        {kycStatus === "approved" ? (
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : (
          <span style={{ fontSize: Math.max(7, size * 0.22), fontWeight: 800, color: "#fff", lineHeight: 1 }}>!</span>
        )}
      </div>
    </div>
  );
}
