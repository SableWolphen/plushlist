const fs=require("node:fs");
const {buildSync}=require("esbuild");
if(!fs.existsSync("www/vendor/react.production.min.js"))throw new Error("Run web:sync first");
buildSync({entryPoints:["scripts/fixtures/calm-guardian.jsx"],bundle:true,format:"esm",platform:"browser",outfile:"www/assets/calm-preview.js",loader:{".jsx":"jsx"}});
const styles=[...fs.readFileSync("index.html","utf8").matchAll(/<link rel="stylesheet"[^>]+>/g)].map(m=>m[0]).join("\n");
fs.writeFileSync("www/calm-preview.html",`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PlushLife redesign — local synthetic preview</title>${styles}<style>body{margin:0}button{cursor:pointer}#main-content .pl-calm-guardian{padding-bottom:35px}</style><div id="root"></div><script src="./vendor/react.production.min.js"></script><script src="./vendor/react-dom.production.min.js"></script>${["plush-content","plush-helpers","plush-schedule","plush-theme-copy"].map(name=>`<script src="./assets/${name}.js"></script>`).join("")}<script type="module" src="./assets/calm-preview.js"></script></html>`);
console.log("Local synthetic preview: /calm-preview.html. No Supabase session or hosted data is used.");
