/*
Tec-Shop — Tailwind Design System (Comprehensive & Documented)
File: tailwind.config.js
Purpose: Centralized design tokens + Tailwind configuration for the Tec-Shop
multi-vendor e-commerce microservices project (Nx + Next.js).


Features included:
- Clear "design system" hierarchy: brand, ui, text, feedback, elevation.
- Color palette with semantic names and recommended shades (light/dark).
- Dark mode support (class strategy).
- CSS custom properties generation (root + [data-theme="dark"]) so tokens
are available to vanilla CSS and other frameworks.
- Accessible usage guidance, component examples, and recommended plugins.
- Exported `designTokens` object so designers/developers can reuse the
same tokens outside Tailwind (Storybook, Figma tokens, backend theming).


HOW TO USE
1. Install Tailwind & recommended plugins:
npm install -D tailwindcss @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio


2. Drop this file into the root of your Next.js app or at the workspace root
(adjust `content` paths if you use a different monorepo layout).


3. Optional: Use the exported `designTokens` for generating cross-platform
tokens (Figma, Storybook palette, CSS variables JSON, etc.).

4. Optional Because I don't know if I will add this feature:
Dark mode: this config uses `darkMode: 'class'`. Add the `dark` class to
an ancestor (html/body) or toggle `[data-theme="dark"]` for theme-aware CSS.




──────────────────────────────────────────────────────────────────────────────
Design principles & naming rationale (short):
- brand.*: identity colors (primary, secondary, accent) used for CTAs,
hero, promotions and important interactive elements.
- ui.*: neutral surfaces, borders, dividers, and elevation surfaces.
- text.*: semantic text colors.
- feedback.*: system state colors for success/warning/error/info.
- elevation.*: shadows used to indicate stacking context (card depths).


Semantic classes developers should expect to use:
- bg-brand-primary, text-brand-primary, hover:bg-brand-primary-600
- bg-ui-surface, border-ui-divider, text-text-primary
- bg-feedback-error, text-feedback-success


──────────────────────────────────────────────────────────────────────────────
 ton class="inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold
bg-brand-primary hover:bg-brand-primary-600 focus:outline-none focus:ring-3
focus:ring-brand-primary/25 text-white">Buy Now</button>


2) Secondary CTA
<button class="px-4 py-2 rounded-md font-medium bg-brand-secondary text-white
hover:bg-brand-secondary-600">Add to Cart</button>


3) Product card (light)
`<div class="bg-ui-surface p-4 rounded-lg shadow-elev-low">
<img src="/products/1.jpg" alt="..." class="w-full h-56 object-cover rounded-md" />
<h3 class="mt-3 text-text-primary font-semibold">Awesome Chair</h3>
<p class="text-text-secondary text-sm">Vendor — Category</p>
<div class="mt-4 flex items-center justify-between">
<span class="text-lg font-bold">$129</span>
<button class="px-3 py-1 rounded-md bg-brand-primary text-white">Buy</button>
</div>
</div>`


4) Alert / feedback
<div class="p-3 rounded-md bg-feedback-error/10 text-feedback-error">Payment failed</div>
<div class="p-3 rounded-md bg-feedback-success/10 text-feedback-success">Order placed</div>


ACCESSIBILITY NOTES
- Ensure >= 4.5:1 contrast for important CTA text. Prefer using the darker brand shades for
text on light backgrounds and light text on darker brand backgrounds.
- Use `aria-` attributes for interactive elements and `role="alert"` for urgent messages.


THEMING & DARK MODE
- Use `document.documentElement.classList.toggle('dark')` or set `data-theme="dark"` on the
root element to switch. Our CSS variables and token mapping handle color flips for core tokens.


STORYBOOK / DESIGN TOKENS
- Export `designTokens` from this file to generate JSON tokens for Figma and Storybook. This
keeps the UI consistent across design and implementation.


RECOMMENDED NEXT STEPS
1. Generate a small component library (Button, Card, Badge, Alert) using these tokens.
2. Add Storybook and import `designTokens` to create a shared theme for previewing components.
3. Create a small style guide page in the admin dashboard documenting when to use
brand-primary vs brand-secondary, spacing rules, and typography scale.


──────────────────────────────────────────────────────────────────────────────

