import * as THREE from 'three/webgpu'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export default class Room {
  constructor({ scene, gui }) {
    this.group = new THREE.Group()
    this.group.position.set(0, 0, -50)
    this.group.rotation.set(0, Math.PI, 0)
    this.group.scale.setScalar(150)
    scene.add(this.group)

    this.materials = []
    this.materialSettings = { roughness: 0, metalness: 2, emissive: 0.4 }

    new GLTFLoader().load('/models/hallway.glb', async (gltf) => {
      const model = gltf.scene
      await this.convertUnlitMaterials(gltf)
      model.updateMatrixWorld(true)

      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const normalize = 1 / Math.max(size.x, size.y, size.z)

      model.position.sub(center).multiplyScalar(normalize)
      model.scale.multiplyScalar(normalize)

      model.traverse((child) => {
        if (!child.isMesh) return
        const material = child.material
        if (this.materials.some((m) => m.material === material)) return
        this.materials.push({
          material,
          roughness: material.roughness,
          metalness: material.metalness,
          emissiveIntensity: material.emissiveIntensity
        })
      })
      this.updateMaterials()

      this.group.add(model)
    })

    this.setGui(gui)
  }

  async convertUnlitMaterials(gltf) {
    const { parser } = gltf
    const converted = new Map()

    const convert = async (material) => {
      if (!material.isMeshBasicMaterial) return material
      if (converted.has(material)) return converted.get(material)

      const standard = new THREE.MeshStandardMaterial({
        name: material.name,
        map: material.map,
        color: material.color,
        side: material.side,
        transparent: material.transparent,
        opacity: material.opacity,
        alphaTest: material.alphaTest,
        roughness: 1,
        metalness: 0
      })

      const index = parser.associations.get(material)?.materials
      const definition = parser.json.materials?.[index]
      if (definition?.emissiveTexture) {
        standard.emissiveMap = await parser.getDependency('texture', definition.emissiveTexture.index)
        standard.emissiveMap.colorSpace = THREE.SRGBColorSpace
        standard.emissive.fromArray(definition.emissiveFactor ?? [1, 1, 1])
        standard.emissiveIntensity = definition.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? 1
      }

      converted.set(material, standard)
      material.dispose()
      return standard
    }

    const meshes = []
    gltf.scene.traverse((child) => { if (child.isMesh) meshes.push(child) })
    for (const mesh of meshes) {
      mesh.material = Array.isArray(mesh.material)
        ? await Promise.all(mesh.material.map(convert))
        : await convert(mesh.material)
    }
    
  }

  updateMaterials() {
    const { roughness, metalness, emissive } = this.materialSettings
    for (const entry of this.materials) {
      entry.material.roughness = THREE.MathUtils.clamp(entry.roughness * roughness, 0, 1)
      entry.material.metalness = THREE.MathUtils.clamp(entry.metalness * metalness, 0, 1)
      entry.material.emissiveIntensity = entry.emissiveIntensity * emissive
    }
  }

  setGui(gui) {
    const folder = gui.addFolder('Room')
    folder.close()

    const position = folder.addFolder('Position')
    position.add(this.group.position, 'x', -50, 50, 0.01)
    position.add(this.group.position, 'y', -50, 50, 0.01)
    position.add(this.group.position, 'z', -50, 50, 0.01)

    const rotation = folder.addFolder('Rotation')
    rotation.add(this.group.rotation, 'x', -Math.PI, Math.PI, 0.01)
    rotation.add(this.group.rotation, 'y', -Math.PI, Math.PI, 0.01)
    rotation.add(this.group.rotation, 'z', -Math.PI, Math.PI, 0.01)

    const materials = folder.addFolder('Materials')
    materials.add(this.materialSettings, 'roughness', 0, 2, 0.01).onChange(() => this.updateMaterials())
    materials.add(this.materialSettings, 'metalness', 0, 2, 0.01).onChange(() => this.updateMaterials())
    materials.add(this.materialSettings, 'emissive', 0, 1, 0.01).onChange(() => this.updateMaterials())

    const scale = { value: this.group.scale.x }
    folder.add(scale, 'value', 1, 150, 0.1).name('scale').onChange((v) => this.group.scale.setScalar(v))
  }
}
