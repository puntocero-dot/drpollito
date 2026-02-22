import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  Users, Calendar, Clock, TrendingUp, AlertTriangle,
  ChevronRight, Activity, Stethoscope
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const { user, isAdmin, isDoctor, isSecretary } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      let endpoint = '/dashboard/doctor'
      if (isAdmin) endpoint = '/dashboard/admin'
      else if (isSecretary) endpoint = '/dashboard/secretary'

      const response = await api.get(endpoint)
      setData(response.data)
    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bienvenido, {user?.firstName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isAdmin ? 'Panel de Administración' : isDoctor ? 'Panel del Doctor' : 'Panel de Secretaría'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pacientes Hoy"
          value={data?.stats?.patientsToday || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Citas Pendientes"
          value={data?.stats?.pendingToday || data?.stats?.appointmentsToday || 0}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Esta Semana"
          value={data?.stats?.patientsWeek || data?.stats?.consultationsMonth || 0}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title={isAdmin ? 'Total Pacientes' : 'Este Mes'}
          value={data?.stats?.totalPatients || data?.stats?.patientsMonth || 0}
          icon={Activity}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Citas de Hoy
            </h2>
            <Link to="/appointments" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              Ver todas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {data?.todayAppointments?.length > 0 ? (
            <div className="space-y-3">
              {data.todayAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {apt.patient?.firstName} {apt.patient?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {apt.scheduledTime?.slice(0, 5)} - {apt.reason || apt.type}
                    </p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay citas programadas para hoy</p>
            </div>
          )}
        </div>

        {/* Top Diagnoses or Waiting Room */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {isSecretary ? 'Sala de Espera' : 'Diagnósticos Frecuentes'}
          </h2>

          {isSecretary && data?.waitingRoom ? (
            <div className="space-y-3">
              {data.waitingRoom.length > 0 ? (
                data.waitingRoom.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                      <Users className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.patient?.firstName} {item.patient?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Llegó: {new Date(item.checkedInAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-gray-500">Sala de espera vacía</p>
              )}
            </div>
          ) : data?.topDiagnoses?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.topDiagnoses.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="diagnosis" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Stethoscope className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Sin datos suficientes</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Patients (Doctor) or Clinics Summary (Admin) */}
      {(isDoctor && data?.recentPatients?.length > 0) && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pacientes Recientes
            </h2>
            <Link to="/patients" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentPatients.map((patient) => (
              <Link
                key={patient.id}
                to={`/patients/${patient.id}`}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white">
                  {patient.firstName} {patient.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Última visita: {new Date(patient.lastVisit).toLocaleDateString('es-ES')}
                </p>
                {patient.lastDiagnosis?.[0] && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 truncate">
                    {patient.lastDiagnosis[0]}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {isAdmin && data?.clinics?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumen de Clínicas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">Clínica</th>
                  <th className="pb-3 font-medium">Doctores</th>
                  <th className="pb-3 font-medium">Pacientes</th>
                  <th className="pb-3 font-medium">Citas Hoy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.clinics.map((clinic) => (
                  <tr key={clinic.id} className="text-sm">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{clinic.name}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{clinic.doctors}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{clinic.patients}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{clinic.todayAppointments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    scheduled: 'badge-info',
    confirmed: 'badge-success',
    in_progress: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    no_show: 'badge-danger',
  }

  const labels = {
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    in_progress: 'En curso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    no_show: 'No asistió',
  }

  return (
    <span className={`badge ${styles[status] || 'badge-info'}`}>
      {labels[status] || status}
    </span>
  )
}
