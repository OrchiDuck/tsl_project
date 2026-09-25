import Lightsaber from './Lightsaber.js'
import Room from './Room.js'
import * as THREE from 'three/webgpu'

export default class World {
  constructor({ scene, renderer, camera, controls, canvas, gui }) {
    this.room = new Room({ scene, gui })
    this.lightsaber = new Lightsaber({ scene, renderer, camera, controls, canvas, gui })

    this.hemisphereLight = new THREE.HemisphereLight('#ffffff', '#444444', 0.45)
    scene.add(this.hemisphereLight)

    this.directionalLight = new THREE.DirectionalLight('#ffffff', 0.05)
    this.directionalLight.position.set(5, 5, 5)
    scene.add(this.directionalLight)

    const ambientFolder = gui.addFolder('Ambient')
    ambientFolder.close()
    ambientFolder.add(this.hemisphereLight, 'intensity', 0, 3, 0.001).name('hemisphere')
    ambientFolder.add(this.directionalLight, 'intensity', 0, 5, 0.001).name('directional')
  }

  update(dt) {
    this.lightsaber.update(dt)
  }
}
