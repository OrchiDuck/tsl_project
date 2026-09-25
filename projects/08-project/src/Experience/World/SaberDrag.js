import * as THREE from 'three/webgpu'

export default class SaberDrag {
  constructor({ camera, controls, canvas, rig, target, onClick }) {
    this.camera = camera
    this.controls = controls
    this.canvas = canvas
    this.rig = rig
    this.target = target
    this.onClick = onClick

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.dragPlane = new THREE.Plane()
    this.dragPoint = new THREE.Vector3()

    this.active = false
    this.offsetX = 0
    this.targetX = 0
    this.downPosition = new THREE.Vector2()
    this.clickThreshold = 5

    canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event), { capture: true })
    canvas.addEventListener('pointermove', (event) => this.onPointerMove(event))
    canvas.addEventListener('pointerup', (event) => this.onPointerUp(event))
    canvas.addEventListener('pointercancel', (event) => this.onPointerUp(event))
  }

  updatePointer(event) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
  }

  isHovering() {
    return this.raycaster.intersectObject(this.target, true).length > 0
  }

  intersectDragPlane() {
    const normal = this.camera.getWorldDirection(new THREE.Vector3()).setX(0).normalize()
    this.dragPlane.setFromNormalAndCoplanarPoint(normal, this.rig.position)
    return this.raycaster.ray.intersectPlane(this.dragPlane, this.dragPoint)
  }

  onPointerDown(event) {
    this.updatePointer(event)
    if (!this.isHovering()) return
    if (!this.intersectDragPlane()) return

    this.active = true
    this.downPosition.set(event.clientX, event.clientY)
    this.offsetX = this.rig.position.x - this.dragPoint.x
    this.targetX = this.rig.position.x
    this.controls.enabled = false
    this.canvas.setPointerCapture(event.pointerId)
    document.body.style.cursor = 'grabbing'
  }

  onPointerMove(event) {
    this.updatePointer(event)
    if (this.active) {
      if (this.intersectDragPlane()) this.targetX = this.dragPoint.x + this.offsetX
      return
    }
    document.body.style.cursor = this.isHovering() ? 'grab' : ''
  }

  onPointerUp(event) {
    if (!this.active) return
    this.active = false
    this.targetX = 0
    this.controls.enabled = true
    this.canvas.releasePointerCapture(event.pointerId)
    document.body.style.cursor = 'grab'

    const distance = this.downPosition.distanceTo(new THREE.Vector2(event.clientX, event.clientY))
    if (distance < this.clickThreshold) this.onClick?.()
  }
}
