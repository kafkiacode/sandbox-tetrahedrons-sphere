import React, { useState, useRef, useCallback } from 'react';
import {
  Vector3,
  Quaternion,
  DoubleSide,
  SphereBufferGeometry,
  Euler,
} from 'three';
import { useFrame, useResource } from 'react-three-fiber';
import { useSpring } from 'react-spring/three';
import Color from 'canvas-sketch-util/color';
import { createRandom } from 'canvas-sketch-util/random';

/**
 * A vector looking up
 */
const baseVector = new Vector3(0, 1, 0);
/**
 * A TetrahedronBufferGeometry repeats three times its position vertices
 */
const vertexIndexes = [
  [0, 8, 10],
  [1, 5, 7],
  [2, 4, 11],
  [3, 6, 9],
];

/**
 * 10 degrees will be the size of our partial sphere patch
 */
const semiSphereGeomSizeArc = 10 * (Math.PI / 180);

/**
 * And this partial sphere will have a square patch of
 * semiSphereGeomSizeArc degrees only in its top part (north pole)
 */
const semiSphereGeom = new SphereBufferGeometry(
  1,
  10,
  10,
  Math.PI / 2 - semiSphereGeomSizeArc,
  semiSphereGeomSizeArc,
  Math.PI / 2 - semiSphereGeomSizeArc,
  semiSphereGeomSizeArc,
);

// Move slightly the sphere so it's centered on the point 0,0
semiSphereGeom
  .lookAt(
    new Vector3(0, 1, 0).applyQuaternion(
      new Quaternion().setFromEuler(new Euler(0, 0, semiSphereGeomSizeArc / 2)),
    ),
  )
  // @TODO: There must be a way to do this without two calls to `lookAt`...
  .lookAt(
    new Vector3(0, 0, 1).applyQuaternion(
      new Quaternion().setFromEuler(new Euler(semiSphereGeomSizeArc / 2, 0, 0)),
    ),
  );

/**
 * Component of a tetrahedron geometry whose vertices are animated with springs
 */
const ShiftingTetrahedron = ({ radius = 1, seed = 0, onClick }) => {
  const [isHover, setIsHover] = useState(false);
  const showVertices = true;
  const [random] = useState(createRandom(seed));
  const vectors = useRef([]);
  const vertexMeshes = useRef([]);
  const patchesMeshes = useRef([]);
  const [geomRef, geom] = useResource();
  const [color] = useState(
    () =>
      Color.parse({
        hsl: [
          random.rangeFloor(255),
          random.rangeFloor(90, 100),
          random.rangeFloor(50, 75),
        ],
      }).hex,
  );

  /**
   * We avoid re-defining toFn on every render, so the animation doesn't restart
   * on state change (as in hovering the mouse over it)
   */
  const toFn = useCallback(
    async (next) => {
      while (true) {
        await next({
          /**
           * A Quaternion pointing to a random coordinate on a sphere
           * @param {*} random
           */
          q: new Quaternion()
            .setFromUnitVectors(baseVector, new Vector3(...random.onSphere()))
            .toArray(),
        });
      }
    },
    [random],
  );

  Array(4)
    .fill()
    .forEach((_, idx) => {
      /**
       * We will disable the rules of hooks because the number of vertices (and of
       * calls to useSpring) is fixed (4).
       */
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useSpring({
        to: toFn,
        onFrame: ({ q: qArr }) => {
          /**
           * Using react-three-fiber to instantiate a new
           * geometry.attributes.position.array on each frame is too slow.
           * Instead, we mutate the existing Float32Array at
           * geometry.attributes.position.array
           */
          vectors.current[idx] = baseVector
            .clone()
            .applyQuaternion(new Quaternion(...qArr))
            .toArray();
          if (showVertices && patchesMeshes.current.length) {
            patchesMeshes.current[idx].quaternion.set(...qArr);
          }
        },
      });
    });

  useFrame(() => {
    vectors.current.forEach((vArr, idx) => {
      vertexIndexes[idx].forEach((pos) =>
        geomRef.current.getAttribute('position').array.set(vArr, pos * 3),
      );
      if (showVertices && vertexMeshes.current.length) {
        vertexMeshes.current[idx].position.set(...vArr);
      }
    });
    geomRef.current.attributes.position.needsUpdate = true;
  });
  return (
    <group scale={[radius, radius, radius]}>
      {/* Our geometry object is defined once. It will be manipulated by the `useFrame`
      hook, and will be shared by the wireframe and the main meshes */}
      <tetrahedronBufferGeometry attach="geometry" ref={geomRef} />
      {/* Mesh for the wireframe that appears when hovering over the mesh */}
      {isHover && (
        <mesh geometry={geom}>
          <meshBasicMaterial attach="material" wireframe />
        </mesh>
      )}
      {/* This is the tetrahedron mesh */}
      {geom && (
        <mesh
          geometry={geom}
          onPointerEnter={(evt) => {
            evt.stopPropagation();
            setIsHover(true);
          }}
          onPointerLeave={(evt) => {
            evt.stopPropagation();
            setIsHover(false);
          }}
          onClick={onClick}
        >
          <meshLambertMaterial
            transparent
            color={color}
            opacity={isHover ? 1 : 0.6}
            attach="material"
            side={DoubleSide}
          />
        </mesh>
      )}
      {/* Box vertices */}
      {showVertices &&
        vectors.current.map((_, idx) => (
          <mesh
            key={idx}
            scale={[0.025, 0.025, 0.025]}
            ref={(mesh) => {
              vertexMeshes.current[idx] = mesh;
            }}
          >
            <boxBufferGeometry attach="geometry" />
            <meshLambertMaterial color={0xffffff} attach="material" />
          </mesh>
        ))}
      {/* Patches on every vertex. These are the one that show we're on a sphere */}
      {showVertices &&
        vectors.current.map((_, idx) => (
          <mesh
            key={idx}
            ref={(mesh) => {
              patchesMeshes.current[idx] = mesh;
            }}
            geometry={semiSphereGeom}
          >
            <meshPhysicalMaterial
              color={color}
              side={DoubleSide}
              transparent
              opacity={0.3}
              attach="material"
            />
          </mesh>
        ))}
    </group>
  );
};

export default React.memo(ShiftingTetrahedron);
