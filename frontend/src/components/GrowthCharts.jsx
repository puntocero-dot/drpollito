import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, ComposedChart
} from 'recharts'
import api from '../services/api'

export default function GrowthCharts({ patientId, gender, currentAge }) {
  const [history, setHistory] = useState([])
  const [curves, setCurves] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState('weight')

  useEffect(() => {
    if (patientId) {
      fetchData()
    }
  }, [patientId])

  const fetchData = async () => {
    try {
      const [historyRes, curvesRes] = await Promise.all([
        api.get(`/growth/patient/${patientId}/history`),
        api.get(`/growth/curves/${gender || 'male'}/${Math.min((currentAge || 24) + 12, 60)}`)
      ])
      setHistory(historyRes.data.history || [])
      setCurves(curvesRes.data)
    } catch (error) {
      console.error('Error fetching growth data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const prepareChartData = (type) => {
    if (!curves) return []
    
    const curveData = curves[type]
    const maxAge = Math.max(...curveData.p50.map(d => d.age), ...history.map(h => h.ageMonths))
    
    const data = []
    for (let age = 0; age <= maxAge; age++) {
      const point = {
        age,
        p3: curveData.p3.find(d => d.age === age)?.value,
        p15: curveData.p15.find(d => d.age === age)?.value,
        p50: curveData.p50.find(d => d.age === age)?.value,
        p85: curveData.p85.find(d => d.age === age)?.value,
        p97: curveData.p97.find(d => d.age === age)?.value
      }
      
      const measurement = history.find(h => h.ageMonths === age)
      if (measurement) {
        point.patient = type === 'weight' ? measurement.weight : measurement.height
      }
      
      data.push(point)
    }
    
    // Add patient measurements that might be between standard ages
    history.forEach(h => {
      const existingPoint = data.find(d => d.age === h.ageMonths)
      if (!existingPoint) {
        const value = type === 'weight' ? h.weight : h.height
        if (value) {
          data.push({
            age: h.ageMonths,
            patient: value,
            p50: curves[type].p50.find(d => d.age <= h.ageMonths)?.value
          })
        }
      }
    })
    
    return data.sort((a, b) => a.age - b.age)
  }

  const weightData = prepareChartData('weight')
  const heightData = prepareChartData('height')

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white mb-2">
          Edad: {label} meses
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value?.toFixed(1)} {activeChart === 'weight' ? 'kg' : 'cm'}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Chart Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveChart('weight')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeChart === 'weight'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Peso
        </button>
        <button
          onClick={() => setActiveChart('height')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeChart === 'height'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Talla
        </button>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={activeChart === 'weight' ? weightData : heightData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="age"
              label={{ value: 'Edad (meses)', position: 'bottom', offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{
                value: activeChart === 'weight' ? 'Peso (kg)' : 'Talla (cm)',
                angle: -90,
                position: 'insideLeft'
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Percentile bands */}
            <Area
              type="monotone"
              dataKey="p97"
              stroke="none"
              fill="#dcfce7"
              fillOpacity={0.3}
              name="P97"
            />
            <Area
              type="monotone"
              dataKey="p3"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
              name="P3"
            />
            
            {/* Percentile lines */}
            <Line
              type="monotone"
              dataKey="p3"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="P3"
            />
            <Line
              type="monotone"
              dataKey="p15"
              stroke="#f97316"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="P15"
            />
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="P50 (Ideal)"
            />
            <Line
              type="monotone"
              dataKey="p85"
              stroke="#f97316"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="P85"
            />
            <Line
              type="monotone"
              dataKey="p97"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="P97"
            />
            
            {/* Patient data */}
            <Line
              type="monotone"
              dataKey="patient"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8 }}
              name="Paciente"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend explanation */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-green-500"></span> P50 = Ideal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-orange-500"></span> P15/P85 = Normal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-500"></span> P3/P97 = Límites
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-1 bg-blue-500 rounded"></span> Paciente
        </span>
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Historial de Mediciones
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Edad</th>
                  <th className="pb-2">Peso</th>
                  <th className="pb-2">Talla</th>
                  <th className="pb-2">P. Cefálico</th>
                  <th className="pb-2">Percentil Peso</th>
                  <th className="pb-2">Percentil Talla</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.slice().reverse().map((h, i) => (
                  <tr key={i} className="text-gray-700 dark:text-gray-300">
                    <td className="py-2">{new Date(h.date).toLocaleDateString('es-ES')}</td>
                    <td className="py-2">{h.ageMonths}m</td>
                    <td className="py-2">{h.weight ? `${h.weight} kg` : '-'}</td>
                    <td className="py-2">{h.height ? `${h.height} cm` : '-'}</td>
                    <td className="py-2">{h.headCircumference ? `${h.headCircumference} cm` : '-'}</td>
                    <td className="py-2">
                      {h.metrics?.weight?.percentile ? (
                        <span className={`badge ${
                          h.metrics.weight.percentile < 3 || h.metrics.weight.percentile > 97
                            ? 'badge-danger'
                            : h.metrics.weight.percentile < 15 || h.metrics.weight.percentile > 85
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}>
                          P{h.metrics.weight.percentile.toFixed(0)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2">
                      {h.metrics?.height?.percentile ? (
                        <span className={`badge ${
                          h.metrics.height.percentile < 3 || h.metrics.height.percentile > 97
                            ? 'badge-danger'
                            : h.metrics.height.percentile < 15 || h.metrics.height.percentile > 85
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}>
                          P{h.metrics.height.percentile.toFixed(0)}
                        </span>
                      ) : '-'}
                    </td>
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
