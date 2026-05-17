'use client'

export function FeedSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/[0.07] bg-white/[0.025]">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 border-b border-white/[0.06] p-5 md:grid-cols-[112px_1fr_120px]"
        >
          <div className="hidden h-24 animate-pulse rounded-2xl bg-white/[0.05] md:block" />

          <div>
            <div className="mb-3 h-3 w-40 animate-pulse rounded-full bg-white/[0.05]" />

            <div className="h-5 w-full animate-pulse rounded-full bg-white/[0.05]" />

            <div className="mt-3 h-5 w-4/5 animate-pulse rounded-full bg-white/[0.05]" />

            <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-white/[0.04]" />

            <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-white/[0.04]" />
          </div>

          <div className="flex justify-end">
            <div className="h-12 w-28 animate-pulse rounded-2xl bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="min-h-[560px] animate-pulse rounded-[2.5rem] border border-white/[0.08] bg-white/[0.03]" />
  )
}

export function MetricsSkeleton() {
  return (
    <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[145px] animate-pulse rounded-[1.7rem] border border-white/[0.07] bg-white/[0.03]"
        />
      ))}
    </section>
  )
}