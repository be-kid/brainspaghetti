export function SpinnerInline({ size = 16 }: { size?: number }) {
  const px = `${size}px`;
  return (
    <span
      className="spinner-border spinner-border-sm"
      style={{ width: px, height: px, borderWidth: size / 8 }}
      role="status"
      aria-hidden="true"
    />
  );
}

export function PageSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      <div className="placeholder-glow" style={{ marginBottom: 16 }}>
        <span className="placeholder col-6" />
      </div>
      <div className="placeholder-glow">
        <span className="placeholder col-12" />
        <span className="placeholder col-10" />
        <span className="placeholder col-8" />
      </div>
    </div>
  );
}
