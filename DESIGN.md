# Design

## Color Strategy

Full palette: five named brand colors used deliberately across the interface, plus semantic status colors. Dark-first.

## Theme

Dark. Physical scene: security analyst on a 27-inch monitor in a dim SOC room, glancing at threat status between investigations. The dark background reduces eye strain during long shifts and makes status colors pop.

## Palette

### Brand Colors

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background | Midnight Violet | `#0d0628` | Main surface, app background |
| Surface | Grape Soda | `#9a348e` | Card backgrounds (at 15% opacity), borders (at 30% opacity), hover states |
| Accent | Blush Rose | `#da627d` | Primary actions, active indicators, links, focus rings |
| Highlight | Tangerine Dream | `#fca17d` | Secondary text, labels, confidence indicators |
| Text | Soft Apricot | `#f9dbbd` | Primary body text, headings (highest contrast on dark) |

### Status Colors (Semantic)

| Status | Hex | Usage |
|--------|-----|-------|
| Safe | `#22c55e` | Safe email classification |
| Phishing | `#ef4444` | Phishing email classification |
| Violation | `#f59e0b` | Security violation (prompt injection detected) |
| Pending | `#6b7280` | Emails awaiting processing |
| Info | `#9a348e` | Informational badges, neutral indicators |

### Neutral Scale

Derived from Midnight Violet with slight warm tint (chroma 0.005):
- `#0d0628` (background)
- `#150c35` (elevated surface)
- `#1e1342` (hover surface)
- `#2a1d54` (active surface)

## Typography

### Family

System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`

One family throughout. System fonts give native feel on every platform. Inter is the fallback for cross-platform consistency.

### Scale (fixed, not fluid)

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Display | 24px | 600 | 1.2 |
| Heading | 20px | 600 | 1.3 |
| Subheading | 16px | 500 | 1.4 |
| Body | 14px | 400 | 1.5 |
| Caption | 12px | 400 | 1.4 |
| Data | 13px | 500 | 1.3 |

### Line Length

Body prose: 65-75ch. Data tables: up to 120ch. Dashboard labels: unrestricted.

## Spacing Scale

Base unit: 4px

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |

## Elevation

No shadows on dark backgrounds (they're invisible). Differentiate layers through:
- Background color shift (Midnight Violet → slightly lighter tint)
- Subtle border (Grape Soda at 30% opacity)
- Backdrop blur for overlays (sparingly)

## Border Radius

| Role | Radius |
|------|--------|
| Button | 6px |
| Card | 8px |
| Badge | 12px (pill) |
| Input | 6px |

## Components

### Metrics Cards

Four stat displays in a row. Each: large number (Display scale, status color), label (Caption, Tangerine Dream), subtle icon. No card borders; differentiate via background tint shift.

### Email Table

Standard data table. Alternating row backgrounds (very subtle: Midnight Violet → slightly lighter). Status badge in first column (pill shape, status color background at 20% opacity, status color text). Sortable column headers with direction indicator.

### Classification Chart

Recharts pie chart. Status colors for slices. Clean, minimal: no gridlines, no axis, just the data. Legend below with counts.

### Status Badges

Pill shape. Background: status color at 15% opacity. Text: status color. Icon prefix (checkmark, warning, shield). Consistent sizing: 24px height, 8px horizontal padding, 12px border-radius.

### Error Banner

Full-width bar below header. Background: `rgba(239, 68, 68, 0.08)`. Text: soft red. Left border: 2px solid red (NOT the banned side-stripe; this is a 2px functional indicator on a full-width alert, not a decorative accent on a card).

## Motion

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Hover state | 150ms | ease-out |
| Expand/collapse | 200ms | ease-out-quart |
| Chart animation | 400ms | ease-out-quart |
| Skeleton shimmer | 1.5s | linear (infinite) |

Respect `prefers-reduced-motion: reduce` by disabling all non-essential animation.

## Layout

Desktop (≥1024px): 2-column grid. Left sidebar (320px) for chart. Right main area for metrics + table.

Tablet (768-1023px): Single column. Chart above table.

Mobile (<768px): Stacked. Metrics 2x2 grid. Chart collapsed by default (toggle to show).

## Responsive Breakpoints

```css
/* Mobile first */
.metrics-bar { display: grid; grid-template-columns: 1fr 1fr; }
.chart-panel { display: none; }

@media (min-width: 768px) {
  .metrics-bar { grid-template-columns: repeat(4, 1fr); }
  .chart-panel { display: block; }
}

@media (min-width: 1024px) {
  .app-layout { display: grid; grid-template-columns: 320px 1fr; }
}
```
