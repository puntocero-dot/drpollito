import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  Search, Plus, Filter, ChevronRight, User, Calendar,
  AlertTriangle, Phone, X
} from 'lucide-react'

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients', { params: { search } })
      setPatients(response.data)
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setLoading(true)
    fetchPatients()
  }

  const calculateAge = (dob) => {
    const birth = new Date(dob)
    const now = new Date()
    const years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth()
    
    if (years < 1) {
      const totalMonths = years * 12 + months
      return `${totalMonths} meses`
    }
    return `${years} años`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pacientes</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestión de expedientes pediátricos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuevo Paciente
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, expediente o DUI del padre..."
            className="input-field pl-10"
          />
        </div>
        <button type="submit" className="btn-primary">
          Buscar
        </button>
      </form>

      {/* Patients List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : patients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              to={`/patients/${patient.id}`}
              className="card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                  <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    {patient.allergies?.length > 0 && (
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {patient.medicalRecordNumber}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {calculateAge(patient.dateOfBirth)}
                    </span>
                    <span className={patient.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}>
                      {patient.gender === 'male' ? '♂' : '♀'}
                    </span>
                  </div>
                  {patient.allergies?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {patient.allergies.slice(0, 2).map((allergy, i) => (
                        <span key={i} className="badge badge-danger text-xs">
                          {allergy}
                        </span>
                      ))}
                      {patient.allergies.length > 2 && (
                        <span className="badge badge-danger text-xs">
                          +{patient.allergies.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron pacientes
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {search ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer paciente'}
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="h-5 w-5 mr-2" />
            Agregar Paciente
          </button>
        </div>
      )}

      {/* New Patient Modal */}
      {showModal && (
        <NewPatientModal onClose={() => setShowModal(false)} onSuccess={() => {
          setShowModal(false)
          fetchPatients()
        }} />
      )}
    </div>
  )
}

function NewPatientModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    bloodType: 'unknown',
    birthWeightGrams: '',
    birthHeightCm: '',
    gestationalWeeks: '',
    allergies: '',
    insuranceProvider: '',
    insurancePolicyNumber: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = {
        ...formData,
        birthWeightGrams: formData.birthWeightGrams ? parseInt(formData.birthWeightGrams) : null,
        birthHeightCm: formData.birthHeightCm ? parseFloat(formData.birthHeightCm) : null,
        gestationalWeeks: formData.gestationalWeeks ? parseInt(formData.gestationalWeeks) : null,
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : []
      }
      await api.post('/patients', data)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear paciente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Paciente</h2>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Género *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="input-field"
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Sangre
              </label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                className="input-field"
              >
                <option value="unknown">Desconocido</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Datos de Nacimiento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peso al nacer (g)
                </label>
                <input
                  type="number"
                  value={formData.birthWeightGrams}
                  onChange={(e) => setFormData({ ...formData, birthWeightGrams: e.target.value })}
                  className="input-field"
                  placeholder="3200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Talla al nacer (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.birthHeightCm}
                  onChange={(e) => setFormData({ ...formData, birthHeightCm: e.target.value })}
                  className="input-field"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semanas de gestación
                </label>
                <input
                  type="number"
                  value={formData.gestationalWeeks}
                  onChange={(e) => setFormData({ ...formData, gestationalWeeks: e.target.value })}
                  className="input-field"
                  placeholder="40"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Alergias (separadas por coma)
            </label>
            <input
              type="text"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              className="input-field"
              placeholder="Penicilina, Mariscos"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aseguradora
              </label>
              <input
                type="text"
                value={formData.insuranceProvider}
                onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de Póliza
              </label>
              <input
                type="text"
                value={formData.insurancePolicyNumber}
                onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Guardando...' : 'Crear Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
