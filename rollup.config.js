import commonjs   from "@rollup/plugin-commonjs";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import typescript from "@rollup/plugin-typescript";
import dts        from 'rollup-plugin-dts'
import replace from '@rollup/plugin-replace';
import { nodeResolve } from "@rollup/plugin-node-resolve";

import packageJson from "./package.json" with { type: "json" };

// eslint-disable-next-line import/no-anonymous-default-export
export default [{
  input: "./src/index.ts",
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: true
    }
  ],

plugins: [
  peerDepsExternal(),

  nodeResolve({
    browser: true,
    extensions: ['.js', '.ts', '.tsx']
  }),

  commonjs(),
  typescript({
    compilerOptions: {
      outDir: "build",
    },
  }),

  replace({
    'process.env.NODE_ENV': JSON.stringify('production'),
    preventAssignment: true
  })
]
},
{
  input: './build/dts/index.d.ts',
  output: [{ file: 'build/index.d.ts', format: 'es' }],
  plugins: [dts()],
}
];
