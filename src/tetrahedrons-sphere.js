import React, { useState, useCallback } from 'react';
import { useSpring, a } from 'react-spring/three';
import { Canvas, useFrame } from 'react-three-fiber';
import Stats from 'stats-js';
import { easeOutCubic, easeInCubic } from './easeFunctions';
import ShiftingTetrahedron from './ShiftingTetrahedron';

const stats = new Stats();
document.body.appendChild(stats.dom);

/**
 * PerformanceStats
 * They need to be in a separate component so the `useFrame` call is down
 * the tree of the `<Canvas />` component.
 */
const StatsComponent = () => {
  useFrame(({ gl, scene, camera }) => {
    stats.begin();
    gl.render(scene, camera);
    stats.end();
  }, 1);
  return null;
};

const TetrahedronsSphere = () => {
  /**
   * `light` oscilates from 0.4 to 1
   */
  const { light } = useSpring({
    from: { light: 0.4 },
    to: async (next) => {
      while (true) {
        await next({
          light: 1,
          config: { duration: 1000, easing: easeOutCubic },
        });
        await next({
          light: 0.4,
          config: { duration: 300, easing: easeInCubic },
        });
      }
    },
  });
  const [meshesCount, setMeshesCount] = useState(1);
  const onClickHandler = useCallback(
    () => setMeshesCount((count) => count + 1),
    [],
  );
  return (
    <Canvas camera={{ position: [0, 0, 1.8] }}>
      <StatsComponent />
      <spotLight position={[0, 0, -1.5]} angle={Math.PI / 16} />
      <spotLight position-x={[-1.5, 0, 1.5]} angle={Math.PI / 16} />
      <spotLight position-x={(1.5, 0, 1.5)} angle={Math.PI / 16} />
      <a.pointLight intensity={light} />
      <ambientLight intensity={0.2} />
      {Array(meshesCount)
        .fill()
        .map((_, idx) => (
          <ShiftingTetrahedron key={idx} seed={idx} onClick={onClickHandler} />
        ))}
    </Canvas>
  );
};

export default TetrahedronsSphere;
