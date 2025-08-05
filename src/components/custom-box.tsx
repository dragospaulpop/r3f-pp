import { DragControls } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { memo } from "react";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Select } from "./selection";

export default memo(
  function CustomBox({
    isSelected,
    onPointerDown,
    model,
    position,
    rotation,
    id,
    scale,
  }: {
    isSelected: boolean;
    onPointerDown: () => void;
    model: string;
    position: [number, number, number];
    rotation: [number, number, number];
    id: string;
    scale: number;
  }) {
    const gltf = useLoader(GLTFLoader, model);

    return (
      <Select enabled={isSelected}>
        <DragControls axisLock={"y"}>
          <group
            scale={scale}
            position={position}
            rotation={rotation}
            onClick={onPointerDown}
            name={id}
          >
            <primitive object={gltf.scene} />
          </group>
        </DragControls>
      </Select>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.isSelected === nextProps.isSelected;
  }
);
