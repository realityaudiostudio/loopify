---
name: CampusShare Core
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is engineered for a premium, campus-centric rental and fintech ecosystem. It balances the energy of student life with the rigorous professionalism of a financial platform. The aesthetic is rooted in **Modern Minimalism** with a focus on high-utility density and sophisticated depth.

The interface prioritizes clarity and trust, utilizing expansive whitespace and high-contrast elements to ensure readability in fast-paced environments. By blending clean structural lines with organic, soft-edged components, the design system evokes an emotional response of security, ease of use, and contemporary relevance. Key visual differentiators include subtle glassmorphism for persistent navigation and multi-layered "ambient" depth for interactive surfaces.

## Colors

This design system utilizes a high-contrast palette designed for financial clarity and action-oriented workflows.

- **Primary (#2563EB):** Reserved for primary calls to action, active states, and brand-critical indicators. It provides a high-visibility signal for "Action."
- **Secondary (#0F172A):** Used for typography, iconography, and deep-surface backgrounds to provide a grounded, professional anchor.
- **Accent (#22C55E):** Applied to success states, positive financial trends, and "available" statuses in the marketplace.
- **System Colors:** The background uses a cool-toned gray (`#F8FAFC`) to reduce eye strain and provide a subtle contrast against the pure white (`#FFFFFF`) surface cards.
- **Transparency:** Use 80% opacity with a 16px background blur for Glassmorphism effects on navigation bars and modal overlays.

## Typography

The typography system relies exclusively on **Inter** to maintain a systematic, utilitarian aesthetic that remains highly legible at all sizes. 

- **Hierarchy:** Use tight tracking (letter spacing) for larger headlines to create a premium "editorial" feel. 
- **Scale:** On mobile devices, use the `headline-lg-mobile` variant to prevent text wrap issues while maintaining visual impact.
- **Weight:** Reserve 700 weight for major section headers and 600 for sub-headers and button labels. Body text should stick to 400 for maximum readability.
- **Fintech Focus:** For currency displays and balances, use `headline-md` with 700 weight to emphasize financial data.

## Layout & Spacing

This design system follows a strict **8px/4px linear scale**. All dimensions, padding, and margins must be multiples of 4px to ensure a cohesive vertical rhythm.

- **Grid:** A 12-column grid is used for desktop (72px columns, 16px gutters). For mobile, a fluid 2-column or 1-column layout is used with a fixed 20px side margin.
- **Marketplace Cards:** Use `16px` padding (md) for standard cards and `24px` (lg) for premium wallet or feature cards.
- **Touch Targets:** All interactive elements must maintain a minimum height of 44px to ensure mobile accessibility.

## Elevation & Depth

Visual hierarchy is established through a combination of tonal layering and multi-layered ambient shadows.

- **Flat Layer (Level 0):** Used for the main background (`#F8FAFC`).
- **Surface Layer (Level 1):** Standard cards and inputs. Use a subtle 1px border (`#E2E8F0`) with no shadow or a very soft 4px blur.
- **Elevated Layer (Level 2):** Primary interactive cards (e.g., rental items). Apply a dual-shadow:
  - Shadow 1: `0 4px 6px -1px rgba(15, 23, 42, 0.1)`
  - Shadow 2: `0 2px 4px -2px rgba(15, 23, 42, 0.05)`
- **Floating Layer (Level 3):** Modals and Navigation Bars. Use Glassmorphism (80% surface white + 16px blur) combined with a deep, diffused shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.1)`.

## Shapes

The shape language is defined by generous, approachable curves.

- **Base Radius:** 8px (0.5rem) for small components like checkboxes and tags.
- **Large Radius (Default):** 16px (1rem) for standard buttons, input fields, and marketplace cards.
- **Extra Large Radius:** 24px (1.5rem) for container-level cards, wallet cards, and bottom sheets.
- **Pill:** Fully rounded (999px) for status indicators and specialized chips.

## Components

### Buttons
- **Primary:** Solid `#2563EB` background with white text. 16px corner radius. Subtle lift shadow on hover.
- **Secondary:** Transparent background with `#0F172A` 1.5px border and text.
- **Wallet Action:** High-gloss gradient or deep navy with localized glow effects.

### Marketplace Cards
- Use 16px rounded corners.
- Padding: 16px.
- Images should be top-aligned with a 12px internal radius.
- Prices should be positioned at the bottom-right in `label-md` bold primary color.

### Input Fields
- 16px rounded corners.
- Background: `#FFFFFF`.
- Border: 1px `#E2E8F0`.
- Focus State: 2px `#2563EB` border with a soft blue outer glow.

### Bottom Navigation
- Height: 64px.
- Glassmorphic finish (Backdrop blur).
- Top border: 1px transparent white.
- Icons: 24px stroke-based icons; Active state uses Primary Blue with a small dot indicator below.

### Wallet & Subscription Cards
- **CRED-style:** Use dark mode gradients (`#0F172A` to `#1E293B`) even in light mode.
- Incorporate subtle geometric patterns or grain textures.
- Use 24px rounded corners and high-contrast white/accent-green text.