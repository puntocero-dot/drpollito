import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  ArrowLeft, Save, AlertTriangle, Brain, Thermometer,
  Heart, Activity, Scale, Ruler, Plus, Pill, FileText,
  CheckCircle, Loader2
} from 'lucide-react'

export default function Consultation() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [consultation, setConsultation] = useState(null)
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [activeTab, setActiveTab] = useState('vitals')

  const [vitals, setVitals] = useState({
    weightKg: '',
    heightCm: '',
    headCircumferenceCm: '',
    temperatureCelsius: '',
    heartRateBpm: '',
    respiratoryRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    oxygenSaturation: ''
  })

  const [diagnosis, setDiagnosis] = useState({
    reasonForVisit: '',
    symptoms: '',
    symptomDuration: '',
    physicalExam: {},
    diagnosisCodes: [],
    diagnosisDescriptions: [],
    treatmentPlan: '',
    followUpInstructions: '',
    privateNotes: ''
  })

  const [prescriptionItems, setPrescriptionItems] = useState([])

  useEffect(() => {
    initializeConsultation()
  }, [id])

  const initializeConsultation = async () => {
    try {
      const patientId = searchParams.get('patientId')
      const appointmentId = searchParams.get('appointmentId')

      if (id && id !== 'new') {
        // Load existing consultation
        const response = await api.get(`/consultations/${id}`)
        setConsultation(response.data)
        setPatient(response.data.patient)
        setVitals({
          weightKg: response.data.vitals?.weightKg || '',
          heightCm: response.data.vitals?.heightCm || '',
          headCircumferenceCm: response.data.vitals?.headCircumferenceCm || '',
          temperatureCelsius: response.data.vitals?.temperatureCelsius || '',
          heartRateBpm: response.data.vitals?.heartRateBpm || '',
          respiratoryRate: response.data.vitals?.respiratoryRate || '',
          bloodPressureSystolic: response.data.vitals?.bloodPressureSystolic || '',
          bloodPressureDiastolic: response.data.vitals?.bloodPressureDiastolic || '',
          oxygenSaturation: response.data.vitals?.oxygenSaturation || ''
        })
        setDiagnosis({
          reasonForVisit: response.data.reasonForVisit || '',
          symptoms: response.data.symptoms || '',
          symptomDuration: response.data.symptomDuration || '',
          physicalExam: response.data.physicalExam || {},
          diagnosisCodes: response.data.diagnosisCodes || [],
          diagnosisDescriptions: response.data.diagnosisDescriptions || [],
          treatmentPlan: response.data.treatmentPlan || '',
          followUpInstructions: response.data.followUpInstructions || '',
          privateNotes: response.data.privateNotes || ''
        })
        setAiSuggestions(response.data.aiSuggestions)
      } else if (patientId) {
        // Create new consultation
        const patientRes = await api.get(`/patients/${patientId}`)
        setPatient(patientRes.data)

        // Create consultation record
        const consultRes = await api.post('/consultations', {
          patientId,
          doctorId: user.doctorId,
          appointmentId: appointmentId || null,
          clinicId: user.clinicId
        })
        setConsultation(consultRes.data)
      }
    } catch (error) {
      console.error('Error initializing consultation:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveVitals = async () => {
    if (!consultation?.id) return
    setSaving(true)
    try {
      await api.patch(`/consultations/${consultation.id}/vitals`, vitals)
    } catch (error) {
      console.error('Error saving vitals:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveDiagnosis = async () => {
    if (!consultation?.id) return
    setSaving(true)
    try {
      await api.patch(`/consultations/${consultation.id}/diagnosis`, diagnosis)
    } catch (error) {
      console.error('Error saving diagnosis:', error)
    } finally {
      setSaving(false)
    }
  }

  const getAISuggestions = async () => {
    if (!patient?.id || !diagnosis.symptoms) return
    setAiLoading(true)
    try {
      const response = await api.post('/ai/diagnose', {
        patientId: patient.id,
        symptoms: diagnosis.symptoms,
        vitals: {
          temperature: vitals.temperatureCelsius,
          heartRate: vitals.heartRateBpm,
          respiratoryRate: vitals.respiratoryRate,
          oxygenSaturation: vitals.oxygenSaturation,
          weight: vitals.weightKg
        },
        additionalInfo: diagnosis.symptomDuration
      })
      setAiSuggestions(response.data)
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const completeConsultation = async () => {
    if (!consultation?.id) return
    setSaving(true)
    try {
      await saveDiagnosis()
      await api.patch(`/consultations/${consultation.id}/complete`)
      if (patient?.id) {
        navigate(`/patients/${patient.id}`)
      } else {
        navigate('/patients')
      }
    } catch (error) {
      console.error('Error completing consultation:', error)
    } finally {
      setSaving(false)
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'vitals', label: 'Signos Vitales', icon: Activity },
    { id: 'exam', label: 'Examen', icon: FileText },
    { id: 'diagnosis', label: 'Diagnóstico', icon: Brain },
    { id: 'prescription', label: 'Receta', icon: Pill },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Consulta Médica
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {patient?.firstName} {patient?.lastName} • {calculateAge(patient?.dateOfBirth)}
          </p>
        </div>
        <button
          onClick={completeConsultation}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <CheckCircle className="h-5 w-5" />
          Finalizar Consulta
        </button>
      </div>

      {/* Patient Alerts */}
      {patient?.allergies?.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-700 dark:text-red-400">Alergias:</p>
            <p className="text-red-600 dark:text-red-300">{patient.allergies.join(', ')}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'vitals' && (
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Signos Vitales</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <VitalInput
                  icon={Scale}
                  label="Peso (kg)"
                  value={vitals.weightKg}
                  onChange={(v) => setVitals({ ...vitals, weightKg: v })}
                  placeholder="10.5"
                />
                <VitalInput
                  icon={Ruler}
                  label="Talla (cm)"
                  value={vitals.heightCm}
                  onChange={(v) => setVitals({ ...vitals, heightCm: v })}
                  placeholder="75"
                />
                <VitalInput
                  icon={Ruler}
                  label="P. Cefálico (cm)"
                  value={vitals.headCircumferenceCm}
                  onChange={(v) => setVitals({ ...vitals, headCircumferenceCm: v })}
                  placeholder="45"
                />
                <VitalInput
                  icon={Thermometer}
                  label="Temperatura (°C)"
                  value={vitals.temperatureCelsius}
                  onChange={(v) => setVitals({ ...vitals, temperatureCelsius: v })}
                  placeholder="36.5"
                />
                <VitalInput
                  icon={Heart}
                  label="FC (lpm)"
                  value={vitals.heartRateBpm}
                  onChange={(v) => setVitals({ ...vitals, heartRateBpm: v })}
                  placeholder="100"
                />
                <VitalInput
                  icon={Activity}
                  label="FR (rpm)"
                  value={vitals.respiratoryRate}
                  onChange={(v) => setVitals({ ...vitals, respiratoryRate: v })}
                  placeholder="20"
                />
                <VitalInput
                  label="SpO2 (%)"
                  value={vitals.oxygenSaturation}
                  onChange={(v) => setVitals({ ...vitals, oxygenSaturation: v })}
                  placeholder="98"
                />
                <VitalInput
                  label="PA Sistólica"
                  value={vitals.bloodPressureSystolic}
                  onChange={(v) => setVitals({ ...vitals, bloodPressureSystolic: v })}
                  placeholder="100"
                />
                <VitalInput
                  label="PA Diastólica"
                  value={vitals.bloodPressureDiastolic}
                  onChange={(v) => setVitals({ ...vitals, bloodPressureDiastolic: v })}
                  placeholder="60"
                />
              </div>

              <button onClick={saveVitals} disabled={saving} className="btn-secondary">
                {saving ? 'Guardando...' : 'Guardar Signos Vitales'}
              </button>
            </div>
          )}

          {activeTab === 'exam' && (
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Motivo y Examen</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo de Consulta
                </label>
                <input
                  type="text"
                  value={diagnosis.reasonForVisit}
                  onChange={(e) => setDiagnosis({ ...diagnosis, reasonForVisit: e.target.value })}
                  className="input-field"
                  placeholder="Fiebre, tos, control..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Síntomas
                </label>
                <textarea
                  value={diagnosis.symptoms}
                  onChange={(e) => setDiagnosis({ ...diagnosis, symptoms: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Describe los síntomas del paciente..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duración de Síntomas
                </label>
                <input
                  type="text"
                  value={diagnosis.symptomDuration}
                  onChange={(e) => setDiagnosis({ ...diagnosis, symptomDuration: e.target.value })}
                  className="input-field"
                  placeholder="3 días, 1 semana..."
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={getAISuggestions}
                  disabled={aiLoading || !diagnosis.symptoms}
                  className="btn-secondary flex items-center gap-2"
                >
                  {aiLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Brain className="h-5 w-5" />
                  )}
                  Obtener Sugerencias IA
                </button>
              </div>
            </div>
          )}

          {activeTab === 'diagnosis' && (
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Diagnóstico y Plan</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Diagnóstico
                </label>
                <input
                  type="text"
                  value={diagnosis.diagnosisDescriptions.join(', ')}
                  onChange={(e) => setDiagnosis({
                    ...diagnosis,
                    diagnosisDescriptions: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                  })}
                  className="input-field"
                  placeholder="Faringitis aguda, Otitis media..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan de Tratamiento
                </label>
                <textarea
                  value={diagnosis.treatmentPlan}
                  onChange={(e) => setDiagnosis({ ...diagnosis, treatmentPlan: e.target.value })}
                  className="input-field"
                  rows={4}
                  placeholder="Tratamiento indicado..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Indicaciones de Seguimiento
                </label>
                <textarea
                  value={diagnosis.followUpInstructions}
                  onChange={(e) => setDiagnosis({ ...diagnosis, followUpInstructions: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Regresar si persiste fiebre..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas Privadas (solo doctor)
                </label>
                <textarea
                  value={diagnosis.privateNotes}
                  onChange={(e) => setDiagnosis({ ...diagnosis, privateNotes: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Notas internas..."
                />
              </div>

              <button onClick={saveDiagnosis} disabled={saving} className="btn-primary">
                {saving ? 'Guardando...' : 'Guardar Diagnóstico'}
              </button>
            </div>
          )}

          {activeTab === 'prescription' && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Receta Médica</h3>
                <button
                  onClick={() => setPrescriptionItems([...prescriptionItems, {
                    medicationName: '',
                    dose: '',
                    frequency: '',
                    duration: '',
                    instructions: ''
                  }])}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Medicamento
                </button>
              </div>

              {prescriptionItems.length > 0 ? (
                <div className="space-y-4">
                  {prescriptionItems.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={item.medicationName}
                          onChange={(e) => {
                            const updated = [...prescriptionItems]
                            updated[index].medicationName = e.target.value
                            setPrescriptionItems(updated)
                          }}
                          className="input-field"
                          placeholder="Nombre del medicamento"
                        />
                        <input
                          type="text"
                          value={item.dose}
                          onChange={(e) => {
                            const updated = [...prescriptionItems]
                            updated[index].dose = e.target.value
                            setPrescriptionItems(updated)
                          }}
                          className="input-field"
                          placeholder="Dosis (ej: 5ml)"
                        />
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(e) => {
                            const updated = [...prescriptionItems]
                            updated[index].frequency = e.target.value
                            setPrescriptionItems(updated)
                          }}
                          className="input-field"
                          placeholder="Frecuencia (ej: cada 8h)"
                        />
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => {
                            const updated = [...prescriptionItems]
                            updated[index].duration = e.target.value
                            setPrescriptionItems(updated)
                          }}
                          className="input-field"
                          placeholder="Duración (ej: 7 días)"
                        />
                      </div>
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) => {
                          const updated = [...prescriptionItems]
                          updated[index].instructions = e.target.value
                          setPrescriptionItems(updated)
                        }}
                        className="input-field"
                        placeholder="Instrucciones especiales"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Sin medicamentos agregados</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Suggestions Sidebar */}
        <div className="space-y-4">
          {aiSuggestions && (
            <div className="card p-4 space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary-600" />
                Sugerencias IA
              </h4>

              {aiSuggestions.differentialDiagnoses?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Diagnósticos Diferenciales
                  </p>
                  <div className="space-y-2">
                    {aiSuggestions.differentialDiagnoses.map((d, i) => (
                      <div key={i} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{d.diagnosis}</span>
                          <span className="text-blue-600">{d.probability}%</span>
                        </div>
                        {d.reasoning && (
                          <p className="text-gray-500 text-xs mt-1">{d.reasoning}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiSuggestions.redFlags?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                    Banderas Rojas
                  </p>
                  <ul className="space-y-1">
                    {aiSuggestions.redFlags.map((flag, i) => (
                      <li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestions.recommendedQuestions?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preguntas Sugeridas
                  </p>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {aiSuggestions.recommendedQuestions.map((q, i) => (
                      <li key={i}>• {q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestions.recommendedTests?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exámenes Recomendados
                  </p>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {aiSuggestions.recommendedTests.map((t, i) => (
                      <li key={i}>• {t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Patient Summary */}
          <div className="card p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Resumen Paciente</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Edad:</strong> {calculateAge(patient?.dateOfBirth)}</p>
              <p><strong>Sangre:</strong> {patient?.bloodType || 'No registrado'}</p>
              {patient?.chronicConditions?.length > 0 && (
                <p><strong>Condiciones:</strong> {patient.chronicConditions.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VitalInput({ icon: Icon, label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </label>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        placeholder={placeholder}
      />
    </div>
  )
}
