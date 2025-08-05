import { Box, useGLTF } from "@react-three/drei";

export default function Table() {
  const texture = useGLTF("/broken_brick_wall_1k.gltf");

  return (
    <Box
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={1}
      args={[10, 10, 0.1]}
    >
      {/* @ts-expect-error - TODO: fix this */}
      <meshStandardMaterial map={texture.materials.broken_brick_wall.map} />
    </Box>
  );
}
