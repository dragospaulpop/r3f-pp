import { shallowEqual } from "@/lib/utils";
import { DragControls, useGLTF } from "@react-three/drei";
import { memo, useEffect } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
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
    eyes,
    ref,
  }: {
    isSelected: boolean;
    onPointerDown: () => void;
    model: string;
    position: [number, number, number];
    rotation: [number, number, number];
    id: string;
    scale: number;
    eyes: boolean;
    ref: React.RefObject<Group | null> | ((el: Group | null) => void);
  }) {
    const { scene, nodes } = useGLTF(model);
    const eyesNode = nodes?.eyes;
    const torsoNode = nodes?.torso as Mesh;

    useEffect(() => {
      if (eyesNode) {
        eyesNode.visible = eyes;
      }
    }, [eyesNode, eyes]);

    useEffect(() => {
      if (torsoNode) {
        const material = torsoNode.material as MeshStandardMaterial;
        material.color.set(eyes ? "red" : "blue");
      }
    }, [torsoNode, eyes]);

    return (
      <Select enabled={isSelected}>
        <DragControls axisLock={"y"}>
          <group
            scale={scale}
            position={position}
            rotation={rotation}
            onClick={onPointerDown}
            name={id}
            ref={ref}
          >
            <primitive object={scene} />
          </group>
        </DragControls>
      </Select>
    );
  },
  (prevProps, nextProps) => {
    return shallowEqual(prevProps, nextProps);
  }
);
