import { Frustum, Matrix4, type Box3, type Camera } from "three";

export class InView {
  private readonly frustum = new Frustum();
  private readonly viewProjection = new Matrix4();

  constructor(private readonly box: Box3) {}

  seenBy(camera: Camera) {
    camera.updateMatrixWorld();
    this.viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    return this.frustum.setFromProjectionMatrix(this.viewProjection).intersectsBox(this.box);
  }
}
