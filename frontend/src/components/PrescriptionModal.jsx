import { useState } from 'react'
import { Pill, Plus, Trash2, Loader2, Brain, Check, X, Printer, AlertCircle, Sparkles } from 'lucide-react'
import api from '../services/api'

const EMPTY_ITEM = () => ({
  medicationName: '',
  genericName: '',
  dose: '',
  doseUnit: 'ml',
  frequency: '',
  duration: '',
  route: 'oral',
  instructions: ''
})

export default function PrescriptionModal({ patientId, doctorId, consultationId, onClose, onSuccess }) {
  const [items, setItems] = useState([EMPTY_ITEM()])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedPrescriptionId, setSavedPrescriptionId] = useState(null)
  const [errors, setErrors] = useState({})

  // AI: separate from user data — never overwrite silently
  const [aiSuggestions, setAiSuggestions] = useState({}) // { [index]: { dose, frequency, duration, route, reasoning } }
  const [calculatingDose, setCalculatingDose] = useState(null)
  const [doseErrors, setDoseErrors] = useState({})

  // Medication autocomplete
  const [loadingSuggestions, setLoadingSuggestions] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null)
  const [searchTimeout, setSearchTimeout] = useState(null)

  const routes = [
    { value: 'oral', label: 'Oral' },
    { value: 'intravenous', label: 'Intravenosa (IV)' },
    { value: 'intramuscular', label: 'Intramuscular (IM)' },
    { value: 'topical', label: 'Tópica' },
    { value: 'ophthalmic', label: 'Oftálmica' },
    { value: 'otic', label: 'Ótica' },
    { value: 'nasal', label: 'Nasal' },
    { value: 'rectal', label: 'Rectal' },
    { value: 'nebulized', label: 'Nebulizada' }
  ]
  const doseUnits = ['ml', 'mg', 'gotas', 'tabletas', 'cápsulas', 'puff', 'aplicación', 'UI', 'mcg']

  // ── Items ──────────────────────────────────────────────────────────────────

  const addItem = () => setItems(prev => [...prev, EMPTY_ITEM()])

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index))
    setAiSuggestions(prev => { const n = { ...prev }; delete n[index]; return n })
    setErrors(prev => { const n = { ...prev }; delete n[index]; return n })
    setDoseErrors(prev => { const n = { ...prev }; delete n[index]; return n })
  }

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
    // Clear error for this field when user types
    setErrors(prev => {
      const n = { ...prev }
      if (n[index]) { delete n[index][field]; if (!Object.keys(n[index]).length) delete n[index] }
      return n
    })
  }

  // ── Autocomplete ───────────────────────────────────────────────────────────

  const handleSearch = (text, index) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    updateItem(index, 'medicationName', text)
    setActiveSuggestionIndex(index)
    if (text.length < 3) { setSuggestions([]); return }
    const t = setTimeout(async () => {
      setLoadingSuggestions(index)
      try {
        const r = await api.post('/ai/medication-suggestions', { query: text })
        setSuggestions(r.data.suggestions || [])
      } catch (e) { console.error(e) }
      finally { setLoadingSuggestions(null) }
    }, 400)
    setSearchTimeout(t)
  }

  const selectSuggestion = (s, index) => {
    setItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], medicationName: s.name, genericName: s.generic }
      return next
    })
    setSuggestions([])
    setActiveSuggestionIndex(null)
  }

  // ── AI dose ────────────────────────────────────────────────────────────────

  const handleAIDose = async (index) => {
    const item = items[index]
    if (!item.medicationName || !patientId) return
    setCalculatingDose(index)
    setDoseErrors(prev => { const n = { ...prev }; delete n[index]; return n })
    try {
      const r = await api.post('/ai/calculate-dose-ai', { medicationName: item.medicationName, patientId })
      if (r.data) {
        // Store as suggestion — don't overwrite user's fields
        setAiSuggestions(prev => ({
          ...prev,
          [index]: {
            dose: r.data.recommendedDose || '',
            doseUnit: r.data.doseUnit || item.doseUnit,
            frequency: r.data.frequency || '',
            duration: r.data.duration || '',
            route: r.data.route?.toLowerCase() || 'oral',
            reasoning: r.data.reasoning || ''
          }
        }))
      }
    } catch (e) {
      setDoseErrors(prev => ({ ...prev, [index]: 'Error en IA. Verifica manualmente.' }))
    } finally {
      setCalculatingDose(null)
    }
  }

  const applyAiSuggestion = (index) => {
    const s = aiSuggestions[index]
    if (!s) return
    setItems(prev => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        dose: s.dose || next[index].dose,
        doseUnit: s.doseUnit || next[index].doseUnit,
        frequency: s.frequency || next[index].frequency,
        duration: s.duration || next[index].duration,
        route: s.route || next[index].route,
      }
      return next
    })
    dismissAiSuggestion(index)
  }

  const dismissAiSuggestion = (index) => {
    setAiSuggestions(prev => { const n = { ...prev }; delete n[index]; return n })
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const newErrors = {}
    items.forEach((item, i) => {
      const e = {}
      if (!item.medicationName.trim()) e.medicationName = 'Nombre requerido'
      if (!item.dose.trim()) e.dose = 'Dosis requerida'
      if (!item.frequency.trim()) e.frequency = 'Frecuencia requerida'
      if (Object.keys(e).length) newErrors[i] = e
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Save + Print ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const r = await api.post('/prescriptions', {
        patientId,
        doctorId,
        consultationId: consultationId || undefined,
        notes,
        items
      })
      setSavedPrescriptionId(r.data.id)
    } catch (e) {
      console.error(e)
      alert('Error al guardar la receta')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = async () => {
    if (!savedPrescriptionId) return
    try {
      const r = await api.get(`/prescriptions/${savedPrescriptionId}`)
      const pr = r.data
      openPrintWindow(pr)
    } catch (e) {
      console.error(e)
      alert('Error al cargar datos de impresión')
    }
  }

  const handleSaveAndClose = () => {
    onSuccess()
  }

  const fieldClass = (index, field) =>
    `input-field ${errors[index]?.[field] ? 'border-red-400 focus:ring-red-400/20 dark:border-red-500' : ''}`

  // ── Render ─────────────────────────────────────────────────────────────────

  if (savedPrescriptionId) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Receta guardada</h3>
            <p className="text-gray-500 mt-1 text-sm">La receta se ha guardado correctamente en el expediente.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={async () => { await handlePrint(); handleSaveAndClose() }}
              className="btn-primary flex items-center justify-center gap-2 py-3"
            >
              <Printer className="h-5 w-5" />
              Imprimir / Guardar PDF
            </button>
            <button
              onClick={handleSaveAndClose}
              className="btn-secondary flex items-center justify-center gap-2 py-3"
            >
              Cerrar sin imprimir
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Pill className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nueva Receta Médica</h2>
              <p className="text-xs text-gray-500">Completa nombre, dosis y frecuencia de cada medicamento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {items.map((item, index) => (
            <div key={index} className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600 space-y-4">

              {/* Row header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Medicamento {index + 1}</span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(index)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Medication name with autocomplete */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nombre *</label>
                  <input
                    type="text"
                    value={item.medicationName}
                    onChange={e => handleSearch(e.target.value, index)}
                    onFocus={() => setActiveSuggestionIndex(index)}
                    className={fieldClass(index, 'medicationName')}
                    placeholder="Ibuprofeno, Amoxicilina..."
                  />
                  {errors[index]?.medicationName && (
                    <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[index].medicationName}</p>
                  )}
                  {activeSuggestionIndex === index && (loadingSuggestions === index || suggestions.length > 0) && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-52 overflow-y-auto">
                      {loadingSuggestions === index ? (
                        <div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary-600" /></div>
                      ) : suggestions.map((s, i) => (
                        <button key={i} onClick={() => selectSuggestion(s, index)}
                          className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700 last:border-0">
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.generic} · {s.presentation}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI dose button */}
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => handleAIDose(index)}
                    disabled={calculatingDose === index || !item.medicationName}
                    className="btn-secondary h-[42px] flex items-center justify-center gap-2 group text-sm"
                  >
                    {calculatingDose === index
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Brain className="h-4 w-4 text-primary-600 group-hover:scale-110 transition-transform" />}
                    Cálculo pediátrico IA
                  </button>
                  {doseErrors[index] && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{doseErrors[index]}</p>
                  )}
                </div>

                {/* AI suggestion banner */}
                {aiSuggestions[index] && (
                  <div className="col-span-2 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                      <Sparkles className="h-4 w-4 shrink-0" />
                      <p className="text-xs font-bold">Sugerencia IA — revisa antes de aplicar</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {aiSuggestions[index].dose && <span className="bg-white dark:bg-gray-800 rounded px-2 py-1"><span className="text-gray-400">Dosis:</span> <strong>{aiSuggestions[index].dose} {aiSuggestions[index].doseUnit}</strong></span>}
                      {aiSuggestions[index].frequency && <span className="bg-white dark:bg-gray-800 rounded px-2 py-1"><span className="text-gray-400">Frecuencia:</span> <strong>{aiSuggestions[index].frequency}</strong></span>}
                      {aiSuggestions[index].duration && <span className="bg-white dark:bg-gray-800 rounded px-2 py-1"><span className="text-gray-400">Duración:</span> <strong>{aiSuggestions[index].duration}</strong></span>}
                      {aiSuggestions[index].route && <span className="bg-white dark:bg-gray-800 rounded px-2 py-1"><span className="text-gray-400">Vía:</span> <strong>{aiSuggestions[index].route}</strong></span>}
                    </div>
                    {aiSuggestions[index].reasoning && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 italic line-clamp-2">{aiSuggestions[index].reasoning}</p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => applyAiSuggestion(index)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">
                        Aplicar
                      </button>
                      <button onClick={() => dismissAiSuggestion(index)} className="px-3 py-1 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline">
                        Descartar
                      </button>
                    </div>
                  </div>
                )}

                {/* Dose + Unit */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Dosis *</label>
                    <input type="text" value={item.dose} onChange={e => updateItem(index, 'dose', e.target.value)}
                      className={fieldClass(index, 'dose')} placeholder="Ej: 5" />
                    {errors[index]?.dose && (
                      <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[index].dose}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Unidad</label>
                    <select value={item.doseUnit} onChange={e => updateItem(index, 'doseUnit', e.target.value)} className="input-field">
                      {doseUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Frecuencia *</label>
                  <input type="text" value={item.frequency} onChange={e => updateItem(index, 'frequency', e.target.value)}
                    className={fieldClass(index, 'frequency')} placeholder="Cada 8 horas" />
                  {errors[index]?.frequency && (
                    <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[index].frequency}</p>
                  )}
                </div>

                {/* Route */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Vía</label>
                  <select value={item.route} onChange={e => updateItem(index, 'route', e.target.value)} className="input-field">
                    {routes.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Duración</label>
                  <input type="text" value={item.duration} onChange={e => updateItem(index, 'duration', e.target.value)}
                    className="input-field" placeholder="7 días" />
                </div>

                {/* Generic name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nombre Genérico</label>
                  <input type="text" value={item.genericName} onChange={e => updateItem(index, 'genericName', e.target.value)}
                    className="input-field" placeholder="Nombre genérico (opcional)" />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Instrucciones para el paciente</label>
                <textarea value={item.instructions} onChange={e => updateItem(index, 'instructions', e.target.value)}
                  rows={2} className="input-field text-sm" placeholder="Tomar después de los alimentos, evitar exposición solar..." />
              </div>
            </div>
          ))}

          {/* Add medication */}
          <button onClick={addItem}
            className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:text-primary-600 hover:border-primary-400 transition-all flex items-center justify-center gap-2 font-bold text-sm">
            <Plus className="h-4 w-4" /> Agregar otro medicamento
          </button>

          {/* General notes */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Indicaciones generales</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="input-field text-sm" placeholder="Indicaciones para los padres, cuidados especiales..." />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between rounded-b-2xl">
          <p className="text-xs text-gray-400">* Campos obligatorios</p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 shadow-md"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Guardando...' : 'Guardar Receta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Print helper (called after fetching full prescription data) ──────────────

export function openPrintWindow(pr) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
  const calcAge = (dob) => {
    if (!dob) return ''
    const birth = new Date(dob)
    const now = new Date()
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    return months < 24 ? `${months} meses` : `${Math.floor(months / 12)} años`
  }

  const itemsHtml = (pr.items || []).map((item, i) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top">
        <strong>${i + 1}. ${item.medicationName}</strong>
        ${item.genericName ? `<br/><span style="color:#6b7280;font-size:12px">(${item.genericName})</span>` : ''}
        ${item.allergyWarnings?.length ? `<br/><span style="color:#dc2626;font-size:11px;font-weight:bold">⚠ Alergia reportada</span>` : ''}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;white-space:nowrap">${item.dose || ''} ${item.doseUnit || ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb">${item.frequency || ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb">${item.duration || ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151">${item.instructions || ''}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
    <meta charset="UTF-8"/>
    <title>Receta Médica — ${pr.patient?.firstName} ${pr.patient?.lastName}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px 40px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1d4ed8; padding-bottom: 16px; margin-bottom: 20px; }
      .clinic-name { font-size: 20px; font-weight: 800; color: #1d4ed8; }
      .clinic-sub { font-size: 12px; color: #6b7280; margin-top: 3px; }
      .rx-badge { font-size: 48px; font-weight: 900; color: #1d4ed8; line-height: 1; }
      .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; }
      .meta-grid .label { color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
      .meta-grid .val { font-weight: 700; color: #111; font-size: 13px; margin-top: 1px; }
      .allergies { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; color: #dc2626; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      thead tr { background: #1d4ed8; color: white; }
      thead th { padding: 9px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
      tbody tr:nth-child(even) { background: #f8fafc; }
      .notes { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; }
      .notes strong { color: #166534; }
      .signature { display: flex; justify-content: flex-end; margin-top: 40px; }
      .sig-box { text-align: center; }
      .sig-line { border-top: 1px solid #374151; width: 220px; margin-bottom: 6px; }
      .sig-name { font-weight: 700; font-size: 13px; }
      .sig-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
      .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 10px; color: #9ca3af; text-align: center; }
      @media print {
        body { padding: 16px 20px; }
        @page { margin: 1cm; }
      }
    </style>
    </head>
    <body>
    <div class="header">
      <div style="display:flex;align-items:center;gap:14px">
        ${pr.clinic?.logoUrl ? `<img src="${pr.clinic.logoUrl}" alt="logo" style="height:52px;width:auto;object-fit:contain;border-radius:6px"/>` : ''}
        <div>
          <div class="clinic-name">${pr.clinic?.name || 'Consulta Médica'}</div>
          <div class="clinic-sub">${pr.clinic?.address || ''} ${pr.clinic?.phone ? '· Tel: ' + pr.clinic.phone : ''}</div>
          ${pr.doctor ? `<div class="clinic-sub" style="margin-top:4px">Dr. ${pr.doctor.firstName} ${pr.doctor.lastName}${pr.doctor.specialty ? ' · ' + pr.doctor.specialty : ''}${pr.doctor.medicalLicense ? ' · ' + pr.doctor.medicalLicense : ''}</div>` : ''}
        </div>
      </div>
      <div class="rx-badge">℞</div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="label">Paciente</div>
        <div class="val">${pr.patient?.firstName} ${pr.patient?.lastName}</div>
      </div>
      <div>
        <div class="label">Fecha</div>
        <div class="val">${formatDate(pr.prescriptionDate)}</div>
      </div>
      <div>
        <div class="label">Edad</div>
        <div class="val">${calcAge(pr.patient?.dateOfBirth)}</div>
      </div>
      ${pr.validUntil ? `<div><div class="label">Válida hasta</div><div class="val">${formatDate(pr.validUntil)}</div></div>` : ''}
    </div>

    ${pr.patient?.allergies?.length ? `<div class="allergies">⚠ Alergias conocidas: ${pr.patient.allergies.join(', ')}</div>` : ''}

    <table>
      <thead>
        <tr>
          <th>Medicamento</th>
          <th>Dosis</th>
          <th>Frecuencia</th>
          <th>Duración</th>
          <th>Instrucciones</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    ${pr.notes ? `<div class="notes"><strong>Indicaciones generales:</strong><br/>${pr.notes.replace(/\n/g, '<br/>')}</div>` : ''}

    ${pr.doctor ? `
    <div class="signature">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-name">Dr. ${pr.doctor.firstName} ${pr.doctor.lastName}</div>
        ${pr.doctor.medicalLicense ? `<div class="sig-sub">${pr.doctor.medicalLicense}</div>` : ''}
        ${pr.doctor.specialty ? `<div class="sig-sub">${pr.doctor.specialty}</div>` : ''}
      </div>
    </div>` : ''}

    <div class="footer">${pr.clinic?.name || 'My Dr'} · Receta generada digitalmente · ${formatDate(pr.prescriptionDate)}</div>
    </body>
    </html>
  `

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}
