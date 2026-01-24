export default function Skeleton({ h = 14 }: { h?: number }) {
  return (
    <div
      className="w-full rounded-xl bg-white/10 animate-pulse"
      style={{ height: h }}
    />
  );
}
