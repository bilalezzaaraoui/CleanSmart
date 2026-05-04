import React, { useRef, useState } from 'react'

type AgentName = 'Bilal' | 'Younes'
type TypeContact = 'Agence' | 'Mandataire'
type ShowStatut = 'À compléter' | 'RDV Show' | 'No Show'

interface Rdv {
  id: string
  urlLead: string
  nom: string
  date: string
  heure: string
  agent: AgentName
  showStatut: ShowStatut
  commentaire: string
  createdAt: string
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

const SHOW_STATUT_COLORS: Record<ShowStatut, string> = {
  'À compléter': 'bg-gray-100 text-gray-500',
  'RDV Show': 'bg-green-100 text-green-700',
  'No Show': 'bg-red-100 text-red-600',
}

function PencilIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.768-6.768a2 2 0 112.828 2.828L11.828 13.828A2 2 0 0111 14.414l-3 .586.586-3A2 2 0 019 11z" />
    </svg>
  )
}

function LeadLink({ url }: { url: string }) {
  if (!url) return <span className="text-gray-300">—</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[#1B7ED4] hover:text-[#1569B8] transition-colors"
      title={url}
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      Voir
    </a>
  )
}

// Inline editable cell — shows value + pencil; clicking pencil opens an input
function EditableCell({
  value,
  type,
  onSave,
  displayClass = 'text-gray-500',
}: {
  value: string
  type: 'date' | 'time' | 'text'
  onSave: (v: string) => void
  displayClass?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => {
    setDraft(value)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const commit = () => {
    onSave(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="w-full rounded border border-[#1B7ED4] px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-[#1B7ED4]/20"
      />
    )
  }

  return (
    <span className="flex items-center gap-1 group">
      <span className={displayClass}>{value || '—'}</span>
      <button
        type="button"
        onClick={open}
        className="text-gray-300 hover:text-[#1B7ED4] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
        title="Modifier"
      >
        <PencilIcon />
      </button>
    </span>
  )
}

function ShowStatutCell({
  id,
  showStatut,
  onUpdate,
}: {
  id: string
  showStatut: ShowStatut
  onUpdate: (id: string, s: ShowStatut) => void
}) {
  return (
    <select
      value={showStatut}
      onChange={(e) => onUpdate(id, e.target.value as ShowStatut)}
      className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 outline-none cursor-pointer ${SHOW_STATUT_COLORS[showStatut]}`}
    >
      <option>À compléter</option>
      <option>RDV Show</option>
      <option>No Show</option>
    </select>
  )
}

const today = todayISO()
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]

const FAKE_DATA: Rdv[] = [
  { id: 'f1', urlLead: 'https://www.leboncoin.fr/annonces/12345', nom: 'Marie Dupont', date: today, heure: '09:30', agent: 'Bilal', showStatut: 'À compléter', commentaire: '', createdAt: '' },
  { id: 'f2', urlLead: 'https://www.seloger.com/annonces/67890', nom: 'Thomas Martin', date: today, heure: '11:00', agent: 'Bilal', showStatut: 'À compléter', commentaire: '', createdAt: '' },
  { id: 'f3', urlLead: 'https://www.pap.fr/annonces/11111', nom: 'Sophie Lemaire', date: today, heure: '14:30', agent: 'Bilal', showStatut: 'À compléter', commentaire: '', createdAt: '' },
  { id: 'f4', urlLead: 'https://www.leboncoin.fr/annonces/22222', nom: 'Paul Bernard', date: yesterday, heure: '10:00', agent: 'Bilal', showStatut: 'No Show', commentaire: '', createdAt: '' },
  { id: 'f5', urlLead: 'https://www.pap.fr/annonces/99999', nom: 'Julie Moreau', date: twoDaysAgo, heure: '15:00', agent: 'Bilal', showStatut: 'No Show', commentaire: '', createdAt: '' },
  { id: 'f6', urlLead: 'https://www.seloger.com/annonces/33333', nom: 'Karim Idrissi', date: today, heure: '10:00', agent: 'Younes', showStatut: 'À compléter', commentaire: '', createdAt: '' },
  { id: 'f7', urlLead: 'https://www.pap.fr/annonces/44444', nom: 'Nadia Benali', date: today, heure: '16:00', agent: 'Younes', showStatut: 'À compléter', commentaire: '', createdAt: '' },
  { id: 'f8', urlLead: 'https://www.leboncoin.fr/annonces/55555', nom: 'Samir Chaoui', date: yesterday, heure: '09:00', agent: 'Younes', showStatut: 'No Show', commentaire: '', createdAt: '' },
]

const RdvDuJour: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<AgentName>('Bilal')
  const [rdvList, setRdvList] = useState<Rdv[]>(FAKE_DATA)
  const [view, setView] = useState<'main' | 'dashboard'>('main')
  const [noshowSearch, setNoshowSearch] = useState('')
  const [dashSearch, setDashSearch] = useState('')

  const [typeContact, setTypeContact] = useState<TypeContact | null>(null)
  const [urlLead, setUrlLead] = useState('')
  const [nom, setNom] = useState('')
  const [date, setDate] = useState(todayISO())
  const [heure, setHeure] = useState('')

  const filtered = rdvList.filter((r) => r.agent === activeAgent)
  const rdvAujourdhui = filtered.filter((r) => r.date === today)
  const noshowList = filtered
    .filter((r) => r.showStatut === 'No Show')
    .filter((r) => r.nom.toLowerCase().includes(noshowSearch.toLowerCase()))

  const isValid = nom.trim() !== '' && heure !== ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setRdvList((prev) => [
      {
        id: uid(),
        urlLead: urlLead.trim(),
        nom: nom.trim(),
        date,
        heure,
        agent: activeAgent,
        showStatut: 'À compléter',
        commentaire: '',
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
    setTypeContact(null)
    setUrlLead('')
    setNom('')
    setDate(todayISO())
    setHeure('')
  }

  const updateField = (id: string, field: keyof Rdv, value: string) =>
    setRdvList((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))

  const updateShowStatut = (id: string, s: ShowStatut) =>
    setRdvList((prev) => prev.map((r) => (r.id === id ? { ...r, showStatut: s } : r)))

  // Barre commune aux deux vues
  const TopBar = (
    <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-0">
      <div className="flex w-48 rounded-xl border border-gray-200 bg-gray-100 p-1">
        {(['Bilal', 'Younes'] as AgentName[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setActiveAgent(a)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all cursor-pointer select-none ${
              activeAgent === a
                ? 'bg-[#1B7ED4] text-white shadow-sm'
                : 'bg-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setView((v) => v === 'main' ? 'dashboard' : 'main')}
        className="text-sm font-medium text-[#1B7ED4] hover:text-[#1569B8] hover:underline transition-colors cursor-pointer"
      >
        {view === 'main' ? 'Historique →' : '← Retour'}
      </button>
    </div>
  )

  if (view === 'dashboard') {
    const dashFiltered = rdvList
      .filter((r) => r.agent === activeAgent)
      .filter((r) =>
        r.nom.toLowerCase().includes(dashSearch.toLowerCase()) ||
        r.date.includes(dashSearch)
      )
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.heure.localeCompare(a.heure))

    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-gray-50">
        {TopBar}

        <div className="flex flex-1 flex-col gap-0 p-5 overflow-hidden">
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-[#1B7ED4] bg-white shadow-sm flex-1 flex flex-col min-h-0">
            <div className="border-b border-gray-100 px-5 py-3 shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <h2 className="text-sm font-semibold text-gray-800">Historique — {activeAgent}</h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-[#1B7ED4] font-medium">
                  {dashFiltered.length}
                </span>
              </div>
              <div className="relative max-w-64">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                </svg>
                <input
                  type="text"
                  value={dashSearch}
                  onChange={(e) => setDashSearch(e.target.value)}
                  placeholder="Rechercher par nom ou date…"
                  className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#1B7ED4] focus:ring-1 focus:ring-[#1B7ED4]/20 transition"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {dashFiltered.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  Aucun RDV trouvé
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Lien</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Nom du lead</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Heure</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Status du RDV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashFiltered.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-2.5"><LeadLink url={r.urlLead} /></td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{r.nom}</td>
                        <td className="px-4 py-2.5 text-gray-500">{r.date}</td>
                        <td className="px-4 py-2.5 text-gray-500">{r.heure}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SHOW_STATUT_COLORS[r.showStatut]}`}>
                            {r.showStatut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gray-50">
      {TopBar}

      {/* ── Colonnes ── */}
      <div className="flex flex-1 gap-4 p-5 overflow-hidden">

        {/* Colonne gauche */}
        <div className="flex w-[38%] flex-col gap-4 overflow-hidden">

          {/* Formulaire */}
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-[#1B7ED4] bg-white shadow-sm shrink-0">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Ajouter un RDV</h2>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              <div className="flex gap-2">
                {(['Agence', 'Mandataire'] as TypeContact[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeContact(t)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-all cursor-pointer select-none ${
                      typeContact === t
                        ? 'border-[#1B7ED4] bg-[#1B7ED4] text-white shadow-sm'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">URL du lead</label>
                <input
                  type="url"
                  value={urlLead}
                  onChange={(e) => setUrlLead(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B7ED4] focus:ring-1 focus:ring-[#1B7ED4]/20 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">Nom du lead</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B7ED4] focus:ring-1 focus:ring-[#1B7ED4]/20 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B7ED4] focus:ring-1 focus:ring-[#1B7ED4]/20 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">Heure</label>
                  <input
                    type="time"
                    value={heure}
                    onChange={(e) => setHeure(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1B7ED4] focus:ring-1 focus:ring-[#1B7ED4]/20 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isValid}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                  isValid
                    ? 'bg-[#1B7ED4] hover:bg-[#1569B8] text-white cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Ajouter le RDV
              </button>
            </form>
          </div>

          {/* RDV pris aujourd'hui */}
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-[#1B7ED4] bg-white shadow-sm flex-1 flex flex-col min-h-0">
            <div className="border-b border-gray-100 px-5 py-3 shrink-0 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">RDV pris aujourd'hui</h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-[#1B7ED4] font-medium">
                {rdvAujourdhui.length}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {rdvAujourdhui.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400 py-8">
                  Aucun RDV ajouté aujourd'hui
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Lien</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Nom du lead</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Heure</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rdvAujourdhui
                      .slice()
                      .sort((a, b) => a.heure.localeCompare(b.heure))
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-2"><LeadLink url={r.urlLead} /></td>
                          <td className="px-4 py-2 font-medium text-gray-800">{r.nom}</td>
                          <td className="px-4 py-2">
                            <EditableCell
                              value={r.date}
                              type="date"
                              onSave={(v) => updateField(r.id, 'date', v)}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <EditableCell
                              value={r.heure}
                              type="time"
                              onSave={(v) => updateField(r.id, 'heure', v)}
                            />
                          </td>
                          <td className="px-4 py-2 text-base">✅</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">

          {/* RDV du jour */}
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-[#1B7ED4] bg-white shadow-sm flex-1 flex flex-col min-h-0">
            <div className="border-b border-gray-100 px-5 py-3 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1B7ED4] animate-pulse" />
                <h2 className="text-sm font-semibold text-gray-800">RDV du jour</h2>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-[#1B7ED4] font-medium">
                {rdvAujourdhui.length}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {rdvAujourdhui.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400 py-8">
                  Aucun RDV prévu aujourd'hui
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Lien</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Nom du lead</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Status du rdv</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rdvAujourdhui
                      .slice()
                      .sort((a, b) => a.heure.localeCompare(b.heure))
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-2"><LeadLink url={r.urlLead} /></td>
                          <td className="px-4 py-2">
                            <span className="font-medium text-gray-800">{r.nom}</span>
                            <span className="block text-[#1B7ED4] font-semibold">{r.heure}</span>
                          </td>
                          <td className="px-4 py-2">
                            <ShowStatutCell id={r.id} showStatut={r.showStatut} onUpdate={updateShowStatut} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Liste des noshow */}
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-orange-400 bg-white shadow-sm flex-1 flex flex-col min-h-0">
            <div className="border-b border-gray-100 px-5 py-3 shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                <h2 className="text-sm font-semibold text-gray-800">Liste des noshow</h2>
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600 font-medium">
                  {noshowList.length}
                </span>
              </div>
              <div className="relative flex-1 max-w-55">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                </svg>
                <input
                  type="text"
                  value={noshowSearch}
                  onChange={(e) => setNoshowSearch(e.target.value)}
                  placeholder="Rechercher un lead…"
                  className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[#1B7ED4] focus:ring-1 focus:ring-[#1B7ED4]/20 transition"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {noshowList.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400 py-8">
                  {noshowSearch ? 'Aucun résultat' : 'Aucun no-show'}
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Lien</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Nom du lead</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Heure</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Reschedule</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Stop relance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {noshowList
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="px-4 py-2"><LeadLink url={r.urlLead} /></td>
                          <td className="px-4 py-2 font-medium text-gray-800">{r.nom}</td>
                          <td className="px-4 py-2">
                            <EditableCell
                              value={r.date}
                              type="date"
                              onSave={(v) => updateField(r.id, 'date', v)}
                              displayClass="text-orange-400 font-semibold"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <EditableCell
                              value={r.heure}
                              type="time"
                              onSave={(v) => updateField(r.id, 'heure', v)}
                              displayClass="text-orange-400 font-semibold"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              className="rounded-lg bg-[#1B7ED4] hover:bg-[#1569B8] active:scale-95 text-white px-3 py-1 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Reschedule
                            </button>
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              className="rounded-lg bg-red-500 hover:bg-red-600 active:scale-95 text-white px-3 py-1 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Stop relance
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RdvDuJour
