import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  Building2, Plus, Edit, Users, Calendar, X,
  Phone, Mail, MapPin
} from 'lucide-react'

export default function Clinics() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClinic, setEditingClinic] = useState(null)

  useEffect(() => {
    fetchClinics()
  }, [])

  const fetchClinics = async () => {
    try {
      const response = await api.get('/clinics')
      // Fetch stats for each clinic
      const clinicsWithStats = await Promise.all(
        response.data.map(async (clinic) => {
          try {
            const statsRes = await api.get(`/clinics/${clinic.id}/stats`)
            return { ...clinic, stats: statsRes.data }
          } catch {
            return { ...clinic, stats: null }
          }
        })
      )
      setClinics(clinicsWithStats)
    } catch (error) {
      console.error('Error fetching clinics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clínicas</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestión de clínicas y sucursales</p>
        </div>
        <button
          onClick={() => { setEditingClinic(null); setShowModal(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nueva Clínica
        </button>
      </div>

      {/* Clinics Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : clinics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic) => (
            <div key={clinic.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary-600" />
                </div>
                <button
                  onClick={() => { setEditingClinic(clinic); setShowModal(true) }}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {clinic.name}
              </h3>

              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                {clinic.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {clinic.address}
                  </p>
                )}
                {clinic.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {clinic.phone}
                  </p>
                )}
                {clinic.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {clinic.email}
                  </p>
                )}
              </div>

              {clinic.stats && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {clinic.stats.activeDoctors}
                    </p>
                    <p className="text-xs text-gray-500">Doctores</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {clinic.stats.totalPatients}
                    </p>
                    <p className="text-xs text-gray-500">Pacientes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {clinic.stats.todayAppointments}
                    </p>
                    <p className="text-xs text-gray-500">Citas Hoy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {clinic.stats.monthConsultations}
                    </p>
                    <p className="text-xs text-gray-500">Consultas/Mes</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Sin clínicas registradas
          </h3>
          <p className="text-gray-500 mb-4">
            Comienza agregando tu primera clínica
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Agregar Clínica
          </button>
        </div>
      )}

      {/* Clinic Modal */}
      {showModal && (
        <ClinicModal
          clinic={editingClinic}
          onClose={() => { setShowModal(false); setEditingClinic(null) }}
          onSuccess={() => {
            setShowModal(false)
            setEditingClinic(null)
            fetchClinics()
          }}
        />
      )}
    </div>
  )
}

function ClinicModal({ clinic, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: clinic?.name || '',
    address: clinic?.address || '',
    phone: clinic?.phone || '',
    email: clinic?.email || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (clinic) {
        await api.put(`/clinics/${clinic.id}`, formData)
      } else {
        await api.post('/clinics', formData)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar clínica')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {clinic ? 'Editar Clínica' : 'Nueva Clínica'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Clínica Pediátrica Central"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              placeholder="Col. Escalón, San Salvador"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="2222-3333"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="contacto@clinica.com"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Guardando...' : clinic ? 'Actualizar' : 'Crear Clínica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
