import { useRef, useEffect } from 'react'
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import {
  TextureLoader, MeshStandardMaterial,
  Box3, Vector3, SRGBColorSpace, LinearToneMapping,
} from 'three'

const BASE  = '/src/model/Meshy_AI_Halo_Loop_0616145511_texture'
const PATHS = {
  fbx:   `${BASE}.fbx`,
  color: `${BASE}.png`,
  norm:  `${BASE}_normal.png`,
  metal: `${BASE}_metallic.png`,
  rough: `${BASE}_roughness.png`,
}

export default function HaloModel() {
  const ref    = useRef()
  const camera = useThree((s) => s.camera)
  const gl     = useThree((s) => s.gl)

  const fbx  = useLoader(FBXLoader, PATHS.fbx)
  const maps = useLoader(TextureLoader, [PATHS.color, PATHS.norm, PATHS.metal, PATHS.rough])

  // Renderer — LinearToneMapping preserves full texture saturation, no filmic desaturation
  useEffect(() => {
    gl.outputColorSpace    = SRGBColorSpace
    gl.toneMapping         = LinearToneMapping
    gl.toneMappingExposure = 1.0
  }, [gl])

  useEffect(() => {
    if (!fbx) return
    const [colorMap, normalMap, metalnessMap, roughnessMap] = maps

    colorMap.colorSpace = SRGBColorSpace

    fbx.traverse((child) => {
      if (!child.isMesh) return
      child.material = new MeshStandardMaterial({
        map:             colorMap,
        normalMap,
        metalnessMap,
        roughnessMap,
        metalness:       0.0,   // zero metalness = pure cartoon diffuse
        roughness:       0.75,  // high roughness = matte soft-toy look
        envMapIntensity: 0.3,   // very low IBL — don't let env wash the colours
      })
      child.castShadow = true
    })

    // Auto-fit camera — model occupies ~22% of screen height
    const box    = new Box3().setFromObject(fbx)
    const size   = new Vector3()
    const center = new Vector3()
    box.getSize(size)
    box.getCenter(center)
    fbx.position.sub(center)

    const maxDim = Math.max(size.x, size.y, size.z)
    const fovRad = (camera.fov * Math.PI) / 180
    const dist   = (maxDim / 2 / Math.tan(fovRad / 2)) * 2.4   // 2.4 = closer than before
    camera.position.set(0, 0, dist)
    camera.near = dist / 100
    camera.far  = dist * 10
    camera.updateProjectionMatrix()
  }, [fbx, maps, camera])

  useEffect(() => {
    if (!fbx || !ref.current) return
    const box  = new Box3().setFromObject(fbx)
    const size = new Vector3()
    box.getSize(size)
    ref.current.userData.floatAmp = size.y * 0.04
  }, [fbx])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.rotation.y = t * 2.2
    ref.current.position.y = Math.sin(t * 0.9) * (ref.current.userData.floatAmp ?? 0.04)
  })

  return (
    <group ref={ref}>
      <primitive object={fbx} />
    </group>
  )
}
