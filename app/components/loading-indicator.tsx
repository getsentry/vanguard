import { useNavigation } from "react-router";

/**
 * Top-of-page loading indicator. An indeterminate sliding bar shown whenever
 * a navigation or form submission is in flight.
 *
 * Implementation notes:
 * - Uses RR7's `useNavigation()` (the canonical pending-state hook) rather than
 *   `useLocation`, so it correctly reflects loader fetches AND form actions.
 * - No refs, no setTimeout — pure declarative render driven by `state`. The
 *   slide is a CSS `@keyframes` animation defined in `app/styles/index.css`.
 * - Returns `null` when idle so there's zero DOM/paint cost on a quiet page.
 */
export default function LoadingIndicator() {
  const { state } = useNavigation();
  if (state === "idle") return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-0 h-1 z-[2147483647] overflow-hidden"
    >
      <div className="loading-bar h-full bg-loading-light dark:bg-loading-dark" />
    </div>
  );
}
