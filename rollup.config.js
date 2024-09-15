import commonjs   from "@rollup/plugin-commonjs";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import typescript from "@rollup/plugin-typescript";
import postcss    from "rollup-plugin-postcss";
import url        from '@rollup/plugin-url'
import dts        from 'rollup-plugin-dts'
import replace from '@rollup/plugin-replace';
import { nodeResolve } from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";

import packageJson from "./package.json";

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
      preferBuiltins: true,
      browser: true
    }),
    commonjs({
      include: /node_modules/, // Convert CommonJS modules to ES6
    }),
    typescript(),
    postcss(),
    url(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true,
    }),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**"
    })
  ]
},
{
  input: './build/dts/index.d.ts',
  output: [{ file: 'build/index.d.ts', format: 'es' }],
  plugins: [dts()],
}
];
