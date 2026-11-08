import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import zipPack from "vite-plugin-zip-pack";
import fg from "fast-glob";
import minimist from "minimist";

import { useLiveReload } from "./scripts/siyuan_live_reload.js";

const args = minimist(process.argv.slice(2));
const isWatch = Boolean(args.watch || args.w);
const isSrcmap = args.sourcemap === "inline";
const outputDir = isWatch ? "dev" : "dist";

const pluginManifest = JSON.parse(readFileSync(resolve(import.meta.dirname, "plugin.json"), "utf8"));
const packageImageTargets = [
    ["icon", "icon.png"],
    ["preview", "preview.png"],
].flatMap(([field, legacyName]) => {
    const fileName = pluginManifest[field] || (existsSync(legacyName) ? legacyName : "");
    return fileName ? [{ src: `./${fileName}`, dest: "./" }] : [];
});

console.log("isWatch=>", isWatch);
console.log("isSrcmap=>", isSrcmap);
console.log("outputDir=>", outputDir);

export default defineConfig({
    plugins: [
        viteStaticCopy({
            targets: [
                ...packageImageTargets,
                { src: "./README*.md", dest: "./" },
                { src: "./plugin.json", dest: "./" },
                { src: "./src/i18n/*", dest: "./i18n", rename: { stripBase: true } },
            ],
        }),
    ],

    define: {
        "process.env.DEV_MODE": JSON.stringify(isWatch),
    },

    build: {
        outDir: outputDir,
        target: "es2020",
        // Production builds are cleaned by scripts/clean.js; watch mode cleans dev once.
        emptyOutDir: isWatch,
        sourcemap: isSrcmap ? "inline" : false,
        minify: !isWatch,

        lib: {
            entry: resolve(import.meta.dirname, "src/index.ts"),
            fileName: () => "index.js",
            cssFileName: "index",
            formats: ["cjs"],
        },
        rollupOptions: {
            plugins: isWatch ? [
                useLiveReload({ outputDir }),
                watchExternalFiles([
                    "src/i18n/**",
                    "./README*.md",
                    "./plugin.json",
                ]),
            ] : [
                zipPack({
                    inDir: "./dist",
                    outDir: "./",
                    outFileName: "package.zip",
                }),
            ],

            external: ["siyuan", "process"],

            output: {
                entryFileNames: "[name].js",
                assetFileNames: (assetInfo) => assetInfo.name ?? "asset",
            },
        },
    },
});

function watchExternalFiles(patterns: string[]): Plugin {
    return {
        name: "watch-external",
        async buildStart() {
            const files = await fg(patterns);
            for (const file of files) {
                this.addWatchFile(file);
            }
        },
    };
}
