import aventixLogo from "@/assets/Aventix_FullColor Primary.jpg";

const CURRENT_YEAR = new Date().getFullYear();

export function AppFooter() {
  return (
    <footer className="flex-none border-t bg-muted/40 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-2.5">
        {/* Left – brand */}
        <div className="flex items-center gap-3">
          <img
            src={aventixLogo}
            alt="Aventix logo"
            className="h-5 w-auto object-contain"
          />
          <span className="hidden sm:inline text-xs">
            Aventix AB · VAT:&nbsp;SE559513265401
          </span>
        </div>

        {/* Centre – contact */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="mailto:hello@aventix.io"
            className="hover:text-foreground transition-colors"
          >
            hello@aventix.io
          </a>
          <span aria-hidden>·</span>
          <a
            href="tel:+16175537534"
            className="hover:text-foreground transition-colors"
          >
            +1 617 553 7534
          </a>
          <span aria-hidden>·</span>
          <span>Gemenskapens Gata 9, 431 53 Mölndal, Sweden</span>
        </div>

        {/* Right – copyright */}
        <span className="shrink-0">© {CURRENT_YEAR} Aventix AB</span>
      </div>
    </footer>
  );
}
