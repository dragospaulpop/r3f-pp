import {
  Box,
  DragControls,
  Environment,
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import {
  EffectComposer,
  Outline,
  Select,
  Selection,
} from "@react-three/postprocessing";
import { useState } from "react";
import "./App.css";

function App() {
  const [isSelected, setIsSelected] = useState(false);

  return (
    <div className="w-screen h-screen bg-neutral-300">
      <Canvas onPointerMissed={() => setIsSelected(false)}>
        <OrbitControls enabled={!isSelected} />
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          decay={0}
          intensity={Math.PI}
        />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

        <Selection>
          <EffectComposer autoClear={false}>
            <Outline
              blur
              edgeStrength={2.5}
              visibleEdgeColor={0xffffff}
              hiddenEdgeColor={0x22090a}
            />
          </EffectComposer>
          <CustomBox isSelected={isSelected} setIsSelected={setIsSelected} />
        </Selection>

        <Table />

        <Environment preset="sunset" background blur={0.1} />
      </Canvas>
    </div>
  );
}

function Table() {
  const texture = useGLTF("/broken_brick_wall_1k.gltf");

  return (
    <Box
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={1}
      args={[10, 10, 0.1]}
    >
      <meshStandardMaterial map={texture.materials.broken_brick_wall.map} />
    </Box>
  );
}

function CustomBox({
  isSelected,
  setIsSelected,
}: {
  isSelected: boolean;
  setIsSelected: (selected: boolean) => void;
}) {
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setIsSelected(true);
  };

  return (
    <Select enabled={isSelected}>
      <DragControls axisLock={"y"}>
        <mesh scale={1} position={[0, 0, 0]} onClick={handleClick}>
          <Box
            position={[0, 0.55, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={1}
            args={[1, 1, 1]}
          >
            <meshStandardMaterial color="hotpink" />
          </Box>
        </mesh>
      </DragControls>
    </Select>
  );
}

export default App;
