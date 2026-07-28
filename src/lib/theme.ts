/**
 * Single source of truth for the "PRISM AI" design tokens and brand strings.
 * `tailwind.config.ts`, chart components, and anything rendering the app name,
 * logo, or a money amount should import from here rather than repeating a
 * literal — that way a rebrand or a currency change is a one-file edit.
 *
 * Note: `src/app/globals.css` can't import a TS module. Its `:root` custom
 * properties mirror PALETTE below by hand — keep them in sync if you change a
 * color here.
 */

export const PALETTE = {
  canvas: "#08080b", // page background
  panel: "#101014", // card background
  panel2: "#15151b", // nested surface (inputs, day-header strips)
  hairline: "rgba(255,255,255,0.08)", // borders
  ink: "#f2f2f5", // primary text (on dark)
  muted: "#8b8b96", // secondary text
  cyan: "#22d3ee",
  violet: "#a855f7",
  magenta: "#ec4899",
  lime: "#d7ff3d",
} as const;

/** Extra tints used only for multi-series charts, beyond the four core accents. */
const CHART_EXTRA_COLORS = ["#38bdf8", "#f472b6", "#c084fc", "#a3e635"] as const;

/** Full ordered palette for charts with more series than core accent colors (e.g. category pie). */
export const CHART_PALETTE = [
  PALETTE.cyan,
  PALETTE.violet,
  PALETTE.magenta,
  PALETTE.lime,
  ...CHART_EXTRA_COLORS,
  PALETTE.muted, // fallback / "Other"
] as const;

/** Shared Recharts <Tooltip contentStyle> for both charts. */
export const CHART_TOOLTIP_STYLE = {
  background: PALETTE.panel2,
  border: `1px solid ${PALETTE.hairline}`,
  borderRadius: 10,
  color: PALETTE.ink,
  fontSize: 12,
} as const;

// ---------- Brand ----------
export const APP_NAME = "PRISM AI Expense Tracker";
export const APP_SHORT_NAME = "PRISM AI";
export const COMPANY_NAME = "PRISM AI Technologies";
export const LOGO_PATH = "/logo.jpeg";
/** The two pieces of the wordmark, rendered in different colors (lime accent + ink). */
export const WORDMARK_ACCENT = "PRISM";
export const WORDMARK_SUFFIX = ". Expense Tracker";

// ---------- Currency ----------
export const CURRENCY_SYMBOL = "₹";
export const CURRENCY_LOCALE = "en-IN";

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString(CURRENCY_LOCALE)}`;
}
