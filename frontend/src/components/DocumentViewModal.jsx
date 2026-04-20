import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { X, Download, Send, CheckCircle, Loader2, Mail } from 'lucide-react'

export default function DocumentViewModal({ documentId, onClose, onSent }) {
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [sentMessage, setSentMessage] = useState('')
  const printRef = useRef()

  useEffect(() => {
    api.get(`/documents/${documentId}`)
      .then(r => setDoc(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [documentId])

  const handlePrint = () => {
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>${doc.title || 'Documento Médico'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #111; font-size: 13px; }
        .header { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 16px; margin-bottom: 24px; }
        .clinic { font-size: 18px; font-weight: bold; color: #1d4ed8; }
        .title { font-size: 15px; font-weight: bold; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .meta { display: flex; gap: 32px; margin-bottom: 20px; font-size: 12px; color: #555; }
        .content { line-height: 1.8; white-space: pre-wrap; border: 1px solid #ddd; padding: 20px; border-radius: 6px; min-height: 200px; }
        .qr { margin-top: 32px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
        .signature { margin-top: 60px; display: flex; justify-content: flex-end; }
        .sig-box { text-align: center; }
        .sig-line { border-top: 1px solid #333; width: 200px; margin-bottom: 4px; }
        @media print { body { margin: 20px; } }
      </style>
      </head><body>
      <div class="header">
        ${doc.clinic?.name ? `<div class="clinic">${doc.clinic.name}</div>` : ''}
        <div class="title">${doc.title || 'Documento Médico'}</div>
      </div>
      <div class="meta">
        <span><strong>Paciente:</strong> ${doc.patient?.firstName} ${doc.patient?.lastName}</span>
        <span><strong>Fecha:</strong> ${new Date(doc.createdAt).toLocaleDateString('es-ES')}</span>
        ${doc.doctor ? `<span><strong>Doctor:</strong> Dr. ${doc.doctor.firstName} ${doc.doctor.lastName}</span>` : ''}
        ${doc.doctor?.medicalLicense ? `<span><strong>Licencia:</strong> ${doc.doctor.medicalLicense}</span>` : ''}
      </div>
      <div class="content">${(doc.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      ${doc.doctor ? `
      <div class="signature">
        <div class="sig-box">
          <div class="sig-line"></div>
          <div>Dr. ${doc.doctor.firstName} ${doc.doctor.lastName}</div>
          ${doc.doctor.medicalLicense ? `<div style="font-size:11px;color:#555">${doc.doctor.medicalLicense}</div>` : ''}
          ${doc.doctor.specialty ? `<div style="font-size:11px;color:#555">${doc.doctor.specialty}</div>` : ''}
        </div>
      </div>` : ''}
      <div class="qr">Código de verificación: ${doc.qrVerificationCode || ''}</div>
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  const handleSendEmail = async () => {
    if (!emailTo) return
    setSending(true)
    try {
      await api.post(`/documents/${documentId}/email`, { to: emailTo })
      setSentMessage(`Enviado a ${emailTo}`)
      setShowEmailInput(false)
      setEmailTo('')
      onSent?.()
    } catch (err) {
      setSentMessage('Error al enviar. Verifica el correo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {loading ? 'Cargando...' : doc?.title || 'Documento Médico'}
          </h2>
          <div className="flex items-center gap-2">
            {!loading && doc && (
              <>
                <button
                  onClick={handlePrint}
                  title="Descargar / Imprimir"
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-1 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Descargar</span>
                </button>
                {!doc.sentAt && (
                  <button
                    onClick={() => setShowEmailInput(!showEmailInput)}
                    title="Enviar por email"
                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg flex items-center gap-1 text-sm"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                )}
              </>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Email input */}
        {showEmailInput && (
          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="input-field pl-9 py-2 text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
                  autoFocus
                />
              </div>
              <button
                onClick={handleSendEmail}
                disabled={sending || !emailTo}
                className="btn-primary py-2 px-4 text-sm flex items-center gap-1"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar
              </button>
            </div>
          </div>
        )}

        {sentMessage && (
          <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {sentMessage}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : doc ? (
            <div ref={printRef} className="space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Paciente</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {doc.patient?.firstName} {doc.patient?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(doc.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {doc.doctor && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Doctor</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Dr. {doc.doctor.firstName} {doc.doctor.lastName}
                    </p>
                    {doc.doctor.medicalLicense && (
                      <p className="text-xs text-gray-500">{doc.doctor.medicalLicense}</p>
                    )}
                  </div>
                )}
                {doc.clinic && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Clínica</p>
                    <p className="font-medium text-gray-900 dark:text-white">{doc.clinic.name}</p>
                  </div>
                )}
              </div>

              {/* Document body */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200 min-h-[200px]">
                {doc.content || <span className="text-gray-400 italic">Sin contenido</span>}
              </div>

              {/* QR */}
              {doc.qrVerificationCode && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  Verificación: {doc.qrVerificationCode}
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500">Documento no encontrado</p>
          )}
        </div>
      </div>
    </div>
  )
}
