export default function Avatar({ label }: { label: string }) {
  const initial = (label.trim()[0] || "?").toUpperCase();
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-magenta to-violet font-display text-sm font-semibold text-ink">
      {initial}
    </div>
  );
}
