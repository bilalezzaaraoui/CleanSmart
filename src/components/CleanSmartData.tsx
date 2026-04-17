import React from 'react'

interface CleanSmartDataProps {
  data: unknown
}

/**
 * Page affichée après une soumission réussie.
 * Reproduit la même mise en page que CleanSmartForm (card, logo, tagline).
 * Le contenu de la card sera complété ultérieurement avec les données reçues.
 */
const CleanSmartData: React.FC<CleanSmartDataProps> = ({ data: _data }) => {
  return (
    <div className="py-6 flex flex-col items-center gap-3 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">
        ✓
      </span>
      <p className="text-sm font-semibold text-gray-800">Traitement réussi !</p>
      <p className="text-xs text-gray-400">Les données seront affichées ici.</p>
    </div>
  )
}

export default CleanSmartData
