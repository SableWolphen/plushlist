const fs=require('node:fs'),{buildSync}=require('esbuild'),{execFileSync}=require('node:child_process');
if(!fs.existsSync('www/vendor/react.production.min.js'))throw new Error('Run web:sync first');
buildSync({entryPoints:['scripts/fixtures/discovery-controls.jsx'],bundle:true,format:'esm',platform:'browser',outfile:'www/assets/discovery-controls.js'});
// The exact production source where the regression was observed. No hosted data.
fs.writeFileSync('www/assets/discovery-before.js',execFileSync('git',['show','19c040dbef9a31132a0f6725f7e277bcc6a27283:assets/gentle-discovery-ui.js']));
for(const kind of ['before','fixed']){
 const helper=kind==='before'?'discovery-before.js':'gentle-discovery-ui.js';
 fs.writeFileSync(`www/discovery-${kind}.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Discovery ${kind} regression fixture</title><link rel="stylesheet" href="assets/figma-design.css"><link rel="stylesheet" href="assets/storybook-themes.css"><link rel="stylesheet" href="assets/calm-guardian.css"><div id="root"></div><script src="vendor/react.production.min.js"></script><script src="vendor/react-dom.production.min.js"></script><script src="assets/plush-content.js"></script><script src="assets/plush-theme-copy.js"></script><script type="module" src="assets/discovery-controls.js"></script><script defer src="assets/${helper}?regression=1"></script></html>`);
}
console.log('Serve www/. Compare /discovery-before.html and /discovery-fixed.html after the helper runs. Fixed keeps 11 themes, 2 appearance options and 8 tasks visible, with zero automatic list expansions. Rescue must affect tasks only.');
