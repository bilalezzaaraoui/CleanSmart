import React, { useState, useRef } from 'react'
import { useN8nWebhook } from '../hooks/useN8nWebhook'
import StatusMessage from './StatusMessage'

type AgencyType = 'Mandataire' | 'Agence'
type AgentName = 'Bilal' | 'Younes'

// Expected CSV headers per type (lowercase, trimmed)
const REQUIRED_COLUMNS: Record<string, string[]> = {
  mandataire: ['link_close', 'name', 'num_tel', 'network'],
  agence: ['link_close', 'name', 'num_tel'],
}

/**
 * Parses the first line of a CSV and validates that it contains exactly
 * the required columns for the given type — no more, no less.
 * Returns an error string or null if valid.
 */
function validateCsvColumns(csvText: string, type: string): string | null {
  const firstLine = csvText.split(/\r?\n/)[0] ?? ''

  // Detect separator (comma or semicolon)
  const separator = firstLine.includes(';') ? ';' : ','
  const headers = firstLine
    .split(separator)
    .map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase())

  const required = REQUIRED_COLUMNS[type] ?? []
  const missing = required.filter((col) => !headers.includes(col))
  const extra = headers.filter((col) => !required.includes(col))

  if (missing.length === 0 && extra.length === 0) return null

  const parts: string[] = []
  if (missing.length > 0)
    parts.push(`Colonne(s) manquante(s) : ${missing.map((c) => `"${c}"`).join(', ')}`)
  if (extra.length > 0)
    parts.push(`Colonne(s) en trop : ${extra.map((c) => `"${c}"`).join(', ')}`)
  return parts.join('\n')
}

interface CleanSmartFormProps {
  onSuccess: (data: unknown, agencyType: AgencyType, agent: AgentName, executionId: string | null) => void
}

const CleanSmartForm: React.FC<CleanSmartFormProps> = ({ onSuccess }) => {
  const [agencyType, setAgencyType] = useState<AgencyType | null>(null)
  const [agent, setAgent] = useState<AgentName | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { isLoading, isError, errorMessage, trigger, reset: resetWebhook } = useN8nWebhook()

  const isFormValid = Boolean(agencyType && agent && csvFile)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setCsvError(null)
    if (file && !file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Veuillez charger un fichier .csv')
      setCsvFile(null)
      return
    }
    setCsvFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !csvFile || !agencyType || !agent) return

    const csvContent = await csvFile.text()

    // Validate CSV columns before firing the request
    const columnError = validateCsvColumns(csvContent, agencyType.toLowerCase())
    if (columnError) {
      setCsvError(columnError)
      return
    }

    setCsvError(null)

    const result = await trigger({
      type: agencyType.toLowerCase(),
      user: agent.toLowerCase(),
      csv: csvContent,
    })

    if (result.ok) {
      onSuccess(result.data, agencyType, agent, result.executionId)
    }
  }

  const handleReset = () => {
    resetWebhook()
    setAgencyType(null)
    setAgent(null)
    setCsvFile(null)
    setCsvError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">

      {/* ── Section 1 : Agence / Mandataire ── */}
      <TabGroup<AgencyType>
        options={['Mandataire', 'Agence']}
        selected={agencyType}
        onSelect={setAgencyType}
      />

      {/* ── Section 2 : Bilal / Younes ── */}
      <TabGroup<AgentName>
        options={['Bilal', 'Younes']}
        selected={agent}
        onSelect={setAgent}
      />

      {/* ── Section 3 : CSV upload ── */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-full rounded-xl border-2 border-dashed px-4 py-3 text-sm
            transition-all cursor-pointer text-center
            ${csvFile
              ? 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
            }`}
        >
          {csvFile ? (
            <span className="flex items-center justify-center gap-2 text-emerald-700 font-medium">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold shrink-0">
                ✓
              </span>
              <span className="truncate max-w-[200px]">{csvFile.name}</span>
              <span className="text-emerald-500 text-xs shrink-0">
                ({(csvFile.size / 1024).toFixed(1)} Ko)
              </span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4 4 4" />
              </svg>
              Charger un CSV de leads
            </span>
          )}
        </button>

        {csvFile && (
          <button
            type="button"
            onClick={() => { setCsvFile(null); setCsvError(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
            className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors text-center"
          >
            ✕ Retirer le fichier
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* CSV column validation error — shown in red before sending */}
        {csvError && (
          <p className="text-xs text-red-500 leading-relaxed whitespace-pre-line font-bold">{csvError}</p>
        )}
      </div>

      {/* ── Section 4 : Bouton d'envoi ── */}
      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]
          ${isFormValid && !isLoading
            ? 'bg-[#1B7ED4] hover:bg-[#1569B8] active:bg-[#1260AA] text-white cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Envoi en cours…
          </span>
        ) : (
          "C'est parti"
        )}
      </button>

      {/* Webhook error response (status: ko or network failure) */}
      {isError && (
        <StatusMessage
          isSuccess={false}
          isError={isError}
          errorMessage={errorMessage}
          onReset={handleReset}
        />
      )}
    </form>
  )
}

/* ── Composant générique pour les groupes de tabs (Sections 1 & 2) ── */
interface TabGroupProps<T extends string> {
  options: [T, T]
  selected: T | null
  onSelect: (value: T) => void
}

function TabGroup<T extends string>({ options, selected, onSelect }: TabGroupProps<T>) {
  return (
    <div className="flex gap-1.5 rounded-xl border border-gray-200 bg-gray-100 p-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer select-none
            ${selected === opt
              ? 'bg-[#1B7ED4] text-white shadow-sm'
              : 'bg-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default CleanSmartForm
