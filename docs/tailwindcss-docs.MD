***

# Tec-Shop — Tailwind Design System (Comprehensive & Documented)

**File:** `tailwind.config.js`
**Purpose:** Centralized design tokens and Tailwind configuration for the Tec-Shop multi-vendor e-commerce microservices project (Nx + Next.js).

***

## Features

- Clear **design system hierarchy**:
  - `brand` — identity colors (primary, secondary, accent) for CTAs, hero sections, promotions, and key interactive elements
  - `ui` — neutral surfaces, borders, dividers, elevation backgrounds
  - `text` — semantic text colors
  - `feedback` — system state colors for success, warning, error, info
  - `elevation` — shadows to indicate stacking context (card depths)

- **Color palette** with semantic names and recommended shades for light and dark modes
- **Dark mode support** using the class strategy (`darkMode: 'class'`)
- **CSS custom properties** generated for both root and `[data-theme="dark"]` for availability in vanilla CSS and other frameworks
- **Accessible usage guidance**, component examples, and recommended Tailwind plugins
- Exported `designTokens` object for reuse outside Tailwind (Storybook, Figma tokens, backend theming)

***

## How to Use

1. **Install Tailwind and recommended plugins**:
   ```bash
   npm install -D tailwindcss @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio
   ```
2. **Add this configuration** file (`tailwind.config.js`) at the root of your Next.js app or workspace root. Adjust the `content` paths if your project has a different monorepo layout.
3. **Optional:** Use the exported `designTokens` object for generating tokens in other platforms like Figma, Storybook palette, or JSON variables.
4. **Dark mode:**
   - This config uses `darkMode: 'class'`.
   - Toggle dark mode by adding the `dark` class to an ancestor (e.g., `<html>` or `<body>`) or by setting `[data-theme="dark"]` attribute on the root element for theme-aware CSS.

***

## Design Principles & Naming Rationale

| Category   | Description                                                  | Usage Examples                                  |
|------------|--------------------------------------------------------------|------------------------------------------------|
| `brand.*`  | Identity colors used for primary CTAs, hero, promotions       | `bg-brand-primary`, `text-brand-primary`       |
| `ui.*`     | Neutral surfaces, borders, dividers, elevation backgrounds    | `bg-ui-surface`, `border-ui-divider`           |
| `text.*`   | Semantic text colors                                          | `text-text-primary`, `text-text-secondary`     |
| `feedback.*`| System state colors for success, warning, error, and info    | `bg-feedback-error`, `text-feedback-success`   |
| `elevation.*`| Shadows to indicate stacking context and depth in UI       | `shadow-elev-low`, `shadow-elev-high`           |

***

## Semantic Classes Developers Use

- Backgrounds, text, and hover for brand colors:
  `bg-brand-primary`, `text-brand-primary`, `hover:bg-brand-primary-600`
- UI elements and borders:
  `bg-ui-surface`, `border-ui-divider`, `text-text-primary`
- Feedback states:
  `bg-feedback-error`, `text-feedback-success`

***

## Component Examples

### 1) Primary Call-to-Action Button

```html
<button class="inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold bg-brand-primary hover:bg-brand-primary-600 focus:outline-none focus:ring-3 focus:ring-brand-primary/25 text-white">
  Buy Now
</button>
```

### 2) Secondary Call-to-Action Button

```html
<button class="px-4 py-2 rounded-md font-medium bg-brand-secondary text-white hover:bg-brand-secondary-600">
  Add to Cart
</button>
```

### 3) Product Card (Light Theme)

```html
<div class="bg-ui-surface p-4 rounded-lg shadow-elev-low">
  <img src="/products/1.jpg" alt="Awesome Chair" class="w-full h-56 object-cover rounded-md" />
  <h3 class="mt-3 text-text-primary font-semibold">Awesome Chair</h3>
  <p class="text-text-secondary text-sm">Vendor — Category</p>
  <div class="mt-4 flex items-center justify-between">
    <span class="text-lg font-bold">$129</span>
    <button class="px-3 py-1 rounded-md bg-brand-primary text-white">Buy</button>
  </div>
</div>
```

### 4) Alert / Feedback Messages

```html
<div class="p-3 rounded-md bg-feedback-error/10 text-feedback-error" role="alert">Payment failed</div>
<div class="p-3 rounded-md bg-feedback-success/10 text-feedback-success" role="alert">Order placed</div>
```

***

## Accessibility Notes

- Ensure a minimum **contrast ratio of 4.5:1** for important CTA texts. Prefer darker brand shades for text on light backgrounds and light text on darker brand backgrounds.
- Use appropriate `aria-` attributes for interactive elements, such as `aria-pressed`, `aria-label`, and use `role="alert"` for urgent feedback messages to improve screen reader support.

***

## Theming & Dark Mode

- Enable dark mode by toggling the `dark` class on the root element or setting `data-theme="dark"`.
- This triggers CSS variables and token mappings for automatic color adjustments.
- Example JavaScript toggle:
  ```js
  document.documentElement.classList.toggle('dark');
  // or
  document.documentElement.setAttribute('data-theme', 'dark');
  ```

***

## Storybook / Design Tokens Integration

- Exported `designTokens` can be imported into Storybook or Figma token systems to keep design and implementation consistent.
- This supports generating JSON token files for use in design tools and frontend libraries.

***

## Recommended Next Steps

1. **Create a reusable component library** using these tokens — Button, Card, Badge, Alert components aligned with the design system.
2. **Add Storybook** and import `designTokens` to provide a live component preview with consistent theming.
3. **Develop a style guide page** in the admin dashboard documenting usage rules for brand colors, spacing, typography scale, and component guidelines.

***

This documentation provides a **centralized, semantic, accessible, and theme-able design system** built with Tailwind CSS, ideal for scalable multi-vendor e-commerce projects built with Nx and Next.js.

***

