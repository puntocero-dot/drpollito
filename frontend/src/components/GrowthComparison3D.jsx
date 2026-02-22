export default function GrowthComparison3D({ data, viewMode = 'bars' }) {
  // Handle both old format and new advanced format
  const hasAdvancedData = data?.transform3D !== undefined
  
  // Extract data based on format
  let currentWeight, currentHeight, previousWeight, previousHeight, idealWeight, idealHeight
  let healthStatus, transform3D, bmi
  
  if (hasAdvancedData) {
    currentWeight = data.current?.weight || 0
    currentHeight = data.current?.height || 0
    previousWeight = data.previous?.weight || null
    previousHeight = data.previous?.height || null
    idealWeight = data.ideal?.weight || 0
    idealHeight = data.ideal?.height || 0
    healthStatus = data.healthStatus || data.transform3D?.bmiStatus
    transform3D = data.transform3D
    bmi = data.current?.bmi || transform3D?.bmi
  } else {
    // Legacy format
    const { current, previous, ideal } = data || {}
    currentWeight = current?.weight?.value || current?.weight || 0
    currentHeight = current?.height?.value || current?.height || 0
    previousWeight = previous?.weight?.value || previous?.weight || null
    previousHeight = previous?.height?.value || previous?.height || null
    idealWeight = ideal?.weight || 0
    idealHeight = ideal?.height || 0
  }
  
  if ((!currentWeight && !currentHeight) || !idealWeight) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 mb-2">Sin datos de crecimiento disponibles</p>
        <p className="text-sm text-gray-400">Registra peso y talla en la consulta</p>
      </div>
    )
  }
  
  const maxWeight = Math.max(currentWeight, previousWeight || 0, idealWeight) * 1.15
  const maxHeight = Math.max(currentHeight, previousHeight || 0, idealHeight) * 1.05

  if (viewMode === 'silhouette') {
    return (
      <AdvancedSilhouetteView 
        current={{ weight: currentWeight, height: currentHeight }}
        previous={previousWeight ? { weight: previousWeight, height: previousHeight } : null}
        ideal={{ weight: idealWeight, height: idealHeight }}
        healthStatus={healthStatus}
        transform3D={transform3D}
        bmi={bmi}
      />
    )
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
      {/* Health Status Banner */}
      {healthStatus && (
        <div 
          className="mb-4 p-3 rounded-lg text-center text-white font-medium"
          style={{ backgroundColor: healthStatus.color }}
        >
          Estado: {healthStatus.label} {bmi && `(IMC: ${bmi.toFixed(1)})`}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-center font-medium text-gray-700 dark:text-gray-300 mb-4">Peso (kg)</h4>
          <div className="flex justify-center items-end gap-4 h-52">
            {previousWeight && (
              <BarColumn label="Anterior" value={previousWeight} max={maxWeight} color="#94a3b8" unit="kg" />
            )}
            <BarColumn 
              label="Actual" 
              value={currentWeight} 
              max={maxWeight} 
              color={healthStatus?.color || "#3b82f6"} 
              unit="kg" 
            />
            <BarColumn label="Ideal" value={idealWeight} max={maxWeight} color="#22c55e" unit="kg" isIdeal />
          </div>
        </div>
        
        <div>
          <h4 className="text-center font-medium text-gray-700 dark:text-gray-300 mb-4">Talla (cm)</h4>
          <div className="flex justify-center items-end gap-4 h-52">
            {previousHeight && (
              <BarColumn label="Anterior" value={previousHeight} max={maxHeight} color="#94a3b8" unit="cm" />
            )}
            <BarColumn label="Actual" value={currentHeight} max={maxHeight} color="#3b82f6" unit="cm" />
            <BarColumn label="Ideal" value={idealHeight} max={maxHeight} color="#22c55e" unit="cm" isIdeal />
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6 text-sm">
        {previousWeight && (
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-gray-400"></span>
            Última consulta
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: healthStatus?.color || '#3b82f6' }}></span>
          Actual
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-green-500 border-2 border-dashed border-green-700"></span>
          Ideal (CDC P50)
        </span>
      </div>
      
      {/* Difference indicators */}
      {transform3D && (
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
            <span className="text-gray-500">Ratio Peso:</span>
            <span className={`ml-2 font-bold ${transform3D.ratioWeight > 1.1 ? 'text-orange-500' : transform3D.ratioWeight < 0.9 ? 'text-blue-500' : 'text-green-500'}`}>
              {(transform3D.ratioWeight * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
            <span className="text-gray-500">Ratio Talla:</span>
            <span className={`ml-2 font-bold ${transform3D.ratioHeight > 1.05 ? 'text-blue-500' : transform3D.ratioHeight < 0.95 ? 'text-orange-500' : 'text-green-500'}`}>
              {(transform3D.ratioHeight * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function BarColumn({ label, value, max, color, unit, isIdeal }) {
  const percentage = Math.max(10, (value / max) * 100)
  
  return (
    <div className="flex flex-col items-center gap-2 w-16">
      <span className="text-xs font-medium" style={{ color }}>
        {value}{unit}
      </span>
      <div className="w-full h-44 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex flex-col justify-end relative">
        <div 
          className={`w-full rounded-t transition-all duration-700 ease-out ${isIdeal ? 'border-2 border-dashed border-green-700' : ''}`}
          style={{ height: `${percentage}%`, backgroundColor: color, opacity: isIdeal ? 0.7 : 1 }}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  )
}

// Advanced silhouette view with body deformation based on BMI
function AdvancedSilhouetteView({ current, previous, ideal, healthStatus, transform3D, bmi }) {
  const baseHeight = 160
  
  // Calculate scales
  const idealScale = 1
  const currentHeightScale = current.height / ideal.height
  const currentWidthScale = transform3D?.scaleXZ || 1
  const previousHeightScale = previous ? previous.height / ideal.height : null
  
  // Body fat intensity affects width
  const bodyFatIntensity = transform3D?.bodyFatIntensity || 0
  const abdominalExpansion = transform3D?.abdominalExpansion || 0
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
      {/* Health Status */}
      {healthStatus && (
        <div 
          className="mb-4 p-3 rounded-lg text-center text-white font-medium"
          style={{ backgroundColor: healthStatus.color }}
        >
          {healthStatus.label} {bmi && `- IMC: ${bmi.toFixed(1)}`}
        </div>
      )}
      
      <div className="flex justify-center items-end gap-8 min-h-[280px] relative">
        {/* Ideal Ghost (wireframe reference) */}
        <div className="absolute inset-0 flex justify-center items-end pointer-events-none opacity-30">
          <ChildSilhouetteAdvanced 
            heightScale={idealScale}
            widthScale={1}
            color="#22c55e"
            isGhost={true}
          />
        </div>
        
        {/* Previous consultation (gray silhouette) */}
        {previous && previousHeightScale && (
          <div className="flex flex-col items-center z-10">
            <ChildSilhouetteAdvanced 
              heightScale={previousHeightScale}
              widthScale={1}
              color="#94a3b8"
              bodyFat={0}
            />
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-gray-500">Última Consulta</p>
              <p className="text-xs text-gray-400">{previous.height}cm / {previous.weight}kg</p>
            </div>
          </div>
        )}
        
        {/* Current state (colored by health status) */}
        <div className="flex flex-col items-center z-10">
          <ChildSilhouetteAdvanced 
            heightScale={currentHeightScale}
            widthScale={currentWidthScale}
            color={healthStatus?.color || "#3b82f6"}
            bodyFat={bodyFatIntensity}
            abdominal={abdominalExpansion}
          />
          <div className="mt-3 text-center">
            <p className="text-sm font-medium" style={{ color: healthStatus?.color || '#3b82f6' }}>
              Actual
            </p>
            <p className="text-xs" style={{ color: healthStatus?.color || '#3b82f6' }}>
              {current.height}cm / {current.weight}kg
            </p>
          </div>
        </div>
        
        {/* Ideal reference */}
        <div className="flex flex-col items-center z-10">
          <ChildSilhouetteAdvanced 
            heightScale={idealScale}
            widthScale={1}
            color="#22c55e"
            bodyFat={0}
            isIdeal={true}
          />
          <div className="mt-3 text-center">
            <p className="text-sm font-medium text-green-600">Ideal (CDC)</p>
            <p className="text-xs text-green-500">{ideal.height}cm / {ideal.weight}kg</p>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-8 h-0.5 bg-green-500 opacity-30"></span>
          Silueta ideal (referencia)
        </span>
      </div>
      
      {/* Metrics */}
      {transform3D && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
            <div className="text-gray-500">Ratio Peso</div>
            <div className={`font-bold ${transform3D.ratioWeight > 1.15 ? 'text-red-500' : transform3D.ratioWeight > 1.05 ? 'text-orange-500' : transform3D.ratioWeight < 0.9 ? 'text-blue-500' : 'text-green-500'}`}>
              {(transform3D.ratioWeight * 100).toFixed(0)}%
            </div>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
            <div className="text-gray-500">Ratio Talla</div>
            <div className={`font-bold ${transform3D.ratioHeight < 0.9 ? 'text-orange-500' : 'text-green-500'}`}>
              {(transform3D.ratioHeight * 100).toFixed(0)}%
            </div>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-700 rounded">
            <div className="text-gray-500">IMC</div>
            <div className="font-bold" style={{ color: healthStatus?.color }}>
              {bmi?.toFixed(1) || '-'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Advanced child silhouette with body deformation
function ChildSilhouetteAdvanced({ 
  heightScale = 1, 
  widthScale = 1, 
  color = '#3b82f6',
  bodyFat = 0,
  abdominal = 0,
  isGhost = false,
  isIdeal = false
}) {
  const baseHeight = 160
  const height = baseHeight * heightScale
  const width = 80 * widthScale
  
  // Body part dimensions affected by body fat
  const headRadius = 14
  const bodyRx = 18 + (bodyFat * 8) + (abdominal * 4) // Torso width
  const bodyRy = 30 // Torso height
  const armRx = 6 + (bodyFat * 2)
  const legRx = 8 + (bodyFat * 3)
  const faceRoundness = headRadius + (bodyFat * 3)
  
  const strokeStyle = isGhost ? { 
    fill: 'none', 
    stroke: color, 
    strokeWidth: 2,
    strokeDasharray: '4 2'
  } : isIdeal ? {
    fill: color,
    opacity: 0.8,
    stroke: '#166534',
    strokeWidth: 1,
    strokeDasharray: '3 2'
  } : { 
    fill: color 
  }
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 80 160" 
      className="transition-all duration-700"
      style={{ transform: `scaleX(${widthScale})` }}
    >
      {/* Head */}
      <ellipse cx="40" cy="20" rx={faceRoundness} ry={headRadius} {...strokeStyle} />
      
      {/* Neck */}
      <rect x="36" y="32" width="8" height="8" rx="2" {...strokeStyle} />
      
      {/* Body/Torso */}
      <ellipse cx="40" cy="70" rx={bodyRx} ry={bodyRy} {...strokeStyle} />
      
      {/* Belly overlay for overweight */}
      {bodyFat > 0.2 && !isGhost && (
        <ellipse 
          cx="40" 
          cy="78" 
          rx={bodyRx * 0.9} 
          ry={bodyRy * 0.6} 
          fill={color}
          opacity={0.5}
        />
      )}
      
      {/* Arms */}
      <ellipse cx="14" cy="60" rx={armRx} ry="20" {...strokeStyle} />
      <ellipse cx="66" cy="60" rx={armRx} ry="20" {...strokeStyle} />
      
      {/* Legs */}
      <ellipse cx="30" cy="125" rx={legRx} ry="30" {...strokeStyle} />
      <ellipse cx="50" cy="125" rx={legRx} ry="30" {...strokeStyle} />
      
      {/* Waist indicator line for overweight */}
      {bodyFat > 0.3 && !isGhost && (
        <ellipse 
          cx="40" 
          cy="85" 
          rx={bodyRx + 2} 
          ry="3" 
          fill="rgba(0,0,0,0.1)"
        />
      )}
    </svg>
  )
}
