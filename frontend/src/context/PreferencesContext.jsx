import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const PreferencesContext = createContext()

const DEFAULT_PREFERENCES = {
  units: {
    weight: 'kg',
    height: 'cm',
    temperature: 'celsius',
    headCircumference: 'cm'
  },
  notifications: {
    emailReminders: true,
    reminderHoursBefore: 24,
    smsReminders: false
  },
  display: {
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    theme: 'system'
  },
  consultation: {
    defaultFollowUpDays: 7,
    showGrowthCharts: true,
    showAISuggestions: true
  }
}

export function PreferencesProvider({ children }) {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPreferences()
    } else {
      setPreferences(DEFAULT_PREFERENCES)
      setLoading(false)
    }
  }, [user])

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/preferences')
      setPreferences(prev => ({
        units: { ...prev.units, ...response.data.units },
        notifications: { ...prev.notifications, ...response.data.notifications },
        display: { ...prev.display, ...response.data.display },
        consultation: { ...prev.consultation, ...response.data.consultation }
      }))
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (newPreferences) => {
    try {
      await api.put('/preferences', newPreferences)
      setPreferences(newPreferences)
      return true
    } catch (error) {
      console.error('Error updating preferences:', error)
      return false
    }
  }

  // Unit labels based on preferences
  const getUnitLabel = (type) => {
    switch (type) {
      case 'weight':
        return preferences.units.weight === 'kg' ? 'kg' : 'lb'
      case 'height':
        return preferences.units.height === 'cm' ? 'cm' : 'in'
      case 'temperature':
        return preferences.units.temperature === 'celsius' ? '°C' : '°F'
      case 'headCircumference':
        return preferences.units.headCircumference === 'cm' ? 'cm' : 'in'
      default:
        return ''
    }
  }

  // Conversion functions
  const convertWeight = (value, toDisplay = true) => {
    if (!value) return value
    if (preferences.units.weight === 'kg') return value
    // toDisplay: kg -> lb, !toDisplay: lb -> kg
    return toDisplay 
      ? Math.round(value * 2.20462 * 100) / 100
      : Math.round(value / 2.20462 * 100) / 100
  }

  const convertHeight = (value, toDisplay = true) => {
    if (!value) return value
    if (preferences.units.height === 'cm') return value
    return toDisplay
      ? Math.round(value / 2.54 * 100) / 100
      : Math.round(value * 2.54 * 100) / 100
  }

  const convertTemperature = (value, toDisplay = true) => {
    if (!value) return value
    if (preferences.units.temperature === 'celsius') return value
    return toDisplay
      ? Math.round((value * 9/5 + 32) * 10) / 10
      : Math.round((value - 32) * 5/9 * 10) / 10
  }

  const convertHeadCircumference = (value, toDisplay = true) => {
    if (!value) return value
    if (preferences.units.headCircumference === 'cm') return value
    return toDisplay
      ? Math.round(value / 2.54 * 100) / 100
      : Math.round(value * 2.54 * 100) / 100
  }

  return (
    <PreferencesContext.Provider value={{
      preferences,
      loading,
      updatePreferences,
      fetchPreferences,
      getUnitLabel,
      convertWeight,
      convertHeight,
      convertTemperature,
      convertHeadCircumference
    }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
