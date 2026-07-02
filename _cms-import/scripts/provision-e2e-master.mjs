// Provision a dedicated E2E test master account (auth user + approved master profile).
// Idempotent: re-running reuses the existing user. Reads creds from .env.local.
import { readFileSync } from 'node:fs'
import pg from 'pg'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]
    }),
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
// Read the test-account creds from .env.local (E2E_MASTER_EMAIL/PASSWORD) — never hardcode secrets.
const EMAIL = env.E2E_MASTER_EMAIL
const PASSWORD = env.E2E_MASTER_PASSWORD
if (!EMAIL || !PASSWORD) {
  console.error('Set E2E_MASTER_EMAIL and E2E_MASTER_PASSWORD in .env.local first.')
  process.exit(1)
}

async function createOrGetUser() {
  // create with email pre-confirmed (no inbox needed)
  const res = await fetch(`${URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true }),
  })
  const body = await res.json()
  if (res.ok && body.id) return body.id
  // already exists -> look it up
  const list = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  const data = await list.json()
  const found = (data.users || data || []).find((u) => u.email === EMAIL)
  if (found) {
    // ensure password is the known one
    await fetch(`${URL}/auth/v1/admin/users/${found.id}`, {
      method: 'PUT',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: PASSWORD, email_confirm: true }),
    })
    return found.id
  }
  throw new Error('could not create or find user: ' + JSON.stringify(body))
}

const id = await createOrGetUser()

const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()
await client.query(
  `insert into public.profiles (id, email, name, role, status)
   values ($1,$2,'E2E Master','master','approved')
   on conflict (id) do update set role='master', status='approved', name='E2E Master'`,
  [id, EMAIL],
)
const check = await client.query('select email, role, status from profiles where id=$1', [id])
await client.end()

console.log('provisioned:', JSON.stringify(check.rows[0]))
console.log('E2E_MASTER_EMAIL=' + EMAIL)
console.log('E2E_MASTER_PASSWORD=' + PASSWORD)
