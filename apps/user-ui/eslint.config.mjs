import nx from '@nx/eslint-plugin';
import nextConfig from 'eslint-config-next/core-web-vitals';
import rootConfig from '../../eslint.config.mjs';

const config = [
  ...nextConfig,
  ...rootConfig,
  ...nx.configs['flat/react-typescript'],
  {
    ignores: ['.next/**/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
    },
  },
];

export default config;
