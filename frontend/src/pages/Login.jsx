import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import api from '../services/api'

const DEFAULT_BG = '/Dr_Beltran.jpg'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [branding, setBranding] = useState({ name: 'My_Dr', logoUrl: null, loginBgUrl: null, loginBgPosition: 'top center', primaryColor: null })
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const clinicId = import.meta.env.VITE_CLINIC_ID
    api.get('/clinics/public/branding', { params: clinicId ? { clinicId } : {} })
      .then(res => setBranding(res.data))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError(`Error de red: No se pudo conectar al servidor`)
      } else {
        setError(err.response?.data?.error || err.message || 'Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  const bgImage = branding.loginBgUrl || DEFAULT_BG
  const bgPosition = branding.loginBgPosition || 'top center'
  const accentColor = branding.primaryColor || '#06b6d4'
  const overlayOpacity = branding.loginOverlayOpacity ?? 45
  const cardBlur = branding.loginCardBlur ?? 20

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: bgPosition,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlayOpacity / 100})` }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-6">
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: `blur(${cardBlur}px)`,
            WebkitBackdropFilter: `blur(${cardBlur}px)`,
            border: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          {/* Logo / Header */}
          <div className="text-center mb-10">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.name}
                className="h-16 mx-auto mb-4 object-contain drop-shadow-lg"
              />
            ) : (
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-white text-2xl font-extrabold shadow-lg"
                style={{ background: 'rgba(255,255,255,0.20)' }}
              >
                +
              </div>
            )}
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {branding.name}
            </h1>
            <p className="text-white/55 text-sm mt-1 font-medium tracking-wide uppercase">
              Portal Médico
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-2 text-red-200 text-sm bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                required
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 text-white text-sm placeholder-white/45 outline-none transition-all rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1.5px solid rgba(255,255,255,0.20)',
                }}
                onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.18)'; e.target.style.borderColor = accentColor }}
                onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.borderColor = 'rgba(255,255,255,0.20)' }}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                autoComplete="current-password"
                className="w-full pl-11 pr-11 py-3 text-white text-sm placeholder-white/45 outline-none transition-all rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1.5px solid rgba(255,255,255,0.20)',
                }}
                onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.18)'; e.target.style.borderColor = accentColor }}
                onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.borderColor = 'rgba(255,255,255,0.20)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/80 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 rounded-xl text-white tracking-widest text-sm uppercase transition-all duration-200 shadow-lg active:scale-95 mt-2"
              style={{
                background: loading ? 'rgba(6,182,212,0.6)' : accentColor,
                boxShadow: `0 8px 24px ${accentColor}55`,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
                  Autenticando...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/35 text-xs mt-6 tracking-wide">
          © {new Date().getFullYear()} My_Dr · Plataforma Médica Segura
        </p>
      </div>
    </div>
  )
}
