// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { getStats } from '@/lib/ab'

export default function AdminPage() {
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null)

  useEffect(() => {
    setStats(getStats())
  }, [])

  if (!stats) return <div className="p-8 text-gray-500">Loading...</div>

  const { A, B, significance } = stats
  const aRate  = A.visits > 0 ? ((A.generates  / A.visits) * 100).toFixed(1) : '—'
  const bRate  = B.visits > 0 ? ((B.generates  / B.visits) * 100).toFixed(1) : '—'
  const aClick = A.visits > 0 ? ((A.cta_clicks / A.visits) * 100).toFixed(1) : '—'
  const bClick = B.visits > 0 ? ((B.cta_clicks / B.visits) * 100).toFixed(1) : '—'

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-mono">
      <h1 className="text-2xl font-bold mb-2">A/B Test Dashboard</h1>
      <p className="text-gray-400 text-sm mb-8">Kit Generator — Messaging experiment</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-xs text-gray-500 uppercase mb-1">Variant A</div>
          <div className="text-lg font-semibold mb-4 text-blue-400">&ldquo;Turn any URL into a marketing kit&rdquo;</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Visits</span><span>{A.visits}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Generations</span><span>{A.generates}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">CTA clicks</span><span>{A.cta_clicks}</span></div>
            <div className="flex justify-between border-t border-gray-800 pt-2 mt-2"><span className="text-gray-400">Generate rate</span><span className="font-bold">{aRate}%</span></div>
            <div className="flex justify-between"><span className="text-gray-400">CTA rate</span><span className="font-bold">{aClick}%</span></div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-xs text-gray-500 uppercase mb-1">Variant B</div>
          <div className="text-lg font-semibold mb-4 text-orange-400">&ldquo;See how much you&apos;re losing with bad photos&rdquo;</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Visits</span><span>{B.visits}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Generations</span><span>{B.generates}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">CTA clicks</span><span>{B.cta_clicks}</span></div>
            <div className="flex justify-between border-t border-gray-800 pt-2 mt-2"><span className="text-gray-400">Generate rate</span><span className="font-bold">{bRate}%</span></div>
            <div className="flex justify-between"><span className="text-gray-400">CTA rate</span><span className="font-bold">{bClick}%</span></div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-yellow-800 rounded-xl p-6">
        <div className="text-xs text-yellow-600 uppercase mb-1">Significance</div>
        <div className="text-lg">{significance}</div>
        {(A.visits < 50 || B.visits < 50) && (
          <div className="text-sm text-gray-500 mt-2">
            A: {A.visits}/50 visits — B: {B.visits}/50 visits
          </div>
        )}
      </div>

      <button
        onClick={() => {
          localStorage.removeItem('ab_events')
          localStorage.removeItem('ab_variant')
          setStats(getStats())
        }}
        className="mt-6 text-xs text-gray-600 hover:text-gray-400 underline"
      >
        Reset data (testing only)
      </button>
    </div>
  )
}
