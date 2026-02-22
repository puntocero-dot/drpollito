import { AlertTriangle, Trash2, X } from 'lucide-react'

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  type = 'danger' // danger, warning, info
}) {
  if (!isOpen) return null

  const typeStyles = {
    danger: {
      icon: 'bg-red-100 dark:bg-red-900/30 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const styles = typeStyles[type] || typeStyles.danger

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Dialog */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${styles.icon}`}>
              {type === 'danger' ? (
                <Trash2 className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
