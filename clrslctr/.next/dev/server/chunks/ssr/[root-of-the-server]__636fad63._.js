module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/colorSelector/clrslctr/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pages/index.tsx
__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/colorSelector/clrslctr/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/colorSelector/clrslctr/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
const WIDTH = 8;
const HEIGHT = 8;
function Home() {
    const [colorPicker, setColorPicker] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('#ffff00');
    const [gridColors, setGridColors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(Array.from({
        length: HEIGHT
    }, ()=>Array(WIDTH).fill('#000000')));
    const isDragging = (0, __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const handleCellClick = (x, y)=>{
        const newGrid = gridColors.map((row)=>[
                ...row
            ]);
        newGrid[y][x] = colorPicker;
        setGridColors(newGrid);
    };
    const handleMouseDown = (x, y)=>{
        isDragging.current = true;
        handleCellClick(x, y);
    };
    const handleMouseEnter = (x, y)=>{
        if (isDragging.current) {
            handleCellClick(x, y);
        }
    };
    const handleMouseUp = ()=>{
        isDragging.current = false;
    };
    const generateBitmap = ()=>{
        const rows = gridColors.map((row)=>{
            const colors = row.map((c)=>{
                const bigint = parseInt(c.slice(1), 16);
                const r = bigint >> 16 & 255;
                const g = bigint >> 8 & 255;
                const b = bigint & 255;
                return `matrix.Color(${r}, ${g}, ${b})`;
            });
            return `{ ${colors.join(', ')} }`;
        });
        return `uint32_t bitmap[8][8] = {
  ${rows.join(',\n  ')}
};`;
    };
    const copyToClipboard = async ()=>{
        try {
            await navigator.clipboard.writeText(generateBitmap());
            alert('Bitmap copied to clipboard!');
        } catch (err) {
            alert('Failed to copy bitmap');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: 20,
            fontFamily: 'sans-serif',
            userSelect: 'none'
        },
        onMouseUp: handleMouseUp,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "8×8 NeoPixel Bitmap Creator"
            }, void 0, false, {
                fileName: "[project]/colorSelector/clrslctr/app/page.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "color",
                value: colorPicker,
                onChange: (e)=>setColorPicker(e.target.value),
                style: {
                    marginBottom: 20
                }
            }, void 0, false, {
                fileName: "[project]/colorSelector/clrslctr/app/page.tsx",
                lineNumber: 67,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'grid',
                    gridTemplateColumns: `repeat(${WIDTH}, 30px)`,
                    gridTemplateRows: `repeat(${HEIGHT}, 30px)`,
                    gap: 4,
                    marginBottom: 20
                },
                children: gridColors.map((row, y)=>row.map((color, x)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            onMouseDown: ()=>handleMouseDown(x, y),
                            onMouseEnter: ()=>handleMouseEnter(x, y),
                            style: {
                                width: 30,
                                height: 30,
                                backgroundColor: color,
                                borderRadius: 4,
                                border: '1px solid #444',
                                cursor: 'pointer'
                            }
                        }, `${x}-${y}`, false, {
                            fileName: "[project]/colorSelector/clrslctr/app/page.tsx",
                            lineNumber: 84,
                            columnNumber: 13
                        }, this)))
            }, void 0, false, {
                fileName: "[project]/colorSelector/clrslctr/app/page.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: copyToClipboard,
                style: {
                    marginBottom: 10,
                    padding: '10px 20px',
                    fontSize: 16,
                    borderRadius: 6,
                    backgroundColor: '#0070f3',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer'
                },
                children: "Copy uint32_t Bitmap"
            }, void 0, false, {
                fileName: "[project]/colorSelector/clrslctr/app/page.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$colorSelector$2f$clrslctr$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                readOnly: true,
                value: generateBitmap(),
                style: {
                    width: '90%',
                    height: 200
                }
            }, void 0, false, {
                fileName: "[project]/colorSelector/clrslctr/app/page.tsx",
                lineNumber: 115,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/colorSelector/clrslctr/app/page.tsx",
        lineNumber: 62,
        columnNumber: 5
    }, this);
}
}),
"[project]/colorSelector/clrslctr/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/colorSelector/clrslctr/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/colorSelector/clrslctr/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/colorSelector/clrslctr/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/colorSelector/clrslctr/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__636fad63._.js.map