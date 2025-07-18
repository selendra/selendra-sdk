import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    resolve({
      preferBuiltins: true,
      browser: false
    }),
    commonjs(),
    json(),
    typescript({
      tsconfig: './tsconfig.json'
    })
  ],
  external: [
    'ethers',
    '@polkadot/api',
    '@polkadot/types',
    '@polkadot/util',
    '@polkadot/util-crypto',
    '@polkadot/keyring',
    'ws'
  ]
};