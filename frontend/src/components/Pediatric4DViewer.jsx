import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import * as THREE from 'three'

// ─── CONSTANTS & HELPERS ───────────────────────────────────────────────────
const BASE_HEIGHT = 3.2 // Base figure height in scene units

function computeIMC(w, h) { return w / ((h / 100) ** 2) }

function computeFat(weight, idealWeight, height, idealHeight) {
  const bmi = computeIMC(weight, height)
  if (bmi > 30) return Math.min(1.0, 0.7 + (bmi - 30) * 0.02)
  else if (bmi > 25) return 0.35 + (bmi - 25) * 0.07
  else if (bmi > 18) return Math.max(0, (bmi - 18) * 0.05)
  else return 0
}

// ─── MATERIALS ───────────────────────────────────────────────────────────
const skinMat = new THREE.MeshPhongMaterial({
  color: 0x7788bb,
  emissive: 0x221133,
  shininess: 28,
  specular: 0x443366,
})

const skinDarkMat = new THREE.MeshPhongMaterial({
  color: 0x5566aa,
  emissive: 0x110022,
  shininess: 28,
  specular: 0x443366,
})

const shortsMat = new THREE.MeshPhongMaterial({ color: 0xcc4466, emissive: 0x330011, shininess: 15 })
const eyeMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x222222, shininess: 80 })
const pupilMat = new THREE.MeshPhongMaterial({ color: 0x111122, shininess: 100 })

// ─── BODY BUILDER ────────────────────────────────────────────────────────────
function buildBody(fat = 0, heightScale = 1, ageMonths = 51, isIdeal = false) {
  const root = new THREE.Group()

  // Age-based head proportion
  const headProportion = ageMonths < 24 ? 0.28 : ageMonths < 60 ? 0.22 : ageMonths < 120 ? 0.18 : 0.15
  
  // Fat morphing factors
  const fw = 1 + fat * 0.85   
  const fwH = 1 + fat * 0.50   
  const fwT = 1 + fat * 1.30   
  const fwL = 1 + fat * 0.70   
  const fwA = 1 + fat * 0.55   

  const H = heightScale          
  const BASE = BASE_HEIGHT      

  // Skin material selection
  const currentSkinMat = isIdeal ? skinMat.clone() : skinMat
  const currentSkinDarkMat = isIdeal ? skinDarkMat.clone() : skinDarkMat
  
  if (isIdeal) {
    currentSkinMat.color.set(0x4499aa)
    currentSkinMat.emissive.set(0x113322)
    currentSkinDarkMat.color.set(0x337788)
    currentSkinDarkMat.emissive.set(0x0a221a)
    currentSkinMat.transparent = true
    currentSkinMat.opacity = 0.6
    currentSkinDarkMat.transparent = true
    currentSkinDarkMat.opacity = 0.6
  }

  // ── HEAD ─────────────────────────────────────────────────────────────────
  const headR = BASE * headProportion * fwH
  const headRy = headR * (1 + fat * 0.25) 
  const neckW = 0.13 * fw
  const neckH = BASE * 0.065

  const headGeo = new THREE.SphereGeometry(headR, 24, 20)
  headGeo.applyMatrix4(new THREE.Matrix4().makeScale(fwH * 0.95, 1 - fat * 0.05, 0.88 + fat * 0.08))
  
  const head = new THREE.Mesh(headGeo, currentSkinMat)
  const headTopY = (BASE * H) / 2 - headRy
  const headY = headTopY - headR * 0.05
  head.position.y = headY * H
  root.add(head)

  // Ears
  const earGeo = new THREE.SphereGeometry(headR * 0.28 * fwH, 10, 10)
  const lEar = new THREE.Mesh(earGeo, currentSkinDarkMat)
  lEar.position.set(-headR * (0.92 + fat * 0.1), headY * H - headR * 0.05, 0)
  lEar.scale.z = 0.55
  root.add(lEar)
  const rEar = lEar.clone()
  rEar.position.x *= -1
  root.add(rEar)

  // Eyes
  const eyeR = headR * 0.13
  const eyeY = headY * H + headR * 0.12
  const eyeZ = headR * 0.78
  const eyeX = headR * 0.28 * (1 - fat * 0.05)
  ;[-1, 1].forEach(side => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 12, 10), eyeMat)
    eye.position.set(side * eyeX, eyeY, eyeZ)
    root.add(eye)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.55, 10, 8), pupilMat)
    pupil.position.set(side * eyeX, eyeY, eyeZ + eyeR * 0.6)
    root.add(pupil)
  })

  // Nose bump
  const noseGeo = new THREE.SphereGeometry(headR * 0.12, 8, 8)
  const nose = new THREE.Mesh(noseGeo, currentSkinDarkMat)
  nose.position.set(0, headY * H - headR * 0.08, headR * 0.9)
  nose.scale.set(1 + fat * 0.3, 1 + fat * 0.2, 0.6)
  root.add(nose)

  // ── NECK ──────────────────────────────────────────────────────────────────
  const neckGeo = new THREE.CylinderGeometry(neckW * 1.05 * fw, neckW * 1.1 * fw, neckH, 14)
  const neck = new THREE.Mesh(neckGeo, currentSkinMat)
  const neckY = headY * H - headR - neckH / 2
  neck.position.y = neckY
  root.add(neck)

  // ── TORSO ─────────────────────────────────────────────────────────────────
  const shoulderW = 0.44 * fwT * fw
  const hipW = 0.40 * fwT * fw
  const torsoH = BASE * H * 0.30
  const torsoY = neckY - neckH / 2 - torsoH / 2

  const torsoGeo = new THREE.CylinderGeometry(0.33 * fwT * fw, hipW, torsoH, 18, 4)
  const pos = torsoGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const t = (y / (torsoH / 2) + 1) / 2  
    const shoulderBulge = t > 0.6 ? (t - 0.6) / 0.4 : 0
    const bellySag = fat * 0.12 * Math.sin(Math.PI * (1 - t))
    const newR = Math.sqrt(x * x + z * z) * (1 + shoulderBulge * 0.35)
    const angle = Math.atan2(z, x)
    pos.setX(i, Math.cos(angle) * newR)
    pos.setY(i, y + (i < pos.count / 2 ? bellySag : 0))
    pos.setZ(i, Math.sin(angle) * newR)
  }
  pos.needsUpdate = true
  torsoGeo.computeVertexNormals()

  const torso = new THREE.Mesh(torsoGeo, currentSkinMat)
  torso.position.y = torsoY
  root.add(torso)

  if (fat > 0.3) {
    const bellyScale = (fat - 0.3) / 0.7
    const bellyGeo = new THREE.SphereGeometry(hipW * 0.75 * bellyScale, 20, 16)
    bellyGeo.applyMatrix4(new THREE.Matrix4().makeScale(1, 0.7, 0.85))
    const belly = new THREE.Mesh(bellyGeo, currentSkinMat)
    belly.position.set(0, torsoY - torsoH * 0.18, hipW * 0.45)
    root.add(belly)
  }

  // Shorts
  const shortsH = torsoH * 0.5
  const shortsGeo = new THREE.CylinderGeometry(hipW * 1.05, hipW * 1.08, shortsH, 16)
  const shorts = new THREE.Mesh(shortsGeo, shortsMat)
  shorts.position.y = torsoY - torsoH / 2 - shortsH / 2 + 0.04
  root.add(shorts)

  // ── ARMS ──────────────────────────────────────────────────────────────────
  const upperArmL = BASE * H * 0.22
  const lowerArmL = BASE * H * 0.20
  const upperArmR_top = 0.12 * fwA
  const upperArmR_bot = 0.10 * fwA

  ;[-1, 1].forEach(side => {
    const armX = side * (shoulderW + 0.12 * fwA)
    const armStartY = torsoY + torsoH * 0.38

    const upperGeo = new THREE.CylinderGeometry(upperArmR_top, upperArmR_bot, upperArmL, 12)
    const upper = new THREE.Mesh(upperGeo, currentSkinMat)
    upper.position.set(armX + side * 0.04, armStartY - upperArmL / 2, 0.04)
    upper.rotation.z = side * (-0.18 - fat * 0.12)
    upper.rotation.x = 0.08
    root.add(upper)

    const elbowY = armStartY - upperArmL
    const elbowX = armX + side * 0.06
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(upperArmR_bot * 1.05, 10, 8), currentSkinDarkMat)
    elbow.position.set(elbowX, elbowY, 0.04)
    elbow.scale.set(fwA, 1, fwA * 0.85)
    root.add(elbow)

    const lowerGeo = new THREE.CylinderGeometry(upperArmR_bot * 0.92, upperArmR_bot * 0.78, lowerArmL, 12)
    const lower = new THREE.Mesh(lowerGeo, currentSkinMat)
    lower.position.set(elbowX + side * 0.03, elbowY - lowerArmL / 2, 0.06)
    lower.rotation.z = side * (-0.10 - fat * 0.08)
    lower.rotation.x = 0.12
    root.add(lower)

    const handGeo = new THREE.SphereGeometry(upperArmR_bot * 0.85, 10, 8)
    handGeo.applyMatrix4(new THREE.Matrix4().makeScale(1.2, 0.7, 0.85))
    const hand = new THREE.Mesh(handGeo, currentSkinDarkMat)
    hand.position.set(elbowX + side * 0.05, elbowY - lowerArmL - upperArmR_bot * 0.5, 0.1)
    root.add(hand)
  })

  // ── LEGS ──────────────────────────────────────────────────────────────────
  const thighL = BASE * H * 0.26
  const shinL = BASE * H * 0.24
  const thighR = 0.175 * fwL
  const shinR = 0.135 * fwL
  const kneeSep = hipW * 0.44 * (1 + fat * 0.35)

  ;[-1, 1].forEach(side => {
    const legX = side * kneeSep * 0.55
    const thighGeo = new THREE.CylinderGeometry(thighR * 1.05, thighR * 0.88, thighL, 14)
    const thigh = new THREE.Mesh(thighGeo, currentSkinMat)
    const hipY = torsoY - torsoH / 2
    thigh.position.set(legX, hipY - thighL / 2, 0.02)
    thigh.rotation.z = side * fat * 0.06
    root.add(thigh)

    const kneeY = hipY - thighL
    const knee = new THREE.Mesh(new THREE.SphereGeometry(shinR * 1.1, 10, 8), currentSkinDarkMat)
    knee.position.set(legX, kneeY, 0.02)
    knee.scale.set(fwL, 0.9, 0.85)
    root.add(knee)

    const shinGeo = new THREE.CylinderGeometry(shinR * 0.95, shinR * 0.72, shinL, 12)
    const shin = new THREE.Mesh(shinGeo, currentSkinMat)
    shin.position.set(legX + side * 0.01, kneeY - shinL / 2, -0.01)
    root.add(shin)

    const footY = kneeY - shinL - shinR * 0.7
    const foot = new THREE.Mesh(new THREE.SphereGeometry(shinR * 0.85, 10, 8), currentSkinDarkMat)
    foot.position.set(legX, footY, 0.0)
    foot.scale.set(1, 0.65, 1.55)
    root.add(foot)
  })

  root.position.y = -BASE * H / 2 + 0.1
  root.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true } })

  return root
}

// ─── SHADOW BLOB ──────────────────────────────────────────────────────────────
function makeShadow(fatScale) {
  const geo = new THREE.CircleGeometry(0.5 + fatScale * 0.3, 32)
  const scaleY = (0.15 + fatScale * 0.08) / (0.5 + fatScale * 0.3)
  const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  const m = new THREE.Mesh(geo, mat)
  m.scale.set(1, scaleY, 1)
  m.rotation.x = -Math.PI / 2
  m.position.y = -1.99
  return m
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Pediatric4DViewer({
  edadEnMeses = 51,
  currentWeight = 0,
  currentHeight = 0,
  idealWeight = 19.5,
  idealHeight = 107.5,
  healthStatus,
  bmi,
  transform3D,
}) {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const patientRef = useRef(null)
  const idealRef = useRef(null)
  const shadowPatientRef = useRef(null)
  const shadowIdealRef = useRef(null)
  
  const [sph, setSph] = useState({ theta: 0.05, phi: 1.35, r: 5.5 })
  const draggingRef = useRef(false)
  const pxRef = useRef({ x: 0, y: 0 })

  // ─── INITIALIZATION ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const W = containerRef.current.clientWidth
    const H = 450 // Consistent height

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = null // Transparent for the gradient container
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100)
    cameraRef.current = camera

    // Lights
    scene.add(new THREE.AmbientLight(0x4433aa, 0.35))
    const key = new THREE.DirectionalLight(0xffd4b0, 2.2)
    key.position.set(-2, 4, 3)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    scene.add(key)

    const rim = new THREE.DirectionalLight(0x8888ff, 1.4)
    rim.position.set(3, 2, -3)
    scene.add(rim)

    const bounce = new THREE.HemisphereLight(0x6644bb, 0x221133, 0.4)
    scene.add(bounce)

    // Floor
    const floorGeo = new THREE.CircleGeometry(4, 64)
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x1a1030, transparent: true, opacity: 0.1 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -2.0
    floor.receiveShadow = true
    scene.add(floor)

    // Animation Loop
    let time = 0
    const animate = () => {
      requestAnimationFrame(animate)
      time += 0.008

      if (patientRef.current) patientRef.current.position.y = Math.sin(time * 0.9) * 0.012
      if (idealRef.current) idealRef.current.position.y = Math.sin(time * 0.7 + 1) * 0.009

      camera.position.set(
        sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
        sph.r * Math.cos(sph.phi) + 0.2,
        sph.r * Math.sin(sph.phi) * Math.cos(sph.theta)
      )
      camera.lookAt(0, 0.1, 0)
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      renderer.dispose()
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement)
    }
  }, [])

  // ─── REBUILD MODELS ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return

    // Clear existing
    if (patientRef.current) sceneRef.current.remove(patientRef.current)
    if (idealRef.current) sceneRef.current.remove(idealRef.current)
    if (shadowPatientRef.current) sceneRef.current.remove(shadowPatientRef.current)
    if (shadowIdealRef.current) sceneRef.current.remove(shadowIdealRef.current)

    const fat = computeFat(currentWeight, idealWeight, currentHeight, idealHeight)
    
    // Scale patient relative to ideal
    let currScale = 1.0
    if (currentHeight < idealHeight) {
      currScale = 0.82 + Math.max(0, (currentHeight - (idealHeight - 20)) / 20) * 0.18
    }

    // Build patient
    const patientModel = buildBody(fat, currScale, edadEnMeses, false)
    patientModel.position.x = -1.1
    sceneRef.current.add(patientModel)
    patientRef.current = patientModel

    const shadowP = makeShadow(fat)
    shadowP.position.x = -1.1
    sceneRef.current.add(shadowP)
    shadowPatientRef.current = shadowP

    // Build ideal
    const idealModel = buildBody(0, 1.0, edadEnMeses, true)
    idealModel.position.x = 1.1
    sceneRef.current.add(idealModel)
    idealRef.current = idealModel

    const shadowI = makeShadow(0)
    shadowI.position.x = 1.1
    sceneRef.current.add(shadowI)
    shadowIdealRef.current = shadowI

  }, [currentWeight, currentHeight, idealWeight, idealHeight, edadEnMeses])

  // ─── INTERACTION HANDLERS ──────────────────────────────────────────────────
  const onMouseMove = useCallback((e) => {
    if (!draggingRef.current) return
    setSph(prev => ({
      ...prev,
      theta: prev.theta - (e.clientX - pxRef.current.x) * 0.006,
      phi: Math.max(0.5, Math.min(1.55, prev.phi + (e.clientY - pxRef.current.y) * 0.004))
    }))
    pxRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onWheel = useCallback((e) => {
    setSph(prev => ({
      ...prev,
      r: Math.max(2.5, Math.min(9, prev.r + e.deltaY * 0.008))
    }))
  }, [])

  if (!currentWeight && !currentHeight) {
    return (
      <div className="h-[450px] flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl">
        <div className="w-20 h-20 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-3xl">🧍</div>
        <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Sin datos para modelo 3D</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Registra peso y talla en la consulta</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 select-none">
      <div 
        ref={containerRef} 
        className="h-[450px] cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => { draggingRef.current = true; pxRef.current = { x: e.clientX, y: e.clientY } }}
        onMouseUp={() => draggingRef.current = false}
        onMouseLeave={() => draggingRef.current = false}
        onMouseMove={onMouseMove}
        onWheel={onWheel}
      />
      
      {healthStatus && (
        <div className="absolute top-4 left-4 p-3 rounded-xl text-white font-bold shadow-lg backdrop-blur-md" 
             style={{ backgroundColor: healthStatus.color + 'bb' }}>
          {healthStatus.label} {bmi && <span className="ml-2 opacity-80">(IMC: {bmi.toFixed(1)})</span>}
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 text-[10px] font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#7788bb' }}></span>
          <span>Paciente Actual</span>
        </div>
        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#4499aa' }}></span>
          <span>Ideal (OMS P50)</span>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 flex flex-col gap-2">
         <div className="bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center min-w-[80px]">
            <p className="text-[9px] text-gray-500">PESO</p>
            <p className="text-sm font-black text-emerald-600">{currentWeight} kg</p>
         </div>
         <div className="bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center min-w-[80px]">
            <p className="text-[9px] text-gray-500">TALLA</p>
            <p className="text-sm font-black text-blue-600">{currentHeight} cm</p>
         </div>
      </div>

      <div className="absolute bottom-4 left-4 text-[10px] text-slate-400 font-medium">
        🖱️ Arrastra para rotar · Scroll para zoom
      </div>
    </div>
  )
}
