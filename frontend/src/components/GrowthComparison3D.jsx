import { lazy, Suspense, useState } from 'react'
import { usePreferences } from '../context/PreferencesContext'

const Pediatric4DViewer = lazy(() => import('./Pediatric4DViewer'))

export default function GrowthComparison3D({ data, viewMode = 'bars' }) {
  const { convertWeight, convertHeight, getUnitLabel } = usePreferences()
  const weightUnit = getUnitLabel('weight')
  const heightUnit = getUnitLabel('height')

  // Handle both old format and new advanced format
  const hasAdvancedData = data?.transform3D !== undefined

  // Extract data based on format (always in metric from backend)
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
      <div className="h-[400px] flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl">
        <div className="w-20 h-20 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="12" r="8" fill="#93c5fd" />
            <ellipse cx="20" cy="30" rx="10" ry="8" fill="#93c5fd" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Sin datos de crecimiento</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Registra peso y talla en la consulta</p>
      </div>
    )
  }

  // Convert for display
  const displayCurrentWeight = convertWeight(currentWeight, true)
  const displayCurrentHeight = convertHeight(currentHeight, true)
  const displayPreviousWeight = previousWeight ? convertWeight(previousWeight, true) : null
  const displayPreviousHeight = previousHeight ? convertHeight(previousHeight, true) : null
  const displayIdealWeight = convertWeight(idealWeight, true)
  const displayIdealHeight = convertHeight(idealHeight, true)

  const maxWeight = Math.max(displayCurrentWeight, displayPreviousWeight || 0, displayIdealWeight) * 1.15
  const maxHeight = Math.max(displayCurrentHeight, displayPreviousHeight || 0, displayIdealHeight) * 1.05

  if (viewMode === '3d') {
    return (
      <Suspense fallback={
        <div className="h-[480px] flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Cargando visor 3D...</p>
          </div>
        </div>
      }>
        <Pediatric4DViewer
          edadEnMeses={data?.patient?.ageMonths || 24}
          currentWeight={currentWeight}
          currentHeight={currentHeight}
          idealWeight={idealWeight}
          idealHeight={idealHeight}
          gender={data?.patient?.gender || 'male'}
          healthStatus={healthStatus}
          bmi={bmi}
          transform3D={transform3D}
        />
      </Suspense>
    )
  }

  if (viewMode === 'silhouette') {
    return (
      <AdvancedSilhouetteView
        current={{ weight: currentWeight, height: currentHeight, displayWeight: displayCurrentWeight, displayHeight: displayCurrentHeight }}
        previous={previousWeight ? { weight: previousWeight, height: previousHeight, displayWeight: displayPreviousWeight, displayHeight: displayPreviousHeight } : null}
        ideal={{ weight: idealWeight, height: idealHeight, displayWeight: displayIdealWeight, displayHeight: displayIdealHeight }}
        healthStatus={healthStatus}
        transform3D={transform3D}
        bmi={bmi}
        weightUnit={weightUnit}
        heightUnit={heightUnit}
      />
    )
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6">
      {healthStatus && (
        <div
          className="mb-6 p-4 rounded-xl text-center text-white font-semibold shadow-md"
          style={{ backgroundColor: healthStatus.color }}
        >
          <span className="text-lg">Estado: {healthStatus.label}</span>
          {bmi && <span className="ml-2 opacity-80">(IMC: {bmi.toFixed(1)})</span>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-4 text-base">
            ⚖️ Peso ({weightUnit})
          </h4>
          <div className="flex justify-center items-end gap-4 h-52">
            {displayPreviousWeight && (
              <BarColumn label="Anterior" value={displayPreviousWeight} max={maxWeight} color="#94a3b8" unit={weightUnit} />
            )}
            <BarColumn
              label="Actual"
              value={displayCurrentWeight}
              max={maxWeight}
              color={healthStatus?.color || "#3b82f6"}
              unit={weightUnit}
            />
            <BarColumn label="Ideal" value={displayIdealWeight} max={maxWeight} color="#22c55e" unit={weightUnit} isIdeal />
          </div>
        </div>

        <div>
          <h4 className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-4 text-base">
            📏 Talla ({heightUnit})
          </h4>
          <div className="flex justify-center items-end gap-4 h-52">
            {displayPreviousHeight && (
              <BarColumn label="Anterior" value={displayPreviousHeight} max={maxHeight} color="#94a3b8" unit={heightUnit} />
            )}
            <BarColumn label="Actual" value={displayCurrentHeight} max={maxHeight} color="#3b82f6" unit={heightUnit} />
            <BarColumn label="Ideal" value={displayIdealHeight} max={maxHeight} color="#22c55e" unit={heightUnit} isIdeal />
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-6 text-sm">
        {displayPreviousWeight && (
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Última consulta
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-400"></span>
          Actual
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          Ideal (OMS P50)
        </span>
      </div>

      {transform3D && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <MetricCard
            label="Ratio Peso"
            value={`${(transform3D.ratioWeight * 100).toFixed(0)}%`}
            color={transform3D.ratioWeight > 1.15 ? '#ef4444' : transform3D.ratioWeight > 1.05 ? '#f97316' : transform3D.ratioWeight < 0.9 ? '#3b82f6' : '#22c55e'}
            icon="⚖️"
          />
          <MetricCard
            label="Ratio Talla"
            value={`${(transform3D.ratioHeight * 100).toFixed(0)}%`}
            color={transform3D.ratioHeight < 0.9 ? '#f97316' : '#22c55e'}
            icon="📏"
          />
          <MetricCard
            label="IMC"
            value={bmi?.toFixed(1) || '-'}
            color={healthStatus?.color || '#6b7280'}
            icon="📊"
          />
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, color, icon }) {
  return (
    <div className="text-center p-3 bg-white dark:bg-gray-700/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 transition-transform hover:scale-105">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  )
}

function BarColumn({ label, value, max, color, unit, isIdeal }) {
  const percentage = Math.max(10, (value / max) * 100)

  return (
    <div className="flex flex-col items-center gap-2 w-16">
      <span className="text-xs font-bold" style={{ color }}>
        {value}{unit}
      </span>
      <div className="w-full h-44 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex flex-col justify-end relative shadow-inner">
        <div
          className={`w-full rounded-t-lg transition-all duration-700 ease-out ${isIdeal ? 'border-2 border-dashed border-green-700' : ''}`}
          style={{ height: `${percentage}%`, backgroundColor: color, opacity: isIdeal ? 0.7 : 1 }}
        />
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  )
}

function AdvancedSilhouetteView({ current, previous, ideal, healthStatus, transform3D, bmi, weightUnit, heightUnit }) {
  const heights = [current.height, ideal.height, previous?.height].filter(Boolean)
  const maxCm = Math.max(...heights)
  
  const RULER_PADDING = 20
  const SCENE_LIMIT_CM = maxCm + RULER_PADDING
  const VIEWPORT_HEIGHT = 280
  
  const pxPerCm = VIEWPORT_HEIGHT / SCENE_LIMIT_CM

  const getPos = (cm) => cm * pxPerCm
  
  const currentY = getPos(current.height)
  const idealY = getPos(ideal.height)
  const previousY = previous ? getPos(previous.height) : null
  const floorY = 0

  const currentWidthScale = transform3D?.scaleXZ || 1
  const bodyFatIntensity = transform3D?.bodyFatIntensity || 0
  const abdominalExpansion = transform3D?.abdominalExpansion || 0

  return (
    <div className="bg-gradient-to-b from-blue-50 via-white to-slate-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 rounded-2xl p-6 overflow-hidden">
      {healthStatus && (
        <div
          className="mb-5 p-4 rounded-xl text-center text-white font-semibold shadow-md z-20 relative"
          style={{ backgroundColor: healthStatus.color }}
        >
          <span className="text-lg">{healthStatus.label}</span>
          {bmi && <span className="ml-2 opacity-80">— IMC: {bmi.toFixed(1)}</span>}
        </div>
      )}

      <div className="flex justify-center items-end gap-12 h-[380px] relative px-12 pt-16 overflow-hidden bg-slate-50/50 dark:bg-gray-900/20 rounded-xl border border-slate-200 dark:border-gray-800">
        <div className="absolute left-6 bottom-[100px] h-[280px] w-12 border-r border-slate-200 dark:border-white/10 z-0">
          {(() => {
            const ticks = [];
            const step = 10;
            for (let cm = 0; cm <= SCENE_LIMIT_CM; cm += step) {
              const bottom = getPos(cm);
              if (bottom >= 0 && bottom <= VIEWPORT_HEIGHT) {
                ticks.push(
                  <div key={cm} className="absolute right-0 flex items-center" style={{ bottom: `${bottom}px` }}>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 mr-1.5">{cm}</span>
                    <div className="w-3 h-px bg-slate-300 dark:bg-white/20" />
                  </div>
                );
              }
            }
            return ticks;
          })()}
        </div>

        <div className="absolute left-6 right-6 border-t-2 border-dashed border-green-500/30 z-0" style={{ bottom: `${idealY + 100}px` }}>
           <div className="absolute -top-5 right-0 text-[10px] font-black text-green-500/70 uppercase tracking-tighter bg-white/50 dark:bg-gray-900/50 px-1 rounded">Ideal OMS ({ideal.displayHeight}{heightUnit})</div>
        </div>
        
        <div className="absolute left-6 right-6 border-t-2 border-dashed border-slate-400/50 z-20" style={{ bottom: `${currentY + 100}px` }}>
           <div className="absolute -top-8 left-12 flex flex-col items-start translate-y-1">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-white/50 dark:bg-gray-900/50 px-1 rounded">Actual ({current.displayHeight}{heightUnit})</span>
             <span className="text-[11px] font-black px-2 py-0.5 rounded bg-slate-700 text-white shadow-lg border border-slate-500 translate-y-[-2px]">
               Dif: {current.height > ideal.height ? '+' : ''}{(current.height - ideal.height).toFixed(1)} cm
             </span>
           </div>
        </div>

        {previous && (
          <div className="absolute left-6 right-6 border-t-2 border-dashed border-blue-400/30 z-0" style={{ bottom: `${previousY + 100}px` }}>
             <div className="absolute -top-5 left-1/3 text-[9px] font-black text-blue-400/70 uppercase tracking-tighter bg-white/50 dark:bg-gray-900/50 px-1 rounded">Anterior ({previous.displayHeight}{heightUnit})</div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-[100px] flex justify-around items-end px-12 pointer-events-none" style={{ height: VIEWPORT_HEIGHT }}>
          {previous && (
            <div className="flex flex-col items-center z-10 relative" style={{ bottom: floorY }}>
              <FriendlyChildSilhouette
                targetHeightCm={previous.height}
                pxPerCm={pxPerCm}
                widthScale={1}
                color="#3b82f6"
              />
              <div className="absolute top-[calc(100%+16px)] text-center bg-blue-50/90 dark:bg-blue-900/30 rounded-xl px-4 py-2 shadow-sm min-w-[120px] border border-blue-200 dark:border-blue-800 pointer-events-auto">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Anterior</p>
                <p className="text-xs text-blue-500/80 mt-1">{previous.displayHeight}{heightUnit} / {previous.displayWeight}{weightUnit}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center z-10 relative" style={{ bottom: floorY }}>
            <FriendlyChildSilhouette
              targetHeightCm={current.height}
              pxPerCm={pxPerCm}
              widthScale={currentWidthScale}
              color="#94a3b8"
              bodyFat={bodyFatIntensity}
              abdominal={abdominalExpansion}
            />
            <div className="absolute top-[calc(100%+16px)] text-center bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-md border-2 min-w-[120px] border-slate-300 dark:border-slate-600 pointer-events-auto">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Actual</p>
              <p className="text-xs mt-1 text-slate-500">{current.displayHeight}{heightUnit} / {current.displayWeight}{weightUnit}</p>
            </div>
          </div>

          <div className="flex flex-col items-center z-10 relative" style={{ bottom: floorY }}>
            <FriendlyChildSilhouette
              targetHeightCm={ideal.height}
              pxPerCm={pxPerCm}
              widthScale={1}
              color="#22c55e"
              isIdeal={true}
            />
            <div className="absolute top-[calc(100%+16px)] text-center bg-green-50 dark:bg-green-900/40 rounded-xl px-4 py-2 shadow-sm border-2 min-w-[120px] border-green-300 dark:border-green-700 pointer-events-auto">
              <p className="text-sm font-bold text-green-600 dark:text-green-400">Ideal (OMS)</p>
              <p className="text-xs text-green-500 mt-1">{ideal.displayHeight}{heightUnit} / {ideal.displayWeight}{weightUnit}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MetricCard
          label="Ratio Peso"
          value={`${(transform3D?.ratioWeight * 100).toFixed(0)}%`}
          color={transform3D?.ratioWeight > 1.15 ? '#ef4444' : transform3D?.ratioWeight > 1.05 ? '#f97316' : transform3D?.ratioWeight < 0.9 ? '#3b82f6' : '#22c55e'}
          icon="⚖️"
        />
        <MetricCard
          label="Ratio Talla"
          value={`${(transform3D?.ratioHeight * 100).toFixed(0)}%`}
          color={transform3D?.ratioHeight < 0.9 ? '#f97316' : '#22c55e'}
          icon="📏"
        />
        <MetricCard
          label="IMC"
          value={bmi?.toFixed(1) || '-'}
          color={healthStatus?.color || '#6b7280'}
          icon="📊"
        />
      </div>
    </div>
  )
}

function FriendlyChildSilhouette({
  targetHeightCm = 160,
  pxPerCm = 1,
  widthScale = 1,
  color = '#3b82f6',
  bodyFat = 0,
  abdominal = 0,
  isGhost = false,
  isIdeal = false
}) {
  const SVG_BASE_HEIGHT = 160
  const SVG_BASE_WIDTH = 100

  const displayHeight = targetHeightCm * pxPerCm
  const displayWidth = (SVG_BASE_WIDTH * (displayHeight / SVG_BASE_HEIGHT)) * widthScale

  const headSize = 38 * (1 + bodyFat * 0.05)
  const neckW = 14 + bodyFat * 3
  const torsoW = 44 * (1 + bodyFat * 0.35)
  const torsoH = 50 
  const armW = 14 + bodyFat * 4
  const armH = 48
  const legW = 18 + bodyFat * 5
  const legH = 58

  return (
    <div className="flex flex-col items-center" style={{ height: displayHeight }}>
      <svg 
        width={displayWidth} 
        height={displayHeight} 
        viewBox={`0 0 ${SVG_BASE_WIDTH} ${SVG_BASE_HEIGHT}`} 
        className="drop-shadow-sm"
      >
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: isGhost ? 0.3 : 1 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: isGhost ? 0.1 : 0.8 }} />
          </linearGradient>
        </defs>

        <g transform="translate(50, 0)">
          <circle 
            cx="0" 
            cy={headSize / 2} 
            r={headSize / 2} 
            fill={`url(#grad-${color.replace('#','')})`}
          />
          
          {!isGhost && !isIdeal && (
            <g opacity="0.6">
              <circle cx="-6" cy={headSize / 2 - 2} r="1.5" fill="white" />
              <circle cx="6" cy={headSize / 2 - 2} r="1.5" fill="white" />
            </g>
          )}

          <g transform={`translate(0, ${headSize - 2})`}>
            <rect x={-neckW/2} y="0" width={neckW} height="6" fill={`url(#grad-${color.replace('#','')})`} />
            <rect x={-torsoW/2} y="4" width={torsoW} height={torsoH} rx={torsoW * 0.2} fill={`url(#grad-${color.replace('#','')})`} />
            <rect x={-torsoW/2 - armW + 2} y="6" width={armW} height={armH} rx={armW/2} fill={`url(#grad-${color.replace('#','')})`} transform="rotate(10)" />
            <rect x={torsoW/2 - 2} y="6" width={armW} height={armH} rx={armW/2} fill={`url(#grad-${color.replace('#','')})`} transform="rotate(-10)" />

            <g transform={`translate(0, ${torsoH + 2})`}>
              <rect x={-torsoW * 0.3} y="0" width={legW} height={legH} rx={legH * 0.1} fill={`url(#grad-${color.replace('#','')})`} />
              <rect x={torsoW * 0.3 - legW} y="0" width={legW} height={legH} rx={legH * 0.1} fill={`url(#grad-${color.replace('#','')})`} />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
