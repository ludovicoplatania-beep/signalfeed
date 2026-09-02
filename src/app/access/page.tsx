'use client'

import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { BackgroundGlow, Brand } from '../components/ui'

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
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <BackgroundGlow />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <section className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <Brand />
            <div className="mt-12 inline-flex rounded-full border border-[#B88A44]/20 bg-[#B88A44]/10 px-4 py-2 text-sm text-[#B88A44]">
              Accesso personale
            </div>
            <h1 className="mt-8 max-w-4xl text-6xl font-semibold leading-[0.9] tracking-[-0.08em] md:text-8xl">
              Il tuo briefing,
              <br />
              solo tuo.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-400">
              Un unico accesso protegge fonti, segnali e consumo AI su tutti i tuoi dispositivi.
            </p>
          </motion.div>

          <motion.form
            onSubmit={login}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2rem] border border-[#B88A44]/15 bg-white/[0.055] p-7 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <p className="text-sm uppercase tracking-[0.22em] text-[#B88A44]">Accesso privato</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight">Apri SignalFeed</h2>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              placeholder="Password"
              className="mt-7 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none placeholder:text-neutral-600 focus:border-[#B88A44]/40"
            />
            <button
              type="submit"
              disabled={loading || !password}
              className="mt-3 w-full rounded-2xl bg-[#B88A44] px-4 py-4 font-medium text-black transition hover:bg-[#C59A52] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Accesso…' : 'Entra'}
            </button>
            {message && <p className="mt-4 text-sm leading-6 text-rose-300">{message}</p>}
          </motion.form>
        </section>
      </div>
    </main>
  )
}
