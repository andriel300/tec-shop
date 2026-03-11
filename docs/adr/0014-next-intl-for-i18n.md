# ADR-0014: next-intl for Internationalisation

## Status
Accepted

## Context
All three frontend applications (user-ui, seller-ui, admin-ui) require
internationalisation support. Duplicating i18n configuration and shared
translation keys (common UI labels, language switcher) across three separate
Next.js apps would create maintenance overhead and divergence.

## Decision
We adopted next-intl v4 for i18n across all frontends, with shared configuration
and messages centralised in the `@tec-shop/i18n` shared library
(`libs/shared/i18n`):

- `config.ts`: exports `locales`, `defaultLocale`, `Locale` type, and `routing`
- `navigation.ts`: exports `Link`, `redirect`, `usePathname`, `useRouter`,
  `getPathname` (thin wrappers over next-intl navigation)
- `messages.ts`: exports `getSharedMessages()` and `mergeMessages()` for
  shared `Common` and `LanguageSwitcher` translation namespaces

Each app:
1. Has a thin `routing.ts` and `navigation.ts` that re-export from `@tec-shop/i18n`
2. Has `i18n/request.ts` that calls `mergeMessages(getSharedMessages(locale), appMessages)`
   to combine shared and app-specific translations
3. Contains only app-specific message files; shared keys live in the shared library

Translation key conventions:
- Page namespaces end with `Page` (e.g., `ProductDetailPage`)
- Context-specific keys: `card_title`, `meta_description`
- Sentence case for all user-visible strings
- No hard-coded user-visible strings anywhere in component code

## Alternatives Considered
- **react-i18next** — mature ecosystem but requires additional configuration for
  Next.js App Router server components; next-intl is purpose-built for Next.js.
- **Per-app i18n with no sharing** — each app manages its own i18n independently.
  Rejected because common UI labels (buttons, error messages) would diverge.

## Consequences
- **Positive:** Single source of truth for shared translations; adding a new locale
  requires updating only `config.ts` and the shared message files, then each app
  automatically supports it.
- **Negative:** All three apps are coupled to the shared i18n lib; breaking changes
  to the shared config affect all frontends simultaneously.

## Trade-offs
Cross-app coupling for i18n was accepted because the alternative (diverging
translation keys across apps) is harder to maintain and creates inconsistent
user experiences.
