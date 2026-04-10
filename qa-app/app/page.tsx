'use client'
import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [viewport, setViewport] = useState('1440')
  const [figma, setFigma] = useState<File | null>(null)
  const [figmaName, setFigmaName] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('compare')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFigma(f)
    setFigmaName(f.name)
  }

  const runQA = async () => {
    if (!url) { setError('Please enter a Shopify URL'); return }
    if (!figma) { setError('Please upload a Figma image'); return }
    setError('')
    setLoading(true)
    setResult(null)

    const msgs = [
      'Launching headless browser...',
      'Navigating to Shopify page...',
      'Capturing screenshot...',
      'Comparing with Figma design...',
      'Generating report...',
    ]
    let i = 0
    const t = setInterval(() => {
      if (i < msgs.length) setLoadingMsg(msgs[i++])
    }, 1800)

    try {
      const fd = new FormData()
      fd.append('url', url)
      fd.append('viewport', viewport || '1440')
      fd.append('figma', figma)
      const res = await fetch('/api/compare', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); clearInterval(t); return }
      setResult(data)
    } catch (e) {
      setError('Something went wrong. Please try again.')
    }
    clearInterval(t)
    setLoading(false)
  }

  const reset = () => { setResult(null); setUrl(''); setFigma(null); setFigmaName(''); setError(''); setActiveTab('compare') }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">🎯 Design QA Tool</h1>
        <p className="text-gray-500 mt-1">Compare your Figma design to a live Shopify page — get a visual diff instantly</p>
      </div>

      {/* Input form */}
      {!result && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Shopify page URL</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourstore.myshopify.com/products/your-product"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Viewport width (px)</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1440 for desktop · 375 for mobile"
              value={viewport}
              onChange={e => setViewport(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Figma design export (PNG or JPG)</label>
            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
              <div className="text-3xl mb-2">📁</div>
              <p className="text-sm text-gray-600">{figmaName || 'Click to upload your Figma export'}</p>
              <p className="text-xs text-gray-400 mt-1">PNG or JPG, up to 10MB</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}
          <button
            onClick={runQA}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            🚀 Run QA Comparison
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="inline-block w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-medium">{loadingMsg}</p>
          <p className="text-gray-400 text-sm mt-1">This may take 15–30 seconds</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Score cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Match Score', value: result.matchScore + '%', color: result.matchScore >= 90 ? 'text-green-600' : result.matchScore >= 70 ? 'text-yellow-600' : 'text-red-500' },
              { label: 'Result', value: result.passed ? '✅ PASS' : '❌ FAIL', color: result.passed ? 'text-green-600' : 'text-red-500' },
              { label: 'Diff Pixels', value: result.diffPixels.toLocaleString(), color: 'text-gray-800' },
              { label: 'Threshold', value: '≥ 90% pass', color: 'text-gray-500' },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
                <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                <p className={`text-2xl font-semibold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {['compare', 'heatmap'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${activeTab === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
              >
                {t === 'compare' ? '🖼 Side by side' : '🔥 Diff heatmap'}
              </button>
            ))}
          </div>

          {/* Side by side */}
          {activeTab === 'compare' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-600 mb-3">🎨 Figma Design</p>
                <img src={result.figmaImage} className="w-full rounded-xl border border-gray-100" alt="Figma design" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-600 mb-3">🛍 Shopify Live Page</p>
                <img src={result.shopifyScreenshot} className="w-full rounded-xl border border-gray-100" alt="Shopify screenshot" />
              </div>
            </div>
          )}

          {/* Heatmap */}
          {activeTab === 'heatmap' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-1">🔥 Difference Heatmap</p>
              <p className="text-xs text-gray-400 mb-3">White = identical · Red/colored = different pixels</p>
              <img src={result.diffImage} className="w-full rounded-xl border border-gray-100" alt="Diff heatmap" />
            </div>
          )}

          <button onClick={reset} className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            ← Run another comparison
          </button>
        </div>
      )}
    </main>
  )
}
