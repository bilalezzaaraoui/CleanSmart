import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface LoginGateProps {
  children: React.ReactNode
}

/**
 * Renders children only after successful authentication.
 * Until then, only the login screen is shown — the app tree is never mounted.
 */
const LoginGate: React.FC<LoginGateProps> = ({ children }) => {
  const { isAuthenticated, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shaking, setShaking] = useState(false)

  if (isAuthenticated) {
    return <>{children}</>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const ok = login(username.trim(), password)
    if (!ok) {
      setError('Identifiants incorrects')
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      setPassword('')
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: '#1B7ED4' }}
    >
      <div
        className={`w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden
          ${shaking ? 'animate-shake' : ''}`}
      >
        {/* Logo */}
        <div className="flex flex-col items-center pt-7 pb-1 px-6">
          <img
            src="/logo.png"
            alt="CleanSmart logo"
            className="h-20 w-auto object-contain"
          />
        </div>

        <div className="h-px bg-gray-100 mx-5 mt-4" />

        <form onSubmit={handleSubmit} noValidate className="px-5 pt-5 pb-5 space-y-3">
          {/* Username */}
          <div className="space-y-1">
            <label htmlFor="cs-username" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Identifiant
            </label>
            <input
              id="cs-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(null) }}
              placeholder="admin"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                text-gray-800 placeholder-gray-300 outline-none transition
                focus:border-[#1B7ED4] focus:ring-2 focus:ring-[#1B7ED4]/20"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="cs-password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="cs-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null) }}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm
                  text-gray-800 placeholder-gray-300 outline-none transition
                  focus:border-[#1B7ED4] focus:ring-2 focus:ring-[#1B7ED4]/20"
              />
              {/* Toggle visibility */}
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-gray-500 transition-colors"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.02 0 2 .16 2.92.46M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 font-medium text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!username || !password}
            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]
              ${username && password
                ? 'bg-[#1B7ED4] hover:bg-[#1569B8] active:bg-[#1260AA] text-white cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            Connexion
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.5s ease; }
      `}</style>
    </div>
  )
}

export default LoginGate
