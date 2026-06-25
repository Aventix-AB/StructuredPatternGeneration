import aventixLogo from "@/assets/Aventix_FullColor Primary.jpg";

export function AppHeader() {
  return (
    <header className="flex h-14 flex-none items-center gap-3 border-b bg-background px-5">
      <a
        href="https://aventix.io"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <img
          src={aventixLogo}
          alt="Aventix logo"
          className="h-7 w-auto object-contain"
        />
        <span className="font-heading text-base font-semibold tracking-tight">
          Patterns
          <span className="ml-1 font-normal text-muted-foreground">
            · Aventix
          </span>
        </span>
      </a>
    </header>
  );
}
