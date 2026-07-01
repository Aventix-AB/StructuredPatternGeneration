import { cn } from "@/lib/utils";

interface PatternThumbnailProps {
  src?: string;
  alt?: string;
  className?: string;
}

/**
 * Small thumbnail shown next to a pattern label in the selector.
 * Drop a `thumbnail.png` into the pattern's own folder, import it in the
 * pattern's `index.ts`, and assign it to `PatternDefinition.thumbnail`.
 * Until an image is available a neutral placeholder is rendered.
 */
export function PatternThumbnail({
  src,
  alt = "",
  className,
}: PatternThumbnailProps) {
  const base = cn(
    "h-8 w-12 flex-none rounded overflow-hidden border border-border",
    className,
  );

  if (src) {
    return <img src={src} alt={alt} className={cn(base, "object-cover")} />;
  }

  return (
    <div className={cn(base, "bg-muted flex items-center justify-center")}>
      <svg
        className="h-4 w-4 text-muted-foreground/40"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden
      >
        <rect x="0" y="0" width="4" height="4" />
        <rect x="8" y="0" width="4" height="4" />
        <rect x="4" y="4" width="4" height="4" />
        <rect x="12" y="4" width="4" height="4" />
        <rect x="0" y="8" width="4" height="4" />
        <rect x="8" y="8" width="4" height="4" />
        <rect x="4" y="12" width="4" height="4" />
        <rect x="12" y="12" width="4" height="4" />
      </svg>
    </div>
  );
}
