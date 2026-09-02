import { motion } from 'framer-motion'
import { BackgroundGlow, Brand } from './ui'

export function LoginView({
  email,
  setEmail,
  message,
  login,
}: {
  email: string
  setEmail: (email: string) => void
  message: string
  login: () => Promise<void>
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <BackgroundGlow />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <section className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <Brand />

            <div className="mt-12 inline-flex rounded-full border border-[#B88A44]/20 bg-[#B88A44]/10 px-4 py-2 text-sm text-[#B88A44]">
              AI Strategic Intelligence
            </div>

            <h1 className="mt-8 max-w-4xl text-6xl font-semibold leading-[0.9] tracking-[-0.08em] text-white md:text-8xl">
              Converti il rumore
              <br />
              in strategia.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-400">
              Athena interpreta le tue fonti, identifica segnali rilevanti e costruisce un briefing personale orientato alle decisioni.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2rem] border border-[#B88A44]/15 bg-white/[0.055] p-7 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <p className="text-sm uppercase tracking-[0.22em] text-[#B88A44]">
              Accesso Athena
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight">
              Entra nel tuo briefing
            </h2>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="La tua email"
              className="mt-7 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none placeholder:text-neutral-600 focus:border-[#B88A44]/40"
            />

            <button
              onClick={login}
              className="mt-3 w-full rounded-2xl bg-[#B88A44] px-4 py-4 font-medium text-black transition hover:bg-[#C59A52]"
            >
              Ricevi magic link
            </button>

            {message && <p className="mt-4 text-sm leading-6 text-neutral-400">{message}</p>}
          </motion.div>
        </section>
      </div>
    </main>
  )
}
