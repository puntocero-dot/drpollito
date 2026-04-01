import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Stethoscope, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react'

const STATUS_CONFIG = {
  active:    { label: 'Activa',     color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',   icon: Clock },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', icon: CheckCircle },
  revoked:   { label: 'Revocada',   color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',         icon: XCircle },
}

export default function Referrals() {
  const { isAdmin } = useAuth()
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    fetchReferrals()
  }, [statusFilter])

  const fetchReferrals = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/referrals', { params })
      setReferrals(res.data)
    } catch (error) {
      console.error('Error fetching referrals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id)
    try {
      await api.patch(`/referrals/${id}/status`, { status: newStatus })
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    } catch (error) {
      alert(error.response?.data?.error || 'Error al actualizar referencia')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary-600" />
            Referencias médicas
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Pacientes referidos entre doctores
          </p>
        </div>
      </div>

      {/* Filtro de estado */}
      <div className="card p-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'Todas' },
            { value: 'active', label: 'Activas' },
            { value: 'completed', label: 'Completadas' },
            { value: 'revoked', label: 'Revocadas' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : referrals.length === 0 ? (
        <div className="card p-12 text-center">
          <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No hay referencias{statusFilter ? ` con estado "${STATUS_CONFIG[statusFilter]?.label}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map(ref => {
            const sc = STATUS_CONFIG[ref.status] || STATUS_CONFIG.active
            const StatusIcon = sc.icon
            return (
              <div key={ref.id} className="card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Paciente */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/patients/${ref.patientId}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 truncate block"
                    >
                      {ref.patientName}
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                      <span>Dr. {ref.fromDoctorName}</span>
                      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Dr. {ref.toDoctorName}</span>
                    </div>
                    {ref.reason && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic truncate">
                        {ref.reason}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(ref.createdAt).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {ref.authorizedByName && ` · Autorizado por ${ref.authorizedByName}`}
                    </p>
                  </div>

                  {/* Estado + acciones */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {sc.label}
                    </span>

                    {ref.status === 'active' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(ref.id, 'completed')}
                          disabled={updating === ref.id}
                          className="px-3 py-1 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
                        >
                          Completar
                        </button>
                        <button
                          onClick={() => handleStatusChange(ref.id, 'revoked')}
                          disabled={updating === ref.id}
                          className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                        >
                          Revocar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
