import { motion } from 'framer-motion'
import { BackgroundGlow, Brand } from './ui'

export function LoginView({ email, setEmail, message, login }: any) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <BackgroundGlow />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <section className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <Brand />

            <div className="mt-12 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-400">
              AI-curated news intelligence
            </div>

            <h1 className="mt-8 max-w-4xl text-6xl font-semibold leading-[0.9] tracking-[-0.08em] text-white md:text-8xl">
              Leggi meno.
              <br />
              Capisci di più.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-400">
              SignalFeed trasforma le tue fonti in una rassegna AI elegante, intelligente e senza rumore.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <p className="text-sm text-neutral-400">Accesso privato</p>
            <h2 className="mt-2 text-3xl font-medium tracking-tight">Entra nella tua rassegna</h2>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="La tua email"
              className="mt-7 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none placeholder:text-neutral-600 focus:border-white/30"
            />

            <button
              onClick={login}
              className="mt-3 w-full rounded-2xl bg-white px-4 py-4 font-medium text-black transition hover:bg-neutral-200"
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
