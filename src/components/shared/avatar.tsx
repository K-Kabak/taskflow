import { initials, textColorForBackground } from "@/lib/utils";

export function Avatar({ name, color = "#F97316", size = "md" }: { name: string; color?: string; size?: "sm" | "md" | "lg" }) {
  const classes = size === "sm" ? "size-7 text-[10px]" : size === "lg" ? "size-11 text-sm" : "size-9 text-xs";
  return <span title={name} className={`inline-grid shrink-0 place-items-center rounded-full border-2 border-[var(--surface)] font-semibold ${classes}`} style={{ backgroundColor: color, color: textColorForBackground(color) }}>{initials(name)}</span>;
}
