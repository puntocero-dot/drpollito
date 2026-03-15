import { useState, useEffect } from 'react'
import { FileText, Search, User, Check, X, Loader2, Calendar, FileType, AlertCircle } from 'lucide-react'
import api from '../services/api'

export default function DocumentModal({ patientId, initialPatient = null, doctorId, onClose, onSuccess, enablePatientSearch = false }) {
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedType, setSelectedType] = useState('medical_certificate')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Patient selection state
  const [patient, setPatient] = useState(initialPatient)
  const [patientSearch, setPatientSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchingPatients, setSearchingPatients] = useState(false)

  const documentTypes = [
    { value: 'medical_certificate', label: 'Constancia Médica' },
    { value: 'disability', label: 'Incapacidad' },
    { value: 'referral', label: 'Referencia Médica' },
    { value: 'lab_order', label: 'Orden de Laboratorio' },
    { value: 'health_certificate', label: 'Certificado de Salud' },
    { value: 'prescription', label: 'Receta Personalizada' }
  ]

  useEffect(() => {
    fetchTemplates()
  }, [selectedType])

  useEffect(() => {
    if (patientId && !patient) {
        fetchPatient(patientId)
    }
  }, [patientId])

  const fetchPatient = async (id) => {
    try {
        const response = await api.get(`/patients/${id}`)
        setPatient(response.data)
    } catch (error) {
        console.error('Error fetching patient:', error)
    }
  }

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const response = await api.get('/documents/templates/list', { params: { type: selectedType } })
      setTemplates(response.data)
      if (response.data.length > 0) {
        const def = response.data.find(t => t.isDefault) || response.data[0]
        applyTemplate(def)
      } else {
        setSelectedTemplate(null)
        // Set default title
        const typeLabel = documentTypes.find(t => t.value === selectedType)?.label || 'Documento'
        setTitle(typeLabel)
        setContent('')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const applyTemplate = (template) => {
    setSelectedTemplate(template)
    setTitle(template.name)
    
    let processedContent = template.contentTemplate
    
    // Simple variable replacement
    if (patient) {
      processedContent = processedContent
        .replace(/{{paciente}}/g, `${patient.firstName} ${patient.lastName}`)
        .replace(/{{dui}}/g, patient.dui || 'N/A')
        .replace(/{{fecha}}/g, new Date().toLocaleDateString('es-ES'))
        .replace(/{{edad}}/g, calculateAge(patient.dateOfBirth))
    }
    
    setContent(processedContent)
  }

  const calculateAge = (dob) => {
    if (!dob) return ''
    const birth = new Date(dob)
    const now = new Date()
    const years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth()
    if (years < 1) return `${years * 12 + months} meses`
    return `${years} años`
  }

  const handlePatientSearch = async (val) => {
    setPatientSearch(val)
    if (val.length < 2) {
      setSearchResults([])
      return
    }
    setSearchingPatients(true)
    try {
      const response = await api.get('/patients', { params: { search: val } })
      setSearchResults(response.data.patients || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearchingPatients(false)
    }
  }

  const handleSave = async () => {
    if (!patient?.id || !title || !content) return
    setSaving(true)
    try {
      await api.post('/documents', {
        patientId: patient.id,
        doctorId,
        type: selectedType,
        title,
        content
      })
      onSuccess()
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Error al guardar el documento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo Documento Médico</h2>
              <p className="text-sm text-gray-500">Crea constancias, incapacidades y más</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Settings */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Patient Selector (if enabled) */}
              {(enablePatientSearch || !patient) && (
                <div className="space-y-2">
                  <label className="block text-xs font-black text-brand-muted uppercase tracking-widest">Paciente</label>
                  {!patient ? (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={patientSearch}
                        onChange={(e) => handlePatientSearch(e.target.value)}
                        placeholder="Buscar paciente..."
                        className="input-field pl-9"
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto">
                          {searchResults.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setPatient(p)
                                setSearchResults([])
                                setPatientSearch('')
                              }}
                              className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2"
                            >
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">{p.firstName} {p.lastName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div className="text-sm">
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">{patient.firstName} {patient.lastName}</p>
                          <p className="text-xs text-gray-500">{calculateAge(patient.dateOfBirth)}</p>
                        </div>
                      </div>
                      {enablePatientSearch && (
                        <button onClick={() => setPatient(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-brand-muted uppercase tracking-widest">Tipo de Documento</label>
                <div className="grid grid-cols-1 gap-2">
                  {documentTypes.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setSelectedType(t.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedType === t.value 
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                        : 'border-transparent bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <FileType className={`h-4 w-4 ${selectedType === t.value ? 'text-primary-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-bold">{t.label}</span>
                      {selectedType === t.value && <Check className="h-4 w-4 ml-auto text-primary-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Selector */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-black text-brand-muted uppercase tracking-widest">Plantilla</label>
                  <select 
                    className="input-field"
                    onChange={(e) => {
                      const t = templates.find(temp => temp.id === e.target.value)
                      if (t) applyTemplate(t)
                    }}
                    value={selectedTemplate?.id || ''}
                  >
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Right Column: Editor */}
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black text-brand-muted uppercase tracking-widest">Título del Documento</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field font-bold"
                  placeholder="Ej: Constancia de Asistencia Médica"
                />
              </div>

              <div className="space-y-2 flex-1">
                <label className="block text-xs font-black text-brand-muted uppercase tracking-widest">Contenido</label>
                <div className="relative group">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="input-field min-h-[400px] font-serif leading-relaxed text-gray-800 dark:text-gray-200 p-8 shadow-inner border-gray-200 dark:border-gray-600 focus:ring-primary-500/20"
                    placeholder="Redacta el contenido del documento aquí..."
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-bold">PAPEL TAMAÑO CARTA</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                  <AlertCircle className="h-3 w-3" />
                  <span>Se incluirá automáticamente el encabezado de la clínica y firma del doctor al generar el PDF.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !patient || !title || !content}
            className="btn-primary px-8 py-2.5 flex items-center gap-2 shadow-lg shadow-primary-600/20"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Check className="h-5 w-5" />
            )}
            {saving ? 'Guardando...' : 'Generar Documento'}
          </button>
        </div>
      </div>
    </div>
  )
}
