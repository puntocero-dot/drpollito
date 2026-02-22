import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  FileText, Search, Download, Eye, Send, Plus, X,
  Filter, Calendar, User
} from 'lucide-react'

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ type: '', search: '' })

  useEffect(() => {
    fetchDocuments()
  }, [filter.type])

  const fetchDocuments = async () => {
    try {
      const params = {}
      if (filter.type) params.type = filter.type
      const response = await api.get('/documents', { params })
      setDocuments(response.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const documentTypes = {
    prescription: { label: 'Receta', color: 'blue' },
    medical_certificate: { label: 'Constancia Médica', color: 'green' },
    disability: { label: 'Incapacidad', color: 'yellow' },
    referral: { label: 'Referencia', color: 'purple' },
    lab_order: { label: 'Orden de Lab', color: 'orange' },
    health_certificate: { label: 'Certificado de Salud', color: 'teal' },
    vaccination_card: { label: 'Carné de Vacunas', color: 'pink' }
  }

  const getTypeBadge = (type) => {
    const config = documentTypes[type] || { label: type, color: 'gray' }
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
    return <span className={`badge ${colors[config.color]}`}>{config.label}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentos</h1>
          <p className="text-gray-500 dark:text-gray-400">Recetas, constancias y certificados médicos</p>
        </div>
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
              placeholder="Buscar por paciente..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="input-field w-auto"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(documentTypes).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : documents.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Documento
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Paciente
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha
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
              {documents
                .filter(doc => 
                  !filter.search || 
                  `${doc.patient?.firstName} ${doc.patient?.lastName}`.toLowerCase().includes(filter.search.toLowerCase())
                )
                .map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {doc.title || documentTypes[doc.type]?.label || doc.type}
                        </p>
                        <p className="text-xs text-gray-500">{doc.qrVerificationCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900 dark:text-white">
                      {doc.patient?.firstName} {doc.patient?.lastName}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {getTypeBadge(doc.type)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3">
                    {doc.sentAt ? (
                      <span className="badge badge-success">Enviado</span>
                    ) : (
                      <span className="badge badge-warning">Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Ver documento"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {!doc.sentAt && (
                        <button
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                          title="Enviar por email"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Sin documentos
          </h3>
          <p className="text-gray-500">
            Los documentos se generan automáticamente durante las consultas
          </p>
        </div>
      )}
    </div>
  )
}
