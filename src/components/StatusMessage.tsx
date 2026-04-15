import React from 'react'

interface StatusMessageProps {
  isSuccess: boolean
  isError: boolean
  errorMessage: string | null
  onReset: () => void
}

/**
 * Displays feedback after the form submission:
 * a success banner or an error banner with the error detail.
 */
const StatusMessage: React.FC<StatusMessageProps> = ({ isSuccess, isError, errorMessage, onReset }) => {
  if (!isSuccess && !isError) return null

  return (
    <div
      role="alert"
      className={`mt-6 rounded-xl p-4 flex items-start gap-3 text-sm ${
        isSuccess
          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          : 'bg-red-50 border border-red-200 text-red-800'
      }`}
    >
      <span className="text-lg leading-none mt-0.5" aria-hidden="true">
        {isSuccess ? '✅' : '❌'}
      </span>
      <div className="flex-1">
        {isSuccess ? (
          <p className="font-semibold">Workflow déclenché avec succès !</p>
        ) : (
          <>
            <p className="font-semibold">Une erreur est survenue</p>
            {errorMessage && <p className="mt-1 opacity-80">{errorMessage}</p>}
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-xs underline opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
      >
        Fermer
      </button>
    </div>
  )
}

export default StatusMessage
