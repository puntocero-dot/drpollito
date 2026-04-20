import { usePreferences } from '../context/PreferencesContext'

export default function GrowthComparison3D({ data, viewMode = 'bars' }) {
  const { convertWeight, convertHeight, getUnitLabel } = usePreferences()
  const weightUnit = getUnitLabel('weight')
  const heightUnit = getUnitLabel('height')

  const hasAdvancedData = data?.transform3D !== undefined

  let currentWeight, currentHeight, previousWeight, previousHeight, idealWeight, idealHeight
  let healthStatus, transform3D, bmi, currentPercentiles, previousPercentiles

  if (hasAdvancedData) {
    currentWeight = data.current?.weight || 0
    currentHeight = data.current?.height || 0
    previousWeight = data.previous?.weight || null
    previousHeight = data.previous?.height || null
    idealWeight = data.ideal?.weight || 0
    idealHeight = data.ideal?.height || 0
    healthStatus = data.healthStatus
    transform3D = data.transform3D
    bmi = data.current?.bmi
    currentPercentiles = data.current?.percentiles
    previousPercentiles = data.previous?.percentiles
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
      <div className="h-[340px] flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl">
        <div className="w-16 h-16 mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="12" r="8" fill="#93c5fd" />
            <ellipse cx="20" cy="30" rx="10" ry="8" fill="#93c5fd" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Sin datos de crecimiento</p>
        <p className="text-sm text-gray-400 mt-1">Registra peso y talla en la consulta</p>
      </div>
    )
  }

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
      <ClinicalDashboard
        current={{ weight: currentWeight, height: currentHeight, bmi, percentiles: currentPercentiles }}
        previous={previousWeight ? { weight: previousWeight, height: previousHeight, percentiles: previousPercentiles } : null}
        ideal={{ weight: idealWeight, height: idealHeight }}
        healthStatus={healthStatus}
        transform3D={transform3D}
        weightUnit={weightUnit}
        heightUnit={heightUnit}
        convertWeight={convertWeight}
        convertHeight={convertHeight}
      />
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

  // Bars view
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6">
      {healthStatus && (
        <div className="mb-6 p-4 rounded-xl text-center text-white font-semibold shadow-md" style={{ backgroundColor: healthStatus.color }}>
          <span className="text-lg">Estado: {healthStatus.label}</span>
          {bmi && <span className="ml-2 opacity-80">(IMC: {bmi.toFixed(1)})</span>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-4">⚖️ Peso ({weightUnit})</h4>
          <div className="flex justify-center items-end gap-4 h-52">
            {displayPreviousWeight && <BarColumn label="Anterior" value={displayPreviousWeight} max={maxWeight} color="#94a3b8" unit={weightUnit} />}
            <BarColumn label="Actual" value={displayCurrentWeight} max={maxWeight} color={healthStatus?.color || '#3b82f6'} unit={weightUnit} />
            <BarColumn label="Ideal" value={displayIdealWeight} max={maxWeight} color="#22c55e" unit={weightUnit} isIdeal />
          </div>
        </div>
        <div>
          <h4 className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-4">📏 Talla ({heightUnit})</h4>
          <div className="flex justify-center items-end gap-4 h-52">
            {displayPreviousHeight && <BarColumn label="Anterior" value={displayPreviousHeight} max={maxHeight} color="#94a3b8" unit={heightUnit} />}
            <BarColumn label="Actual" value={displayCurrentHeight} max={maxHeight} color="#3b82f6" unit={heightUnit} />
            <BarColumn label="Ideal" value={displayIdealHeight} max={maxHeight} color="#22c55e" unit={heightUnit} isIdeal />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Clinical Dashboard (replaces useless 3D robots) ─────────────────────────

function ClinicalDashboard({ current, previous, ideal, healthStatus, transform3D, weightUnit, heightUnit, convertWeight, convertHeight }) {
  const pWeight = current?.percentiles?.weight
  const pHeight = current?.percentiles?.height
  const bmi = current?.bmi

  const getPercentileBand = (p) => {
    if (p == null) return { label: 'Sin datos', color: '#9ca3af', bg: '#f3f4f6', text: '#6b7280', emoji: '⚪' }
    if (p < 3)  return { label: 'Muy bajo', color: '#dc2626', bg: '#fee2e2', text: '#991b1b', emoji: '🔴' }
    if (p < 15) return { label: 'Bajo', color: '#f97316', bg: '#ffedd5', text: '#9a3412', emoji: '🟠' }
    if (p < 85) return { label: 'Normal', color: '#16a34a', bg: '#dcfce7', text: '#14532d', emoji: '🟢' }
    if (p < 97) return { label: 'Alto', color: '#f97316', bg: '#ffedd5', text: '#9a3412', emoji: '🟠' }
    return { label: 'Muy alto', color: '#dc2626', bg: '#fee2e2', text: '#991b1b', emoji: '🔴' }
  }

  const getBmiInterpretation = (b) => {
    if (!b) return { label: 'Sin datos', color: '#9ca3af', bg: '#f3f4f6', text: '#6b7280', emoji: '⚪' }
    if (b < 13)  return { label: 'Muy bajo', color: '#dc2626', bg: '#fee2e2', text: '#991b1b', emoji: '🔴' }
    if (b < 15)  return { label: 'Bajo peso', color: '#f97316', bg: '#ffedd5', text: '#9a3412', emoji: '🟠' }
    if (b < 18)  return { label: 'Normal', color: '#16a34a', bg: '#dcfce7', text: '#14532d', emoji: '🟢' }
    if (b < 22)  return { label: 'Saludable', color: '#16a34a', bg: '#dcfce7', text: '#14532d', emoji: '🟢' }
    if (b < 25)  return { label: 'Límite alto', color: '#f97316', bg: '#ffedd5', text: '#9a3412', emoji: '🟠' }
    return { label: 'Sobrepeso', color: '#dc2626', bg: '#fee2e2', text: '#991b1b', emoji: '🔴' }
  }

  const wBand = getPercentileBand(pWeight)
  const hBand = getPercentileBand(pHeight)
  const bBand = getBmiInterpretation(bmi)

  const trendArrow = (curr, prev) => {
    if (!curr || !prev) return null
    const diff = curr - prev
    if (Math.abs(diff) < 0.5) return { icon: '→', color: '#6b7280', label: 'Estable' }
    if (diff > 0) return { icon: '↑', color: '#16a34a', label: `+${diff.toFixed(1)}` }
    return { icon: '↓', color: '#3b82f6', label: `${diff.toFixed(1)}` }
  }

  const weightTrend = trendArrow(
    current?.weight ? convertWeight(current.weight, true) : null,
    previous?.weight ? convertWeight(previous.weight, true) : null
  )
  const heightTrend = trendArrow(
    current?.height ? convertHeight(current.height, true) : null,
    previous?.height ? convertHeight(previous.height, true) : null
  )

  const getParentSummary = () => {
    const allGreen = wBand.label === 'Normal' || wBand.label === 'Saludable'
    const allGreenH = hBand.label === 'Normal' || hBand.label === 'Saludable'
    if (allGreen && allGreenH) return '✅ El/la niño/a está creciendo dentro del rango esperado para su edad.'
    if (pWeight < 3 || pHeight < 3) return '⚠️ Algunos valores están fuera del rango esperado. Consulta las recomendaciones del doctor.'
    if (pWeight > 97 || pHeight > 97) return '⚠️ Algunos valores están por encima del rango esperado. El doctor revisará el plan de seguimiento.'
    return '📊 El crecimiento está en monitoreo. Sigue las indicaciones del doctor.'
  }

  const idealWeightDisplay = ideal?.weight ? convertWeight(ideal.weight, true) : null
  const idealHeightDisplay = ideal?.height ? convertHeight(ideal.height, true) : null
  const currentWeightDisplay = current?.weight ? convertWeight(current.weight, true) : null
  const currentHeightDisplay = current?.height ? convertHeight(current.height, true) : null

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {healthStatus && (
        <div className="p-4 rounded-2xl text-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: healthStatus.color }}>
          {healthStatus.label}
          {bmi && <span className="ml-2 font-normal opacity-90 text-base">(IMC: {bmi.toFixed(1)})</span>}
        </div>
      )}

      {/* Metric cards — traffic lights */}
      <div className="grid grid-cols-3 gap-4">
        {/* Weight */}
        <div className="rounded-2xl border-2 p-4 text-center space-y-2" style={{ borderColor: wBand.color, backgroundColor: wBand.bg }}>
          <div className="text-2xl">{wBand.emoji}</div>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: wBand.text }}>Peso</div>
          <div className="text-3xl font-black" style={{ color: wBand.color }}>
            {pWeight != null ? `p${Math.round(pWeight)}` : '–'}
          </div>
          <div className="text-xs font-semibold" style={{ color: wBand.text }}>{wBand.label}</div>
          {currentWeightDisplay && (
            <div className="text-xs text-gray-500 font-medium">{currentWeightDisplay} {weightUnit}</div>
          )}
          {weightTrend && (
            <div className="text-xs font-bold flex items-center justify-center gap-1" style={{ color: weightTrend.color }}>
              <span className="text-base">{weightTrend.icon}</span>
              <span>{weightTrend.label} {weightUnit}</span>
            </div>
          )}
        </div>

        {/* Height */}
        <div className="rounded-2xl border-2 p-4 text-center space-y-2" style={{ borderColor: hBand.color, backgroundColor: hBand.bg }}>
          <div className="text-2xl">{hBand.emoji}</div>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: hBand.text }}>Talla</div>
          <div className="text-3xl font-black" style={{ color: hBand.color }}>
            {pHeight != null ? `p${Math.round(pHeight)}` : '–'}
          </div>
          <div className="text-xs font-semibold" style={{ color: hBand.text }}>{hBand.label}</div>
          {currentHeightDisplay && (
            <div className="text-xs text-gray-500 font-medium">{currentHeightDisplay} {heightUnit}</div>
          )}
          {heightTrend && (
            <div className="text-xs font-bold flex items-center justify-center gap-1" style={{ color: heightTrend.color }}>
              <span className="text-base">{heightTrend.icon}</span>
              <span>{heightTrend.label} {heightUnit}</span>
            </div>
          )}
        </div>

        {/* BMI */}
        <div className="rounded-2xl border-2 p-4 text-center space-y-2" style={{ borderColor: bBand.color, backgroundColor: bBand.bg }}>
          <div className="text-2xl">{bBand.emoji}</div>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: bBand.text }}>IMC</div>
          <div className="text-3xl font-black" style={{ color: bBand.color }}>
            {bmi ? bmi.toFixed(1) : '–'}
          </div>
          <div className="text-xs font-semibold" style={{ color: bBand.text }}>{bBand.label}</div>
          {idealWeightDisplay && idealHeightDisplay && (
            <div className="text-xs text-gray-500">
              Ideal: {idealWeightDisplay} {weightUnit} / {idealHeightDisplay} {heightUnit}
            </div>
          )}
        </div>
      </div>

      {/* Parent-friendly summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200 font-medium">
        {getParentSummary()}
      </div>

      {/* Percentile legend */}
      <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-500">
        <span className="flex items-center gap-1">🔴 &lt;p3 Muy bajo</span>
        <span className="flex items-center gap-1">🟠 p3–p15 Bajo</span>
        <span className="flex items-center gap-1">🟢 p15–p85 Normal</span>
        <span className="flex items-center gap-1">🟠 p85–p97 Alto</span>
        <span className="flex items-center gap-1">🔴 &gt;p97 Muy alto</span>
      </div>
    </div>
  )
}

// ── Improved Silhouette ──────────────────────────────────────────────────────

function AdvancedSilhouetteView({ current, previous, ideal, healthStatus, transform3D, bmi, weightUnit, heightUnit }) {
  const heights = [current.height, ideal.height, previous?.height].filter(Boolean)
  const maxCm = Math.max(...heights)

  const SCENE_LIMIT_CM = maxCm * 1.18
  const VIEWPORT_HEIGHT = 300
  const pxPerCm = VIEWPORT_HEIGHT / SCENE_LIMIT_CM

  const getPos = (cm) => cm * pxPerCm

  const currentY = getPos(current.height)
  const idealY = getPos(ideal.height)
  const previousY = previous ? getPos(previous.height) : null

  // Exaggerate width differences — amplify BMI/weight ratio visually
  const rawWidthScale = transform3D?.scaleXZ || (current.weight / ideal.weight) || 1
  // Map 0.7–1.3 ratio → 0.55–1.45 visual (amplify 1.5x around 1.0)
  const amplifiedWidthScale = 1 + (rawWidthScale - 1) * 1.8
  const currentWidthScale = Math.max(0.55, Math.min(1.55, amplifiedWidthScale))

  // Exaggerate height — visual should be amplified
  const heightRatio = current.height / ideal.height
  const prevHeightRatio = previous ? previous.height / ideal.height : null

  // Amplify: actual pxPerCm stays, but figure scale is exaggerated relative to ideal
  // Visual height = actual cm * pxPerCm but with width exaggerated
  const bodyFatIntensity = transform3D?.bodyFatIntensity || Math.max(0, rawWidthScale - 1) * 0.6
  const abdominalExpansion = transform3D?.abdominalExpansion || 0

  const statusColor = healthStatus?.color || '#3b82f6'

  return (
    <div className="bg-gradient-to-b from-blue-50 via-white to-slate-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 rounded-2xl p-5 overflow-hidden">
      {healthStatus && (
        <div className="mb-4 p-3 rounded-xl text-center text-white font-bold shadow-md" style={{ backgroundColor: healthStatus.color }}>
          {healthStatus.label} — IMC: {bmi?.toFixed(1) || '–'}
        </div>
      )}

      {/* Figures area */}
      <div className="relative bg-slate-50/80 dark:bg-gray-900/30 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden"
        style={{ height: VIEWPORT_HEIGHT + 120 }}>

        {/* Height ruler */}
        <div className="absolute left-2 bottom-[80px] top-4 w-10 border-r border-slate-200 dark:border-white/10">
          {Array.from({ length: Math.floor(SCENE_LIMIT_CM / 10) + 1 }, (_, i) => i * 10).map(cm => {
            const b = getPos(cm)
            if (b < 0 || b > VIEWPORT_HEIGHT + 5) return null
            return (
              <div key={cm} className="absolute right-0 flex items-center" style={{ bottom: `${b}px` }}>
                <span className="text-[9px] font-bold text-slate-400 mr-1">{cm}</span>
                <div className="w-2 h-px bg-slate-300 dark:bg-white/20" />
              </div>
            )
          })}
        </div>

        {/* Reference lines */}
        <div className="absolute left-12 right-4 border-t-2 border-dashed border-green-500/40"
          style={{ bottom: `${idealY + 80}px` }}>
          <span className="absolute -top-4 right-0 text-[9px] font-bold text-green-600/70 bg-white/70 dark:bg-gray-900/70 px-1 rounded">
            Ideal OMS ({ideal.displayHeight}{heightUnit})
          </span>
        </div>

        <div className="absolute left-12 right-4 border-t-2 border-dashed" style={{ bottom: `${currentY + 80}px`, borderColor: statusColor + '80' }}>
          <span className="absolute -top-5 left-2 flex items-center gap-1">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: statusColor }}>
              Actual ({current.displayHeight}{heightUnit})
            </span>
            <span className="text-[9px] font-semibold text-slate-600 dark:text-gray-300 bg-white/70 dark:bg-gray-900/70 px-1 rounded">
              {current.height > ideal.height ? '+' : ''}{(current.height - ideal.height).toFixed(1)} cm vs ideal
            </span>
          </span>
        </div>

        {previous && (
          <div className="absolute left-12 right-4 border-t border-dashed border-blue-400/30"
            style={{ bottom: `${previousY + 80}px` }}>
            <span className="absolute -top-4 left-1/3 text-[9px] font-bold text-blue-500/70 bg-white/70 dark:bg-gray-900/70 px-1 rounded">
              Anterior ({previous.displayHeight}{heightUnit})
            </span>
          </div>
        )}

        {/* Figures positioned at floor */}
        <div className="absolute left-12 right-4 flex justify-around items-end" style={{ bottom: '80px', height: VIEWPORT_HEIGHT }}>
          {previous && (
            <FigureWithLabel
              heightCm={previous.height}
              pxPerCm={pxPerCm}
              widthScale={1}
              color="#3b82f6"
              label="Anterior"
              subLabel={`${previous.displayHeight}${heightUnit} / ${previous.displayWeight}${weightUnit}`}
              labelBg="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
              labelText="text-blue-600 dark:text-blue-400"
            />
          )}

          <FigureWithLabel
            heightCm={current.height}
            pxPerCm={pxPerCm}
            widthScale={currentWidthScale}
            color={statusColor}
            bodyFat={bodyFatIntensity}
            label="Actual"
            subLabel={`${current.displayHeight}${heightUnit} / ${current.displayWeight}${weightUnit}`}
            labelBg="bg-white dark:bg-gray-800 border-slate-300 dark:border-slate-600"
            labelText="text-slate-700 dark:text-slate-300"
            isHighlighted
          />

          <FigureWithLabel
            heightCm={ideal.height}
            pxPerCm={pxPerCm}
            widthScale={1}
            color="#22c55e"
            label="Ideal (OMS)"
            subLabel={`${ideal.displayHeight}${heightUnit} / ${ideal.displayWeight}${weightUnit}`}
            labelBg="bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700"
            labelText="text-green-600 dark:text-green-400"
            isIdeal
          />
        </div>
      </div>

      {/* Bottom metrics */}
      {transform3D && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <MetricPill label="Peso vs ideal" value={`${Math.round(transform3D.ratioWeight * 100)}%`}
            color={Math.abs(transform3D.ratioWeight - 1) > 0.15 ? '#ef4444' : Math.abs(transform3D.ratioWeight - 1) > 0.05 ? '#f97316' : '#16a34a'} />
          <MetricPill label="Talla vs ideal" value={`${Math.round(transform3D.ratioHeight * 100)}%`}
            color={transform3D.ratioHeight < 0.9 ? '#f97316' : '#16a34a'} />
          <MetricPill label="IMC" value={bmi?.toFixed(1) || '–'} color={healthStatus?.color || '#6b7280'} />
        </div>
      )}
    </div>
  )
}

function FigureWithLabel({ heightCm, pxPerCm, widthScale, color, bodyFat = 0, label, subLabel, labelBg, labelText, isIdeal = false, isHighlighted = false }) {
  const SVG_BASE_HEIGHT = 160
  const SVG_BASE_WIDTH = 100
  const displayH = heightCm * pxPerCm
  const displayW = (SVG_BASE_WIDTH * (displayH / SVG_BASE_HEIGHT)) * widthScale

  // Body proportions scale with bodyFat for visible difference
  const headR = 19 + bodyFat * 3
  const neckW = 14 + bodyFat * 3
  const torsoW = 44 + bodyFat * 18  // much wider range
  const torsoH = 50
  const armW = 13 + bodyFat * 5
  const armH = 48
  const legW = 18 + bodyFat * 7

  return (
    <div className="flex flex-col items-center">
      <svg width={displayW} height={displayH} viewBox={`0 0 ${SVG_BASE_WIDTH} ${SVG_BASE_HEIGHT}`}
        className={isHighlighted ? 'drop-shadow-lg' : 'drop-shadow-sm'}>
        <defs>
          <linearGradient id={`g${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.75" />
          </linearGradient>
        </defs>
        <g transform="translate(50,0)">
          {/* Head */}
          <circle cx="0" cy={headR} r={headR} fill={`url(#g${color.replace('#','')})`} />
          {/* Eyes */}
          <circle cx="-6" cy={headR - 2} r="2" fill="white" opacity="0.7" />
          <circle cx="6" cy={headR - 2} r="2" fill="white" opacity="0.7" />
          <g transform={`translate(0,${headR * 2 - 2})`}>
            {/* Neck */}
            <rect x={-neckW/2} y="0" width={neckW} height="6" fill={`url(#g${color.replace('#','')})`} />
            {/* Torso */}
            <rect x={-torsoW/2} y="4" width={torsoW} height={torsoH} rx={torsoW * 0.18} fill={`url(#g${color.replace('#','')})`} />
            {/* Arms */}
            <rect x={-torsoW/2 - armW + 3} y="6" width={armW} height={armH} rx={armW/2} fill={`url(#g${color.replace('#','')})`} transform="rotate(12, 0, 6)" />
            <rect x={torsoW/2 - 3} y="6" width={armW} height={armH} rx={armW/2} fill={`url(#g${color.replace('#','')})`} transform="rotate(-12, 0, 6)" />
            {/* Legs */}
            <g transform={`translate(0,${torsoH + 2})`}>
              <rect x={-torsoW * 0.28} y="0" width={legW} height={160 - (headR * 2) - torsoH - 10} rx="4" fill={`url(#g${color.replace('#','')})`} />
              <rect x={torsoW * 0.28 - legW} y="0" width={legW} height={160 - (headR * 2) - torsoH - 10} rx="4" fill={`url(#g${color.replace('#','')})`} />
            </g>
          </g>
          {/* Ideal dashed outline overlay */}
          {isIdeal && <circle cx="0" cy={headR} r={headR + 1} fill="none" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" />}
        </g>
      </svg>
      {/* Label below figure */}
      <div className={`mt-2 text-center rounded-xl px-3 py-2 shadow-sm min-w-[100px] border-2 ${labelBg}`}>
        <p className={`text-xs font-bold ${labelText}`}>{label}</p>
        <p className={`text-[10px] mt-0.5 ${labelText} opacity-80`}>{subLabel}</p>
      </div>
    </div>
  )
}

function MetricPill({ label, value, color }) {
  return (
    <div className="text-center p-3 bg-white dark:bg-gray-700/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-xl font-black" style={{ color }}>{value}</div>
    </div>
  )
}

function BarColumn({ label, value, max, color, unit, isIdeal }) {
  const percentage = Math.max(10, (value / max) * 100)
  return (
    <div className="flex flex-col items-center gap-2 w-16">
      <span className="text-xs font-bold" style={{ color }}>{value}{unit}</span>
      <div className="w-full h-44 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex flex-col justify-end shadow-inner">
        <div className={`w-full rounded-t-lg transition-all duration-700 ${isIdeal ? 'border-2 border-dashed border-green-700' : ''}`}
          style={{ height: `${percentage}%`, backgroundColor: color, opacity: isIdeal ? 0.7 : 1 }} />
      </div>
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </div>
  )
}

function MetricCard({ label, value, color, icon }) {
  return (
    <div className="text-center p-3 bg-white dark:bg-gray-700/80 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  )
}
