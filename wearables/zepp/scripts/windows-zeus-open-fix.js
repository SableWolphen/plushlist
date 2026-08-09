if (process.platform === 'win32') {
  const childProcess = require('node:child_process')
  const originalSpawn = childProcess.spawn

  childProcess.spawn = function spawn(command, args, options) {
    // Zeus CLI 1.9.3 ships a mojibake en dash in this PowerShell option.
    const fixedArgs = /powershell/i.test(command) && Array.isArray(args)
      ? args.map((arg) => typeof arg === 'string' && arg.endsWith('ExecutionPolicy')
          ? '-ExecutionPolicy'
          : arg)
      : args

    return originalSpawn.call(this, command, fixedArgs, options)
  }
}
