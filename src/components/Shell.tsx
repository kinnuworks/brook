import { NavLink, Outlet, useLocation } from "react-router";
import { useStrings } from "@/i18n";
import { LangPicker } from "./LangPicker";
import { Logo } from "./Logo";

export function Shell() {
  const s = useStrings();
  const { pathname } = useLocation();
  const inCheck = pathname.startsWith("/check");
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3.5 py-2 text-[15px] font-semibold transition ${isActive ? "bg-aqua-100 text-deep-900" : "text-ink-soft hover:text-deep"}`;
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      {!inCheck && (
        <header className="sticky top-0 z-30 border-b border-line/70 bg-mist/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
            <NavLink to="/" aria-label="Brook home">
              <Logo />
            </NavLink>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              <NavLink to="/" end className={link}>
                {s.ui.home}
              </NavLink>
              <NavLink to="/hub" className={link}>
                {s.ui.hub}
              </NavLink>
              <NavLink to="/about" className={link}>
                {s.ui.about}
              </NavLink>
            </nav>
            <div className="flex items-center gap-2">
              <LangPicker />
              <NavLink to="/check" className="btn-primary hidden !min-h-11 !px-5 !text-[15px] sm:inline-flex">
                {s.ui.start}
              </NavLink>
            </div>
          </div>
          <nav className="flex items-center justify-center gap-1 border-t border-line/60 px-2 py-1.5 md:hidden" aria-label="Main">
            <NavLink to="/" end className={link}>
              {s.ui.home}
            </NavLink>
            <NavLink to="/hub" className={link}>
              {s.ui.hub}
            </NavLink>
            <NavLink to="/about" className={link}>
              {s.ui.about}
            </NavLink>
          </nav>
        </header>
      )}
      <main id="main">
        <Outlet />
      </main>
    </div>
  );
}
