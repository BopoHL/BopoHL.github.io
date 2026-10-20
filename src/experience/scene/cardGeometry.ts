import { PlaneGeometry } from "three";

export const createCardGeometry = (width: number, height: number, lift: number, curl: number) => {
  const geometry = new PlaneGeometry(width, height, 14, 14);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i) / width;
    const fromTop = 0.5 - position.getY(i) / height;
    const sag = fromTop * fromTop;
    position.setZ(i, lift * sag + curl * x * x * fromTop * 4);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
};
