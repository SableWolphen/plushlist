const { spawnSync } = require('node:child_process')
const path = require('node:path')

const cliRoot = path.dirname(require.resolve('@zeppos/zeus-cli/package.json'))
const cliEntry = path.join(cliRoot, 'bin', 'main.js')
const privateModules = path.join(cliRoot, 'private-modules')
const nodePath = process.env.NODE_PATH
  ? `${privateModules}${path.delimiter}${process.env.NODE_PATH}`
  : privateModules

const result = spawnSync(process.execPath, [cliEntry, ...process.argv.slice(2)], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, NODE_PATH: nodePath },
  stdio: 'inherit'
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
