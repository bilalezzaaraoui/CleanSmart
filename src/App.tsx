import React, { useEffect, useState } from 'react'
import CleanSmartForm from './components/CleanSmartForm'
import CleanSmartData from './components/CleanSmartData'

type View = 'form' | 'data'
type AgencyType = 'Mandataire' | 'Agence'
type AgentName = 'Bilal' | 'Younes'

const SESSION_KEY = 'cleansmart_executionId'

const App: React.FC = () => {
  const [view, setView] = useState<View>('form')
  const [agencyType, setAgencyType] = useState<AgencyType | null>(null)
  const [agent, setAgent] = useState<AgentName | null>(null)
  const [executionId, setExecutionId] = useState<string | null>(null)

  /**
   * On mount, check if a previous execution was left dangling (e.g. the user
   * refreshed mid-run and the pagehide beacon failed). If so, stop it silently
   * and clear the stored ID so it doesn't linger across future sessions.
   */
  useEffect(() => {
    const danglingId = sessionStorage.getItem(SESSION_KEY)
    if (!danglingId) return
    sessionStorage.removeItem(SESSION_KEY)
    fetch('/api/stop-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ executionId: danglingId }),
    }).catch(() => {
      // Best-effort: ignore errors since the execution may have already finished
    })
  }, [])

  const handleSuccess = (_data: unknown, type: AgencyType, name: AgentName, execId: string | null) => {
    setAgencyType(type)
    setAgent(name)
    setExecutionId(execId)
    // Persist so the fallback auto-stop can fire if the page reloads
    if (execId) sessionStorage.setItem(SESSION_KEY, execId)
    setView('data')
  }

  const handleReset = () => {
    setAgencyType(null)
    setAgent(null)
    setExecutionId(null)
    sessionStorage.removeItem(SESSION_KEY)
    setView('form')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: '#1B7ED4' }}
    >
      {/* Card — liseré léger + shadow prononcée comme dans le screenshot */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

        {/* Logo */}
        <div className="flex flex-col items-center pt-7 px-6">
          <img
            src="/logo.png"
            alt="CleanSmart logo"
            className="h-20 w-auto object-contain"
          />
        </div>

        {/* Divider fin */}
        <div className="h-px bg-gray-100 mx-5" />

        {/* Contenu : formulaire ou données */}
        <div className="px-5 pt-4 pb-5">
          {view === 'form' ? (
            <CleanSmartForm onSuccess={handleSuccess} />
          ) : (
            <CleanSmartData
              agencyType={agencyType!}
              agent={agent!}
              executionId={executionId}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Tagline — texte noir */}
        <p className="text-center text-sm font-semibold text-gray-900 pb-5 px-6">
          🚀 Chaque lead compte. Vas-y.
        </p>
      </div>
    </div>
  )
}

export default App
