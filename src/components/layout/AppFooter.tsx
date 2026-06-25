import aventixLogo from "@/assets/Aventix_FullColor Primary.jpg";

const CURRENT_YEAR = new Date().getFullYear();

export function AppFooter() {
  return (
    <footer className="flex-none border-t bg-muted/40 text-sm text-muted-foreground">
      {/* Main footer grid */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 sm:grid-cols-2">
        {/* Left – brand */}
        <div className="flex flex-col gap-4">
          <img
            src={aventixLogo}
            alt="Aventix logo"
            className="h-8 w-auto object-contain self-start"
          />
          <p className="max-w-xs leading-relaxed">
            Democratising sensor technologies to power AI, bioanalytics, and the
            future of scientific research.
          </p>
          <p className="text-xs">Aventix AB · VAT:&nbsp;SE559513265401</p>
        </div>

        {/* Right – contact */}
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Contact
          </h2>
          <ul className="space-y-1.5 text-sm">
            <li>
              <a
                href="mailto:hello@aventix.io"
                className="hover:text-foreground transition-colors"
              >
                hello@aventix.io
              </a>
            </li>
            <li>
              <a
                href="tel:+16175537534"
                className="hover:text-foreground transition-colors"
              >
                +1 617 553 7534
              </a>
            </li>
            <li>Aventix AB</li>
            <li>Gemenskapens Gata 9</li>
            <li>431 53 Mölndal, Sweden</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t px-6 py-3">
        <div className="mx-auto flex max-w-7xl flex-col gap-0.5 text-center text-xs sm:flex-row sm:justify-between sm:text-left">
          <span>© {CURRENT_YEAR} Aventix AB. All rights reserved.</span>
          <span className="italic">
            Precision for every lab. Progress for mankind.
          </span>
        </div>
      </div>
    </footer>
  );
}
