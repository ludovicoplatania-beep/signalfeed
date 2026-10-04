'use client'

import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Brand } from '../components/ui'

export default function AccessPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function login(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const response = await fetch('/api/access/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await response.json()
    if (!response.ok) {
      setMessage(data.message ?? 'Accesso non riuscito')
      setLoading(false)
      return
    }

    const destination = new URLSearchParams(window.location.search).get('next')
    router.replace(destination?.startsWith('/') && !destination.startsWith('//') ? destination : '/')
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <section className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <Brand />
            <div className="mt-12 inline-flex rounded-full border border-line bg-accent-soft px-4 py-2 text-sm text-accent">
              Accesso personale
            </div>
            <h1 className="mt-8 max-w-4xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              Il tuo briefing,
              <br />
              solo tuo.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
              Un unico accesso protegge fonti, segnali e consumo AI su tutti i tuoi dispositivi.
            </p>
          </motion.div>

          <motion.form
            onSubmit={login}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-line bg-surface p-7   "
          >
            <p className="text-sm uppercase tracking-[0.22em] text-accent">Accesso privato</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight">Apri Athena</h2>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              placeholder="Password"
              className="mt-7 w-full rounded-2xl border border-line bg-surface px-4 py-4 text-foreground outline-none placeholder:text-muted focus:border-line"
            />
            <button
              type="submit"
              disabled={loading || !password}
              className="mt-3 w-full rounded-2xl bg-accent px-4 py-4 font-medium text-on-accent transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Accesso…' : 'Entra'}
            </button>
            {message && <p className="mt-4 text-sm leading-6 text-danger">{message}</p>}
          </motion.form>
        </section>
      </div>
    </main>
  )
}
