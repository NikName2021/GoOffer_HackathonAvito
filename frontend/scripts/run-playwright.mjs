import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const serverUrl = 'http://127.0.0.1:4173'

function run(command, args) {
  return spawn(command, args, { cwd: projectRoot, stdio: 'inherit' })
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })
}

async function waitForServer(timeoutMs = 30_000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(serverUrl)
      if (response.ok) return
    } catch {
      // Vite ещё запускается.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  throw new Error(`Vite не запустился за ${timeoutMs / 1_000} секунд.`)
}

const vite = run(process.execPath, [viteCli, '--host', '127.0.0.1', '--port', '4173', '--strictPort'])

try {
  await waitForServer()
  const playwright = run(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)])
  process.exitCode = await waitForExit(playwright)
} finally {
  vite.kill()
}
