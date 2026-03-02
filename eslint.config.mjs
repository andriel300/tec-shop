import baseConfig from './eslint.base.config.mjs';

export default [
  ...baseConfig,
  {
    ignores: ['**/dist', '**/generated/prisma', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allowCircularSelfDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // Shared libs cannot import from apps (no circular shared -> app)
            {
              sourceTag: 'scope:shared',
              notDependOnLibsWithTags: ['type:app'],
            },
            // Frontend apps cannot import backend-only code
            {
              sourceTag: 'scope:frontend',
              notDependOnLibsWithTags: ['scope:backend'],
            },
            // No app -> app direct imports (prevents cross-service code coupling)
            {
              sourceTag: 'type:app',
              notDependOnLibsWithTags: ['type:app'],
            },
            // E2E tests can only depend on apps and shared libs
            {
              sourceTag: 'type:e2e',
              onlyDependOnLibsWithTags: ['type:app', 'scope:shared'],
            },
            // Prisma clients cannot depend on apps
            {
              sourceTag: 'type:prisma-client',
              notDependOnLibsWithTags: ['type:app'],
            },
            // Prisma schemas cannot depend on apps or clients
            {
              sourceTag: 'type:prisma-schema',
              notDependOnLibsWithTags: ['type:app', 'type:prisma-client'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
