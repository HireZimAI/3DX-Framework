'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', industry: '', notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) router.push('/admin/clients')
    else setLoading(false)
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to clients
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Add Client</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        {[
          { key: 'company', label: 'Company Name *', required: true, placeholder: 'e.g. Acme Corp' },
          { key: 'name', label: 'Contact Name *', required: true, placeholder: 'e.g. Jane Smith' },
          { key: 'email', label: 'Email *', required: true, type: 'email', placeholder: 'jane@acme.com' },
          { key: 'phone', label: 'Phone', placeholder: '+1 555-0100' },
          { key: 'industry', label: 'Industry', placeholder: 'e.g. Technology' },
        ].map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
            <input
              type={field.type ?? 'text'}
              required={field.required}
              placeholder={field.placeholder}
              value={form[field.key as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              className={inputClass}
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className={`${inputClass} h-24 resize-none`}
            placeholder="Internal notes about this client..."
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Link href="/admin/clients" className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-medium">
            {loading ? 'Adding...' : 'Add Client'}
          </button>
        </div>
      </form>
    </div>
  )
}
