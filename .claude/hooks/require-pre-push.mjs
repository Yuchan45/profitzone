// Hook PreToolUse de Claude Code: bloquea los `git push` que ejecute Claude
// si el commit actual (HEAD) no pasó por la skill /pre-push.
// La skill deja el SHA aprobado en <git-dir>/claude-pre-push-approved.
// No afecta los push que hagas vos a mano desde la terminal.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const MARKER = 'claude-pre-push-approved'
const GIT_PUSH = /(^|[\s;&|(])git(\s+-[Cc]\s+\S+)*\s+push(\s|$)/

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return {}
  }
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  )
  process.exit(0)
}

const input = readStdin()
const command = input.tool_input?.command ?? ''

if (!GIT_PUSH.test(command)) {
  process.exit(0)
}

const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd()

let head
let gitDir
try {
  head = git(['rev-parse', 'HEAD'], cwd)
  gitDir = path.resolve(cwd, git(['rev-parse', '--git-dir'], cwd))
} catch {
  // Fuera de un repo git: no hay nada que validar.
  process.exit(0)
}

let approved = ''
try {
  approved = readFileSync(path.join(gitDir, MARKER), 'utf8').trim()
} catch {
  // Sin marker: nunca se corrió /pre-push.
}

if (approved !== head) {
  deny(
    `Push bloqueado: el commit ${head.slice(0, 7)} no pasó por la revisión previa. ` +
      'Corré la skill /pre-push (lint/build + code review + estándares + seguridad) y pusheá solo si el usuario la aprueba.',
  )
}

process.exit(0)
