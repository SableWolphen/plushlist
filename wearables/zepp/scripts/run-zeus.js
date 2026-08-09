const { spawnSync } = require('node:child_process')
const path = require('node:path')

const cliRoot = path.dirname(require.resolve('@zeppos/zeus-cli/package.json'))
const cliEntry = path.join(cliRoot, 'bin', 'main.js')
const privateModules = path.join(cliRoot, 'private-modules')
const nodePath = process.env.NODE_PATH
  ? `${privateModules}${path.delimiter}${process.env.NODE_PATH}`
  : privateModules
const windowsFix = path.join(__dirname, 'windows-zeus-open-fix.js').replace(/\\/g, '/')
const nodeOptions = process.platform === 'win32'
  ? [process.env.NODE_OPTIONS, `--require="${windowsFix}"`]
      .filter(Boolean)
      .join(' ')
  : process.env.NODE_OPTIONS

const result = spawnSync(process.execPath, [cliEntry, ...process.argv.slice(2)], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, NODE_PATH: nodePath, NODE_OPTIONS: nodeOptions },
  stdio: 'inherit'
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
