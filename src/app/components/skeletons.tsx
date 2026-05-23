'use client'

function AthenaPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-white/[0.035]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,154,82,0.16),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.14),transparent_50%)]" />
      <div className="absolute inset-y-0 -left-1/2 w-1/2 animate-[athenaScan_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#B88A44]/12 bg-black/35 backdrop-blur-xl">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 border-b border-white/[0.06] p-5 last:border-b-0 md:grid-cols-[112px_1fr_120px]"
        >
          <AthenaPulse className="hidden h-24 rounded-2xl md:block" />

          <div>
            <AthenaPulse className="mb-3 h-3 w-40 rounded-full" />
            <AthenaPulse className="h-5 w-full rounded-full" />
            <AthenaPulse className="mt-3 h-5 w-4/5 rounded-full" />
            <AthenaPulse className="mt-4 h-3 w-full rounded-full" />
            <AthenaPulse className="mt-2 h-3 w-2/3 rounded-full" />
          </div>

          <div className="flex justify-end">
            <AthenaPulse className="h-12 w-28 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-[2.5rem] border border-[#B88A44]/14 bg-black/45 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <AthenaPulse className="absolute inset-0" />

      <div className="absolute inset-0 flex flex-col justify-between p-7 md:p-10">
        <div className="flex justify-between">
          <AthenaPulse className="h-8 w-44 rounded-full" />
          <AthenaPulse className="h-12 w-12 rounded-2xl" />
        </div>

        <div>
          <AthenaPulse className="mb-5 h-4 w-40 rounded-full" />
          <AthenaPulse className="h-12 w-4/5 rounded-full" />
          <AthenaPulse className="mt-4 h-12 w-3/5 rounded-full" />
          <AthenaPulse className="mt-8 h-4 w-2/3 rounded-full" />
          <AthenaPulse className="mt-3 h-4 w-1/2 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function MetricsSkeleton() {
  return (
    <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <AthenaPulse
          key={index}
          className="min-h-[142px] rounded-[1.7rem] border border-[#B88A44]/12 bg-black/35"
        />
      ))}
    </section>
  )
}