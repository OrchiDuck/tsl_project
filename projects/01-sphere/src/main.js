import * as THREE from 'three/webgpu'
import { color, mix, normalView, time, sin } from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 4)

const renderer = new THREE.WebGPURenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const material = new THREE.MeshBasicNodeMaterial()
const fresnel = normalView.z.oneMinus().pow(2)
const baseColor = mix(color('#1e3a8a'), color('#f472b6'), sin(time).mul(0.5).add(0.5))
material.colorNode = mix(baseColor, color('#ffffff'), fresnel)

const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), material)
scene.add(sphere)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
})
