const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'www', 'android', 'dist', 'build']);
const SOURCE_EXTS = new Set(['.jsx', '.js', '.html']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE_EXTS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}
function rel(file) { return path.relative(ROOT, file).replace(/\\/g, '/'); }
function lineOf(source, index) { return source.slice(0, index).split('\n').length; }
function addIssue(issues, file, source, index, message, sample = '') {
  issues.push(`${rel(file)}:${lineOf(source, index)} ${message}${sample ? ` :: ${sample.trim().slice(0, 180)}` : ''}`);
}

const issues = [];
const files = walk(ROOT).filter((file) => {
  const r = rel(file);
  return r.startsWith('src/') || !r.includes('/');
});

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');

  for (const pattern of [
    /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/g,
    /onClick\s*=\s*\{\s*undefined\s*\}/g,
    /href\s*=\s*["']javascript:/gi,
    /href\s*=\s*["']\s*["']/gi,
    /â€¦|â€™|â€œ|â€|Ã./g,
  ]) {
    let match;
    while ((match = pattern.exec(source))) addIssue(issues, file, source, match.index, 'dead/broken interactive text or link', match[0]);
  }

  if (path.extname(file) === '.html') {
    const buttonRe = /<button\b[^>]*>/gi;
    let button;
    while ((button = buttonRe.exec(source))) {
      const tag = button[0];
      if (/type\s*=\s*["'](?:submit|reset)["']/i.test(tag)) continue;
      const idMatch = tag.match(/\bid=["']([^"']+)["']/i);
      const id = idMatch && idMatch[1];
      if (id && source.includes(`getElementById("${id}")`) && source.includes(`${id}.addEventListener("click"`)) continue;
      // An untyped button inside a form is a submit control; require a submit handler in the page.
      const before = source.slice(0, button.index);
      const after = source.slice(button.index + tag.length);
      const inForm = before.lastIndexOf('<form') > before.lastIndexOf('</form>') && after.indexOf('</form>') >= 0;
      if (inForm && /addEventListener\(['"]submit['"]/.test(source)) continue;
      addIssue(issues, file, source, button.index, 'HTML button is not demonstrably wired', tag);
    }

    const hrefRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
    let link;
    while ((link = hrefRe.exec(source))) {
      const href = link[1];
      if (/^(?:https?:|mailto:|tel:)/i.test(href)) continue;
      if (href === '#') {
        const idMatch = link[0].match(/\bid=["']([^"']+)["']/i);
        const id = idMatch && idMatch[1];
        if (id && source.includes(`getElementById("${id}")`) && source.includes(`${id}.addEventListener("click"`)) continue;
        addIssue(issues, file, source, link.index, 'hash-only link is not demonstrably wired', link[0]);
        continue;
      }
      const clean = href.split('#')[0].split('?')[0];
      if (!clean || clean === './' || clean === '/') continue;
      const resolved = path.resolve(path.dirname(file), clean);
      const candidates = [resolved, `${resolved}.html`, path.join(resolved, 'index.html')];
      if (!candidates.some((candidate) => fs.existsSync(candidate))) addIssue(issues, file, source, link.index, `internal link target is missing (${href})`, link[0]);
    }
  }
}

const mustContain = {
  'src/components/baby-mode.jsx': [
    ['onClick={onShowTinyThing}', 'Baby Mode Tiny thing action'],
    ['onClick={onSoftDay}', 'Baby Mode Soft day action'],
  ],
  'src/components/baby-today.jsx': [
    ['onClick={() => toggle(nextStepTask.key)}', 'Tiny Thing completion'],
    ['onClick={() => pickEasierSuggestion?.(nextStepTask.key)}', 'Make it tinier'],
    ['onClick={() => selectDayType?.("soft")}', 'Soft day'],
    ['onClick={() => selectDayType?.("tiny")}', 'Tiny day'],
    ['onClick={openCare}', 'Comfort/Care'],
    ['onClick={() => openTaskManager?.()}', 'Edit jobs'],
    ['onClick={() => goToDashboard?.("week")}', 'Planner route'],
    ['onClick={() => goToDashboard?.("progress")}', 'Progress route'],
    ['aria-label="Today schedule"', 'Baby Mode schedule card'],
    ['babyScheduleEntries.slice(0, 3)', 'compact Baby Mode schedule preview'],
    ['entry.text || entry.label || entry.title', 'Baby Mode schedule uses saved item text'],
  ],
  'src/components/guardian-panel.jsx': [
    ['can_view_tasks', 'Guardian task sharing permission'],
    ['can_view_schedule', 'Guardian schedule sharing permission'],
    ['can_view_mood', 'Guardian mood-summary permission'],
    ['WHAT {selectedSupportName.toUpperCase()} SHARED WITH YOU', 'Guardian shared-access view'],
  ],
  'src/components/habit-retention.jsx': [
    ['goToDashboard?.("progress")', 'Low Screen review route'],
    ['goToDashboard?.("care")', 'support route'],
    ['openTaskManager?.()', 'task manager route'],
  ],
  'login.html': [
    ['send.addEventListener("click"', 'email-code send button'],
    ['verify.addEventListener("click"', 'email-code sign-in button'],
    ['passwordSignIn.addEventListener("click"', 'password sign-in button'],
    ['togglePassword.addEventListener("click"', 'password-mode toggle'],
  ],
  'oauth.html': [
    ["form.addEventListener('submit'", 'OAuth connect form'],
    ["location.assign(result.redirect_to)", 'OAuth success redirect'],
  ],
};
for (const [relative, checks] of Object.entries(mustContain)) {
  const source = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  for (const [needle, label] of checks) if (!source.includes(needle)) issues.push(`${relative}: missing expected wiring: ${label}`);
}

if (issues.length) {
  console.error(`Interactive wiring audit found ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}
console.log(`Interactive wiring audit passed across ${files.length} source files.`);
