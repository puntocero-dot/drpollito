import { useState, useEffect } from 'react'
import {
  FileText, Search, User, Check, X, Loader2, AlertCircle, FileType,
  ClipboardList, Info
} from 'lucide-react'
import api from '../services/api'

const LAB_GROUPS = {
  'Hematología': ['Hemograma completo (BHC)', 'Velocidad de sedimentación (VSG)', 'Recuento plaquetario', 'Tiempo de coagulación', 'Tipo y Rh'],
  'Química sanguínea': ['Glucosa en ayunas', 'Glucosa postprandial', 'Creatinina', 'Urea/BUN', 'Ácido úrico', 'Colesterol total', 'Triglicéridos', 'HDL / LDL', 'TGO / TGP (transaminasas)', 'Fosfatasa alcalina', 'Proteínas totales', 'Albúmina'],
  'Orina': ['Examen general de orina (EGO)', 'Urocultivo y antibiograma', 'Proteínas en orina 24h'],
  'Serología / Inmunología': ['VSR / Proteína C reactiva (PCR)', 'Factor reumatoide', 'Prueba de embarazo (beta-HCG)', 'Prueba rápida COVID-19', 'Perfil tiroideo (TSH, T3, T4)'],
  'Microbiología': ['Coprocultivo', 'Coproparasitológico', 'Cultivo de exudado faríngeo', 'Cultivo de herida'],
  'Imágenes': ['Radiografía de tórax PA', 'Radiografía de abdomen', 'Ultrasonido abdominal', 'Ecocardiograma', 'Electrocardiograma (EKG)'],
}

export default function DocumentModal({
  patientId, initialPatient = null, doctorId,
  onClose, onSuccess, enablePatientSearch = false,
  consultationId = null
}) {
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedType, setSelectedType] = useState('medical_certificate')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  // Patient
  const [patient, setPatient] = useState(initialPatient)
  const [patientSearch, setPatientSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchingPatients, setSearchingPatients] = useState(false)

  // Auto-fill from last consultation
  const [lastConsultation, setLastConsultation] = useState(null)
  const [autoFilled, setAutoFilled] = useState(false)

  // Lab order: structured checkboxes
  const [selectedTests, setSelectedTests] = useState([])
  const [labNotes, setLabNotes] = useState('')
  const [otherTest, setOtherTest] = useState('')

  // Disability: structured fields
  const [restDays, setRestDays] = useState('')
  const [disabilityDiagnosis, setDisabilityDiagnosis] = useState('')

  const documentTypes = [
    { value: 'medical_certificate', label: 'Constancia Médica', icon: '📋' },
    { value: 'disability', label: 'Incapacidad', icon: '🏥' },
    { value: 'referral', label: 'Referencia Médica', icon: '↗️' },
    { value: 'lab_order', label: 'Orden de Laboratorio', icon: '🧪' },
    { value: 'health_certificate', label: 'Certificado de Salud', icon: '✅' },
    { value: 'prescription', label: 'Receta Personalizada', icon: '💊' },
  ]

  // Fetch patient on mount
  useEffect(() => {
    if (patientId && !patient) fetchPatient(patientId)
  }, [patientId])

  // Fetch last consultation when patient set
  useEffect(() => {
    if (patient?.id) fetchLastConsultation(patient.id)
    else { setLastConsultation(null); setAutoFilled(false) }
  }, [patient?.id])

  // Fetch templates when type changes
  useEffect(() => {
    fetchTemplates()
  }, [selectedType])

  // Re-build content when structured fields change
  useEffect(() => {
    if (selectedType === 'lab_order') buildLabOrderContent()
  }, [selectedTests, labNotes, otherTest])

  useEffect(() => {
    if (selectedType === 'disability') buildDisabilityContent()
  }, [restDays, disabilityDiagnosis])

  const fetchPatient = async (id) => {
    try {
      const r = await api.get(`/patients/${id}`)
      setPatient(r.data)
    } catch (e) { console.error(e) }
  }

  const fetchLastConsultation = async (pid) => {
    try {
      const r = await api.get('/consultations', { params: { patientId: pid, limit: 1 } })
      const c = r.data?.[0] || null
      setLastConsultation(c)
      if (c) applyAutoFill(c, selectedType)
    } catch (e) { console.error(e) }
  }

  const applyAutoFill = (c, type) => {
    if (!c) return
    const diag = c.diagnosisDescriptions?.[0] || c.reasonForVisit || ''

    if (type === 'disability') {
      setDisabilityDiagnosis(diag)
      setAutoFilled(true)
    } else if (type === 'lab_order') {
      setLabNotes(diag ? `Contexto clínico: ${diag}` : '')
      setAutoFilled(!!diag)
    } else if (type === 'referral') {
      const pName = patient ? `${patient.firstName} ${patient.lastName}` : '{{paciente}}'
      const date = new Date().toLocaleDateString('es-ES')
      setContent(
        `Se refiere al paciente ${pName} a la especialidad de ______________________.\n\nMotivo de referencia: ${diag}\n\nResumen clínico: ${c.symptoms || ''}\n\nFecha: ${date}`
      )
      setAutoFilled(true)
    } else if (type === 'medical_certificate') {
      const pName = patient ? `${patient.firstName} ${patient.lastName}` : '{{paciente}}'
      const date = new Date().toLocaleDateString('es-ES')
      setContent(
        `Por la presente se hace constar que el/la paciente ${pName} asistió a consulta médica el día ${date}${diag ? `, con motivo de: ${diag}` : ''}.\n\nSe extiende la presente para los usos que el interesado estime convenientes.`
      )
      setAutoFilled(true)
    }
  }

  const buildLabOrderContent = () => {
    const pName = patient ? `${patient.firstName} ${patient.lastName}` : '{{paciente}}'
    const tests = [...selectedTests, ...(otherTest ? [otherTest] : [])]
    const list = tests.length > 0 ? tests.map(t => `  • ${t}`).join('\n') : '  (Ningún examen seleccionado)'
    const txt = `Se solicita realizar los siguientes exámenes de laboratorio para el/la paciente ${pName}:\n\n${list}\n\n${labNotes ? `Indicaciones: ${labNotes}` : 'Indicaciones: Ayuno de 8 horas. Llevar muestra temprano en la mañana.'}`
    setContent(txt)
  }

  const buildDisabilityContent = () => {
    const pName = patient ? `${patient.firstName} ${patient.lastName}` : '{{paciente}}'
    const date = new Date().toLocaleDateString('es-ES')
    setContent(
      `Se extiende INCAPACIDAD MÉDICA para el/la paciente ${pName} por un período de ${restDays || '___'} día(s), a partir del día ${date}.\n\nMotivo: ${disabilityDiagnosis || '_______________________'}\n\nSe recomienda reposo absoluto y seguir el tratamiento indicado.`
    )
  }

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    // Reset structured fields on type change
    setSelectedTests([])
    setLabNotes('')
    setOtherTest('')
    setRestDays('')
    setAutoFilled(false)

    try {
      const r = await api.get('/documents/templates/list', { params: { type: selectedType } })
      setTemplates(r.data)
      const typeConfig = documentTypes.find(t => t.value === selectedType)
      setTitle(typeConfig?.label || 'Documento')

      if (r.data.length > 0) {
        applyTemplate(r.data.find(t => t.isDefault) || r.data[0])
      } else {
        setSelectedTemplate(null)
        if (selectedType === 'lab_order') {
          buildLabOrderContent()
        } else if (selectedType === 'disability') {
          if (lastConsultation) applyAutoFill(lastConsultation, 'disability')
          else buildDisabilityContent()
        } else {
          applyAutoFill(lastConsultation, selectedType)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const applyTemplate = (template) => {
    setSelectedTemplate(template)
    setTitle(template.name)
    let c = template.contentTemplate
    if (patient) {
      c = c
        .replace(/{{paciente}}/g, `${patient.firstName} ${patient.lastName}`)
        .replace(/{{dui}}/g, patient.dui || 'N/A')
        .replace(/{{fecha}}/g, new Date().toLocaleDateString('es-ES'))
        .replace(/{{edad}}/g, calculateAge(patient.dateOfBirth))
    }
    setContent(c)
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
    if (val.length < 2) { setSearchResults([]); return }
    setSearchingPatients(true)
    try {
      const r = await api.get('/patients', { params: { search: val } })
      setSearchResults(r.data?.patients || r.data || [])
    } catch (e) { console.error(e) }
    finally { setSearchingPatients(false) }
  }

  const toggleTest = (test) => {
    setSelectedTests(prev =>
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    )
  }

  const handleSave = async () => {
    if (!patient?.id || !title || !content) return
    setSaving(true)
    try {
      await api.post('/documents', {
        patientId: patient.id,
        doctorId,
        consultationId: consultationId || undefined,
        type: selectedType,
        title,
        content
      })
      onSuccess()
    } catch (e) {
      console.error(e)
      alert('Error al guardar el documento')
    } finally {
      setSaving(false)
    }
  }

  const isLabOrder = selectedType === 'lab_order'
  const isDisability = selectedType === 'disability'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nuevo Documento Médico</h2>
              <p className="text-xs text-gray-500">Crea constancias, incapacidades y más</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Auto-fill banner */}
        {autoFilled && lastConsultation && (
          <div className="px-5 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Prellenado desde consulta del {new Date(lastConsultation.consultationDate).toLocaleDateString('es-ES')} — puedes editar libremente
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full">

            {/* Left panel */}
            <div className="lg:col-span-4 p-5 space-y-5 border-r border-gray-100 dark:border-gray-700">

              {/* Patient */}
              {(enablePatientSearch || !patient) && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Paciente</label>
                  {!patient ? (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={patientSearch}
                        onChange={e => handlePatientSearch(e.target.value)}
                        placeholder="Buscar paciente..."
                        className="input-field pl-9"
                      />
                      {searchingPatients && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                      )}
                      {searchResults.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto">
                          {searchResults.map(p => (
                            <button key={p.id} onClick={() => { setPatient(p); setSearchResults([]); setPatientSearch('') }}
                              className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">{p.firstName} {p.lastName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                          {patient.firstName?.[0]}{patient.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{patient.firstName} {patient.lastName}</p>
                          <p className="text-xs text-gray-500">{calculateAge(patient.dateOfBirth)}</p>
                        </div>
                      </div>
                      {enablePatientSearch && (
                        <button onClick={() => setPatient(null)} className="text-gray-400 hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Type selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo de Documento</label>
                <div className="space-y-1.5">
                  {documentTypes.map(t => (
                    <button key={t.value} onClick={() => setSelectedType(t.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left text-sm font-semibold ${
                        selectedType === t.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-transparent bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span className="flex-1">{t.label}</span>
                      {selectedType === t.value && <Check className="h-4 w-4 text-primary-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template picker */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Plantilla</label>
                  <select className="input-field text-sm"
                    onChange={e => { const t = templates.find(x => x.id === e.target.value); if (t) applyTemplate(t) }}
                    value={selectedTemplate?.id || ''}
                  >
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Right panel: editor */}
            <div className="lg:col-span-8 p-5 space-y-4 flex flex-col">

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Título</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="input-field font-semibold" placeholder="Título del documento" />
              </div>

              {/* Disability structured fields */}
              {isDisability && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Días de reposo</label>
                    <input type="number" min="1" max="365" value={restDays}
                      onChange={e => setRestDays(e.target.value)}
                      className="input-field" placeholder="Ej: 3" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Diagnóstico / Motivo</label>
                    <input type="text" value={disabilityDiagnosis}
                      onChange={e => setDisabilityDiagnosis(e.target.value)}
                      className="input-field" placeholder="Ej: Faringitis aguda" />
                  </div>
                </div>
              )}

              {/* Lab order: checkboxes */}
              {isLabOrder && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Exámenes solicitados</label>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    {Object.entries(LAB_GROUPS).map(([group, tests]) => (
                      <div key={group}>
                        <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide sticky top-0">
                          {group}
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-gray-100 dark:divide-gray-700/50">
                          {tests.map(test => (
                            <label key={test} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                              <input type="checkbox" checked={selectedTests.includes(test)}
                                onChange={() => toggleTest(test)}
                                className="rounded text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
                              <span className="text-xs text-gray-700 dark:text-gray-300">{test}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <input type="text" value={otherTest} onChange={e => setOtherTest(e.target.value)}
                      placeholder="Otro examen (escribir aquí)..." className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Indicaciones</label>
                    <input type="text" value={labNotes} onChange={e => setLabNotes(e.target.value)}
                      className="input-field text-sm" placeholder="Ej: Ayuno 8h, muestra en ayunas..." />
                  </div>
                </div>
              )}

              {/* Content textarea */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Contenido</label>
                  {(isLabOrder || isDisability) && (
                    <span className="text-xs text-gray-400 italic">Vista previa generada automáticamente</span>
                  )}
                </div>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={isLabOrder || isDisability ? 6 : 12}
                  className="input-field font-mono text-sm leading-relaxed"
                  placeholder="Contenido del documento..."
                />
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Se incluirá el encabezado de la clínica y firma del doctor al imprimir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !patient || !title || !content}
            className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 shadow-md shadow-primary-600/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Generar Documento'}
          </button>
        </div>
      </div>
    </div>
  )
}
