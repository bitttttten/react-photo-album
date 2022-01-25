import fs from "fs";
import peerDeps from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";
import dts from "rollup-plugin-dts";
import pkg from "./package.json";

const input = "src/index.ts";
const packageName = pkg.name;

const dist = "dist";
const cjsDevelopment = `${packageName}.cjs.development.js`;
const cjsProduction = `${packageName}.cjs.production.min.js`;
const umdProduction = `${packageName}.umd.production.min.js`;

const formats = [
    { format: "esm", file: `${dist}/${packageName}.esm.js` },
    { format: "cjs", file: `${dist}/${cjsDevelopment}` },
    { format: "cjs", file: `${dist}/${cjsProduction}`, minify: true },
    {
        format: "umd",
        file: `${dist}/${umdProduction}`,
        globals: { react: "React" },
        name: "ReactPhotoAlbum",
        minify: true,
    },
];

const cjsEntry = `'use strict'\n\nif (process.env.NODE_ENV === 'production') {\n\tmodule.exports = require('./${cjsProduction}');\n} else {\n\tmodule.exports = require('./${cjsDevelopment}');\n}\n`;

// noinspection JSCheckFunctionSignatures
export default formats
    .map(({ minify, ...output }) => ({
        input,
        output: [
            {
                ...output,
                sourcemap: true,
                exports: "named",
            },
        ],
        plugins: [
            peerDeps(),
            resolve(),
            commonjs(),
            typescript(),
            babel({
                babelHelpers: "bundled",
                extensions: [".js", ".jsx", ".ts", ".tsx"],
            }),
            minify && terser(),
            minify &&
                output.format === "cjs" && {
                    name: "cjs-entry",
                    buildEnd: () => fs.writeFileSync(pkg.main, cjsEntry),
                },
        ].filter(Boolean),
    }))
    .concat([
        {
            input,
            output: [{ file: pkg.types, format: "es" }],
            plugins: [dts()],
        },
    ]);
