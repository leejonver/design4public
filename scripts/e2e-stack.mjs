// Keep destructive E2E fixtures separate from a developer's production-copy DB.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = fileURLToPath(new URL('../', import.meta.url))
const workdir = `${root}.e2e-stack`
const action = process.argv[2]
if (!['start', 'stop'].includes(action)) throw new Error('Usage: node scripts/e2e-stack.mjs start|stop')
const run = (...args) => execFileSync('supabase', [...args, '--workdir', workdir], { cwd: root, stdio: 'pipe' }).toString()
if (action === 'stop') {
  run('stop')
  console.log('Stopped isolated E2E stack; development DB unchanged.')
} else {
  mkdirSync(`${workdir}/supabase`, { recursive: true })
  const config = readFileSync(`${root}supabase/config.toml`, 'utf8')
    .replace('project_id = "design4public"', 'project_id = "design4public-e2e"')
    .replaceAll('5432', '5532').replaceAll('8083', '8183').replaceAll('3000', '3100')
  if (!config.includes('project_id = "design4public-e2e"')) throw new Error('Unexpected Supabase project config')
  writeFileSync(`${workdir}/supabase/config.toml`, config)
  writeFileSync(`${workdir}/supabase/seed.sql`, readFileSync(`${root}supabase/seed.sql`, 'utf8').replaceAll('54321', '55321'))
  cpSync(`${root}supabase/migrations`, `${workdir}/supabase/migrations`, { recursive: true })
  console.log('Starting isolated E2E Supabase (API 55321, DB 55322)...')
  run('start', '--exclude', 'studio,postgres-meta,realtime,edge-runtime,logflare,vector')
  const status = JSON.parse(run('status', '-o', 'json'))
  if (status.API_URL !== 'http://127.0.0.1:55321') throw new Error('Unexpected E2E API URL')
  writeFileSync(`${root}.env.test.local`, [
    `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${status.ANON_KEY}`,
    `SUPABASE_SERVICE_ROLE_KEY=${status.SERVICE_ROLE_KEY}`,
    `E2E_MAILPIT_URL=${status.MAILPIT_URL ?? status.INBUCKET_URL}`,
    'E2E_PORT=3100', '',
  ].join('\n'), { mode: 0o600 })
  const client = createClient(status.API_URL, status.SERVICE_ROLE_KEY)
  const image = readFileSync(`${root}tests/e2e/fixtures/sample.png`)
  for (const name of ['office-1', 'office-2', 'aeron', 'library-1', 'library-2', 'eames']) {
    const { error } = await client.storage.from('images').upload(`seed/${name}.jpg`, image, { contentType: 'image/png', upsert: true })
    if (error) throw error
  }
  console.log('Ready. Run npm run test:e2e. No development data was reset.')
}
