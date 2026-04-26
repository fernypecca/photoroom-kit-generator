// app/insights/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { getStats } from '@/lib/ab'

export default function InsightsPage() {
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null)

  useEffect(() => {
    setStats(getStats())
  }, [])

  if (!stats) return null

  const { A, B, significance } = stats
  const totalVisits = A.visits + B.visits
  const aRate = A.visits > 0 ? ((A.generates / A.visits) * 100).toFixed(1) : '—'
  const bRate = B.visits > 0 ? ((B.generates / B.visits) * 100).toFixed(1) : '—'

  return (
    <div className="min-h-screen bg-white text-gray-900 px-6 py-16 max-w-2xl mx-auto">
      <div className="text-xs uppercase tracking-widest text-gray-400 mb-4">Live experiment</div>
      <h1 className="text-3xl font-bold mb-2">What messaging actually works?</h1>
      <p className="text-gray-500 mb-12">
        We&apos;re running a live A/B test on this tool. Here&apos;s what we&apos;re learning in real time.
      </p>

      <div className="mb-8">
        <div className="text-sm text-gray-400 mb-4">The question we&apos;re testing</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="text-xs text-gray-400 mb-2">Utility message</div>
            <div className="font-semibold text-sm">&ldquo;Turn any product URL into a complete marketing kit&rdquo;</div>
            <div className="mt-4 text-2xl font-bold">{aRate}%</div>
            <div className="text-xs text-gray-400">generate rate</div>
          </div>
          <div className="border border-orange-200 rounded-xl p-5 bg-orange-50">
            <div className="text-xs text-gray-400 mb-2">Pain message</div>
            <div className="font-semibold text-sm">&ldquo;See how much you&apos;re losing with bad product photos&rdquo;</div>
            <div className="mt-4 text-2xl font-bold">{bRate}%</div>
            <div className="text-xs text-gray-400">generate rate</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <div className="text-xs text-gray-400 uppercase mb-1">Current signal</div>
        <div className="font-semibold">{significance}</div>
        <div className="text-sm text-gray-400 mt-1">{totalVisits} total visits so far</div>
      </div>

      <p className="text-sm text-gray-400">
        Hypothesis: loss-aversion messaging drives higher engagement than utility framing for SMB sellers.
        We&apos;ll update this page as the experiment runs.
      </p>
    </div>
  )
}
