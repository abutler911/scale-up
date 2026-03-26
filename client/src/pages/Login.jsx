import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, verified } = useAuth()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (verified) { navigate('/'); return null }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(pin)
      navigate('/')
    } catch {
      setError('Incorrect PIN. Try again.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎹</div>
          <h1 className="font-display text-3xl text-stone-900">ScaleUp!</h1>
          <p className="text-stone-400 text-sm mt-2">Enter your PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              className="input text-center text-xl tracking-widest"
              placeholder="••••"
              value={pin}
              onChange={e => setPin(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
