import React, { useState } from 'react'
import CleanSmartForm from './components/CleanSmartForm'
import CleanSmartData from './components/CleanSmartData'

type View = 'form' | 'data'

const App: React.FC = () => {
  const [view, setView] = useState<View>('form')
  const [responseData, setResponseData] = useState<unknown>(null)

  const handleSuccess = (data: unknown) => {
    setResponseData(data)
    setView('data')
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
            <CleanSmartData data={responseData} />
          )}
        </div>

        {/* Tagline — texte noir */}
        <p className="text-center text-sm font-semibold text-gray-900 pb-5 px-6">
          ❤️ Nique Andrey forever
        </p>
      </div>
    </div>
  )
}

export default App
