import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProject } from '../context/ProjectContext'
import api from '../services/api'
import {
  User, Lock, Bell, Moon, Sun, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, Database, Trash2, Edit, Plus, Palette
} from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  )

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', newMode)
    document.documentElement.classList.toggle('dark', newMode)
  }

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'preferences', label: 'Preferencias', icon: Bell },
  ]
  
  if (user?.role === 'admin') {
    tabs.push({ id: 'branding', label: 'Branding', icon: Palette });
    tabs.push({ id: 'catalogs', label: 'Catálogos', icon: Database });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-500 dark:text-gray-400">Administra tu cuenta y preferencias</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="card p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'preferences' && (
            <PreferencesSettings darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          )}
          {activeTab === 'branding' && user?.role === 'admin' && <BrandingSettings />}
          {activeTab === 'catalogs' && user?.role === 'admin' && <CatalogsSettings />}
        </div>
      </div>
    </div>
  )
}

function ProfileSettings({ user }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')

    try {
      await api.put('/auth/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Información del Perfil
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Perfil actualizado correctamente
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Apellido
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Teléfono
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            className="input-field bg-gray-50 dark:bg-gray-700"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">El email no puede ser modificado</p>
        </div>

        <div className="pt-4">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <Save className="h-5 w-5" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

function SecuritySettings() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      setSuccess(true)
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Cambiar Contraseña
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800 rounded-xl flex flex-col items-center justify-center gap-2 text-center shadow-lg animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-1">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-green-800 dark:text-green-300 font-bold text-lg">¡Contraseña actualizada!</p>
            <p className="text-green-600 dark:text-green-400 text-sm font-medium">Tu nueva contraseña ha sido guardada correctamente.</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contraseña Actual
          </label>
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="input-field pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPasswords ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nueva Contraseña
          </label>
          <input
            type={showPasswords ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className="input-field"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirmar Nueva Contraseña
          </label>
          <input
            type={showPasswords ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div className="pt-4">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </div>
      </form>
    </div>
  )
}

function PreferencesSettings({ darkMode, toggleDarkMode }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [preferences, setPreferences] = useState({
    units: {
      weight: 'kg',
      height: 'cm',
      temperature: 'celsius',
      headCircumference: 'cm'
    },
    notifications: {
      emailReminders: true,
      reminderHoursBefore: 24,
      smsReminders: false
    },
    display: {
      language: 'es',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      theme: 'system'
    },
    consultation: {
      defaultFollowUpDays: 7,
      showGrowthCharts: true,
      showAISuggestions: true
    }
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/preferences')
      // Merge with defaults to ensure all values exist
      setPreferences(prev => ({
        units: { ...prev.units, ...response.data.units },
        notifications: { ...prev.notifications, ...response.data.notifications },
        display: { ...prev.display, ...response.data.display },
        consultation: { ...prev.consultation, ...response.data.consultation }
      }))
    } catch (error) {
      console.error('Error fetching preferences:', error)
    }
  }

  const savePreferences = async () => {
    setLoading(true)
    try {
      await api.put('/preferences', preferences)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = (section, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Units Configuration */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Unidades de Medida
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Peso
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updatePreference('units', 'weight', 'kg')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  preferences.units.weight === 'kg'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                Kilogramos (kg)
              </button>
              <button
                onClick={() => updatePreference('units', 'weight', 'lb')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  preferences.units.weight === 'lb'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                Libras (lb)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Altura / Talla
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updatePreference('units', 'height', 'cm')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  preferences.units.height === 'cm'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                Centímetros (cm)
              </button>
              <button
                onClick={() => updatePreference('units', 'height', 'in')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  preferences.units.height === 'in'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                Pulgadas (in)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Temperatura
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updatePreference('units', 'temperature', 'celsius')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  preferences.units.temperature === 'celsius'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                Celsius (°C)
              </button>
              <button
                onClick={() => updatePreference('units', 'temperature', 'fahrenheit')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  preferences.units.temperature === 'fahrenheit'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                Fahrenheit (°F)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Perímetro Cefálico
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updatePreference('units', 'headCircumference', 'cm')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  preferences.units.headCircumference === 'cm'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                Centímetros (cm)
              </button>
              <button
                onClick={() => updatePreference('units', 'headCircumference', 'in')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  preferences.units.headCircumference === 'in'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                Pulgadas (in)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Visualización
        </h2>

        <div className="space-y-6">
          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Modo Oscuro</p>
              <p className="text-sm text-gray-500">Cambia entre tema claro y oscuro</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                darkMode ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform flex items-center justify-center ${
                  darkMode ? 'translate-x-8' : 'translate-x-1'
                }`}
              >
                {darkMode ? (
                  <Moon className="h-3 w-3 text-primary-600" />
                ) : (
                  <Sun className="h-3 w-3 text-yellow-500" />
                )}
              </span>
            </button>
          </div>

          {/* Time Format */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Formato de Hora</p>
              <p className="text-sm text-gray-500">12 horas (AM/PM) o 24 horas</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updatePreference('display', 'timeFormat', '24h')}
                className={`py-1 px-3 rounded text-sm ${
                  preferences.display.timeFormat === '24h'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                24h
              </button>
              <button
                onClick={() => updatePreference('display', 'timeFormat', '12h')}
                className={`py-1 px-3 rounded text-sm ${
                  preferences.display.timeFormat === '12h'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                12h
              </button>
            </div>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formato de Fecha
            </label>
            <select
              value={preferences.display.dateFormat}
              onChange={(e) => updatePreference('display', 'dateFormat', e.target.value)}
              className="input-field w-full sm:w-auto"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Notificaciones
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Recordatorios por Email</p>
              <p className="text-sm text-gray-500">Recibe recordatorios de citas por correo</p>
            </div>
            <button
              onClick={() => updatePreference('notifications', 'emailReminders', !preferences.notifications.emailReminders)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                preferences.notifications.emailReminders ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                preferences.notifications.emailReminders ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {preferences.notifications.emailReminders && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enviar recordatorio antes de la cita
              </label>
              <select
                value={preferences.notifications.reminderHoursBefore}
                onChange={(e) => updatePreference('notifications', 'reminderHoursBefore', parseInt(e.target.value))}
                className="input-field w-full sm:w-auto"
              >
                <option value={1}>1 hora antes</option>
                <option value={2}>2 horas antes</option>
                <option value={6}>6 horas antes</option>
                <option value={12}>12 horas antes</option>
                <option value={24}>24 horas antes</option>
                <option value={48}>48 horas antes</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Consultation Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Consultas
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Días de seguimiento por defecto
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={preferences.consultation.defaultFollowUpDays || 7}
              onChange={(e) => updatePreference('consultation', 'defaultFollowUpDays', parseInt(e.target.value) || 7)}
              className="input-field w-24"
            />
            <p className="text-xs text-gray-500 mt-1">Días sugeridos para la próxima cita</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Mostrar Gráficas de Crecimiento</p>
              <p className="text-sm text-gray-500">Ver curvas de crecimiento en consultas</p>
            </div>
            <button
              onClick={() => updatePreference('consultation', 'showGrowthCharts', !preferences.consultation.showGrowthCharts)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                preferences.consultation.showGrowthCharts ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                preferences.consultation.showGrowthCharts ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Sugerencias de IA</p>
              <p className="text-sm text-gray-500">Mostrar diagnósticos sugeridos por IA</p>
            </div>
            <button
              onClick={() => updatePreference('consultation', 'showAISuggestions', !preferences.consultation.showAISuggestions)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                preferences.consultation.showAISuggestions ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                preferences.consultation.showAISuggestions ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={savePreferences}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="h-5 w-5" />
          {loading ? 'Guardando...' : 'Guardar Preferencias'}
        </button>
        {success && (
          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle className="h-5 w-5" />
            Guardado
          </span>
        )}
      </div>
    </div>
  )
}

function BrandingSettings() {
  const { activeProject } = useProject()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loginBgUrl, setLoginBgUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#06b6d4')

  useEffect(() => {
    if (!activeProject?.id) return
    api.get(`/clinics/${activeProject.id}`)
      .then(res => {
        setLoginBgUrl(res.data.settings?.loginBgUrl || '')
        setPrimaryColor(res.data.settings?.primaryColor || '#06b6d4')
      })
      .catch(() => {})
  }, [activeProject?.id])

  const handleSave = async () => {
    if (!activeProject?.id) return
    setLoading(true)
    setSuccess(false)
    setError('')
    try {
      const existing = await api.get(`/clinics/${activeProject.id}`)
      const currentSettings = existing.data.settings || {}
      await api.put(`/clinics/${activeProject.id}`, {
        settings: { ...currentSettings, loginBgUrl: loginBgUrl.trim() || null, primaryColor }
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const previewBg = loginBgUrl.trim() || 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&q=60'

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Branding del Login</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Personaliza la pantalla de inicio de sesión para esta clínica.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4" /> Cambios guardados correctamente
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL de imagen de fondo
              </label>
              <input
                type="url"
                value={loginBgUrl}
                onChange={e => setLoginBgUrl(e.target.value)}
                placeholder="https://..."
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">
                Deja en blanco para usar la imagen por defecto. Recomendado: 1920×1080px.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color principal del botón
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="h-10 w-16 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-1"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="input-field flex-1 font-mono text-sm"
                  placeholder="#06b6d4"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex items-center gap-2 mt-2"
            >
              {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar cambios
            </button>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vista previa
            </label>
            <div
              className="relative rounded-2xl overflow-hidden h-64 shadow-lg"
              style={{ backgroundImage: `url(${previewBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="rounded-2xl p-5 w-44 text-center shadow-xl"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: 'rgba(255,255,255,0.20)' }}
                  >+</div>
                  <p className="text-white font-bold text-sm mb-3">{activeProject?.name || 'My_Dr'}</p>
                  <div
                    className="w-full py-1.5 rounded-lg text-white text-xs font-bold tracking-wider"
                    style={{ background: primaryColor }}
                  >
                    INICIAR SESIÓN
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CatalogsSettings() {
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSpecialties()
  }, [])

  const fetchSpecialties = async () => {
    try {
      const response = await api.get('/specialties')
      setSpecialties(response.data)
    } catch (err) {
      console.error('Error fetching specialties:', err)
      setError('Error al cargar especialidades')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await api.put(`/specialties/${editingId}`, formData)
      } else {
        await api.post('/specialties', formData)
      }
      setFormData({ name: '', description: '' })
      setEditingId(null)
      fetchSpecialties()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar especialidad')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta especialidad?')) return
    try {
      await api.delete(`/specialties/${id}`)
      fetchSpecialties()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar')
    }
  }

  if (loading) return <div className="p-4 text-center">Cargando catálogos...</div>

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Especialidades Médicas
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-8 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva Especialidad</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Ej. Pediatría General"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (Opcional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              placeholder="Descripción breve..."
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
              {editingId ? <><Save className="h-4 w-4" /> Guardar</> : <><Plus className="h-4 w-4" /> Agregar</>}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData({name:'', description:''}) }} className="btn-secondary flex-1">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Descripción</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {specialties.map(spec => (
                <tr key={spec.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{spec.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{spec.description || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditingId(spec.id); setFormData({name: spec.name, description: spec.description || ''}) }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(spec.id)} className="p-1 text-red-600 hover:bg-red-50 rounded ml-2" title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {specialties.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center text-gray-500 bg-white dark:bg-gray-800">No hay especialidades registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
