type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <a
      href="/"
      className={className}
      aria-label="baicai.dev 首頁"
      style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
    >
      <img
        src="/brand/logo/logo-mark-primary.svg"
        width={32}
        height={32}
        alt=""
        aria-hidden="true"
      />
      {!compact && (
        <span style={{ fontWeight: 650, letterSpacing: "-0.03em" }}>
          baicai<span style={{ color: "var(--bc-primary)" }}>.dev</span>
        </span>
      )}
    </a>
  );
}
