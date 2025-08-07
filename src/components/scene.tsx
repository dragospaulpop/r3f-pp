import type { Piece } from "@/types";
import { Environment } from "@react-three/drei";
import { EffectComposer, Outline } from "@react-three/postprocessing";
import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import * as THREE from "three";
import AnimatedOrbitCamera from "./animated-orbit-camera";
import CustomBox from "./custom-box";
import FirstPersonCamera from "./first-person-camera";
import { Selection } from "./selection";
import Table from "./table";

interface SceneProps {
  selectedId: string | null;
  pieces: Piece[];
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  view: "orbit" | "fpv";
}

export default function Scene({
  selectedId,
  pieces,
  setSelectedId,
  view,
}: SceneProps) {
  const [lastOrbitPosition, setLastOrbitPosition] =
    useState<THREE.Vector3 | null>(null);
  const pieceRef = useRef<Record<string, THREE.Group | null>>({});

  const handleSelect = useCallback(
    (id: string) => {
      const isSelected = selectedId === id;

      if (isSelected) {
        setSelectedId(null);
      } else {
        setSelectedId(id);
      }
    },
    [setSelectedId, selectedId]
  );

  return (
    <>
      {view === "orbit" && (
        <AnimatedOrbitCamera
          lastOrbitPosition={lastOrbitPosition}
          setLastOrbitPosition={setLastOrbitPosition}
        />
      )}
      {view === "fpv" && (
        <FirstPersonCamera
          target={pieceRef.current[selectedId || ""] || null}
        />
      )}
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
            edgeStrength={10}
            visibleEdgeColor={0xffffff}
            hiddenEdgeColor={0x22090a}
          />
        </EffectComposer>
        {pieces.map((piece) => (
          <CustomBox
            id={piece.id}
            key={piece.id}
            isSelected={selectedId === piece.id}
            onPointerDown={() => handleSelect(piece.id)}
            position={piece.position}
            rotation={piece.rotation}
            model={piece.model}
            scale={piece.scale}
            eyes={piece.eyes}
            ref={(el: THREE.Group | null) => (pieceRef.current[piece.id] = el)}
          />
        ))}
      </Selection>
      <Table />
      <Environment preset="sunset" background blur={0.25} />
    </>
  );
}
