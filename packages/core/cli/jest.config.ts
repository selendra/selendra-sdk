import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|ora|inquirer|is-unicode-supported|figures|cli-cursor|cli-spinners|interactive-git|restore-cursor|onetime|mimic-fn|strip-ansi|ansi-regex|ansi-styles)/)',
  ],
};

export default config;
