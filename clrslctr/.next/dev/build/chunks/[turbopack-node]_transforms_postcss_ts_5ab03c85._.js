module.exports = [
"[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/colorSelector/clrslctr/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "chunks/f1dec_2f68ded1._.js",
  "chunks/[root-of-the-server]__bb8278dd._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/colorSelector/clrslctr/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];