import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  UserPlus, Search, Edit, Trash2, X, User,
  Shield, Stethoscope, Phone, Mail
} from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ role: '', search: '' })
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, user: null })

  useEffect(() => {
    fetchUsers()
  }, [filter.role])

  const fetchUsers = async () => {
    try {
      const params = {}
      if (filter.role) params.role = filter.role
      if (filter.search) params.search = filter.search
      const response = await api.get('/users', { params })
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.user) return
    try {
      await api.delete(`/users/${deleteConfirm.user.id}`)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(error.response?.data?.error || 'Error al eliminar usuario')
    }
  }

  const roleLabels = {
    admin: { label: 'Administrador', color: 'red', icon: Shield },
    doctor: { label: 'Doctor', color: 'blue', icon: Stethoscope },
    secretary: { label: 'Secretaria', color: 'green', icon: User },
    insurer: { label: 'Aseguradora', color: 'purple', icon: User },
    parent: { label: 'Padre/Tutor', color: 'orange', icon: User }
  }

  const getRoleBadge = (role) => {
    const config = roleLabels[role] || { label: role, color: 'gray' }
    const colors = {
      red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
    return <span className={`badge ${colors[config.color]}`}>{config.label}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestión de usuarios del sistema</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowModal(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Buscar por nombre o email..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filter.role}
            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
            className="input-field w-auto"
          >
            <option value="">Todos los roles</option>
            {Object.entries(roleLabels).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button onClick={fetchUsers} className="btn-secondary">
            Buscar
          </button>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <span className="text-primary-700 dark:text-primary-300 font-medium">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getRoleBadge(user.role)}
                    {user.specialty && (
                      <p className="text-xs text-gray-500 mt-1">{user.specialty}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {user.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      user.status === 'active' 
                        ? 'badge-success' 
                        : 'badge-danger'
                    }`}>
                      {user.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingUser(user); setShowModal(true) }}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ show: true, user })}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null) }}
          onSuccess={() => {
            setShowModal(false)
            setEditingUser(null)
            fetchUsers()
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, user: null })}
        onConfirm={handleDelete}
        title="¿Eliminar usuario?"
        message={`¿Estás seguro de que deseas eliminar a ${deleteConfirm.user?.firstName} ${deleteConfirm.user?.lastName}? El usuario será desactivado del sistema.`}
        confirmText="Sí, eliminar"
        type="danger"
      />
    </div>
  )
}

function UserModal({ user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clinics, setClinics] = useState([])
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    dui: user?.dui || '',
    role: user?.role || 'doctor',
    status: user?.status || 'active',
    clinicId: '',
    medicalLicense: '',
    specialty: 'Pediatría'
  })

  useEffect(() => {
    fetchClinics()
  }, [])

  const fetchClinics = async () => {
    try {
      const response = await api.get('/clinics')
      setClinics(response.data)
    } catch (error) {
      console.error('Error fetching clinics:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (user) {
        await api.put(`/users/${user.id}`, formData)
      } else {
        await api.post('/users', formData)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
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

          <div className="grid grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              disabled={!!user}
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                required={!user}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                minLength={6}
              />
            </div>
          )}

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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                DUI
              </label>
              <input
                type="text"
                value={formData.dui}
                onChange={(e) => setFormData({ ...formData, dui: e.target.value })}
                className="input-field"
                placeholder="00000000-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rol *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input-field"
                disabled={!!user}
              >
                <option value="admin">Administrador</option>
                <option value="doctor">Doctor</option>
                <option value="secretary">Secretaria</option>
                <option value="insurer">Aseguradora</option>
                <option value="parent">Padre/Tutor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>
          </div>

          {formData.role === 'doctor' && !user && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Clínica
                </label>
                <select
                  value={formData.clinicId}
                  onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Seleccionar clínica</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Licencia Médica *
                  </label>
                  <input
                    type="text"
                    value={formData.medicalLicense}
                    onChange={(e) => setFormData({ ...formData, medicalLicense: e.target.value })}
                    className="input-field"
                    placeholder="JVPM-12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Guardando...' : user ? 'Actualizar' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
