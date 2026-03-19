'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Client { id: string; company: string; name: string }
interface User { id: string; name: string; role: string }

export default function NewProjectPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [podLeads, setPodLeads] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    clientId: '',
    podLeadId: '',
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: '',
    priority: 'MEDIUM',
    notes: '',
    diagnoseDays: 14,
    designDays: 21,
    deployDays: 28,
    executeDays: 21,
  })

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients)
    fetch('/api/users').then(r => r.json()).then(setPodLeads)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        clientId: form.clientId,
        podLeadId: form.podLeadId || undefined,
        startDate: form.startDate,
        targetEndDate: form.targetEndDate,
        priority: form.priority,
        notes: form.notes,
        phases: [form.diagnoseDays, form.designDays, form.deployDays, form.executeDays],
      }),
    })

    if (res.ok) {
      const project = await res.json()
      router.push(`/admin/projects/${project.id}`)
    } else {
      setLoading(false)
    }
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  )

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3">
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Project</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Project Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider text-slate-400">Project Info</h2>

          <Field label="Project Name *">
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="e.g. CRM Implementation" />
          </Field>

          <Field label="Description">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputClass} h-24 resize-none`} placeholder="Brief project description..." />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Client *">
              <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className={inputClass}>
                <option value="">Select client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
              </select>
            </Field>
            <Field label="Pod Lead">
              <select value={form.podLeadId} onChange={e => setForm(f => ({ ...f, podLeadId: e.target.value }))} className={inputClass}>
                <option value="">Unassigned</option>
                {podLeads.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date *">
              <input required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Target End Date *">
              <input required type="date" value={form.targetEndDate} onChange={e => setForm(f => ({ ...f, targetEndDate: e.target.value }))} className={inputClass} />
            </Field>
          </div>

          <Field label="Priority">
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={inputClass}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </Field>
        </div>

        {/* Phase Durations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider text-slate-400">Phase Durations (days)</h2>
            <p className="text-xs text-slate-400 mt-1">Phases will be scheduled sequentially starting from the start date.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'diagnoseDays', label: 'Diagnose', color: 'text-purple-600' },
              { key: 'designDays', label: 'Design', color: 'text-blue-600' },
              { key: 'deployDays', label: 'Deploy', color: 'text-orange-600' },
              { key: 'executeDays', label: 'Execute', color: 'text-green-600' },
            ].map(({ key, label, color }) => (
              <Field key={key} label={<span className={color}>{label}</span> as unknown as string}>
                <input
                  type="number" min={1} max={365}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  className={inputClass}
                />
              </Field>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <Field label="Internal Notes">
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputClass} h-20 resize-none`} placeholder="Internal notes about this project..." />
          </Field>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/admin/projects" className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-medium transition-colors">
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  )
}
