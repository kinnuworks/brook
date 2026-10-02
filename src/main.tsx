import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Shell } from "@/components/Shell";
import { HomePage } from "@/features/home/HomePage";
import { loadLang } from "@/i18n";
import { useSettings } from "@/lib/settings";
import "./styles.css";

const CheckPage = lazy(() => import("@/features/check/CheckPage"));
const StoryPage = lazy(() => import("@/features/story/StoryPage"));
const HubPage = lazy(() => import("@/features/hub/HubPage"));
const AboutPage = lazy(() => import("@/features/about/AboutPage"));

const page = (el: React.ReactNode) => <Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-ink-soft">…</div>}>{el}</Suspense>;

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/check", element: page(<CheckPage />) },
      { path: "/story/:id", element: page(<StoryPage />) },
      { path: "/hub", element: page(<HubPage />) },
      { path: "/about", element: page(<AboutPage />) },
    ],
  },
]);

// Checks saved while offline are sent the moment the connection returns, wherever you are in the app.
const flush = () => void import("@/features/check/submit").then((m) => m.flushPending());
window.addEventListener("online", flush);
window.setTimeout(flush, 2500);

const lang = useSettings.getState().lang;
document.documentElement.lang = lang;
void loadLang(lang).then(() => useSettings.setState((s) => ({ langLoaded: s.langLoaded + 1 })));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
