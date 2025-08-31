import { shallowEqual } from "@/lib/utils";
import { DragControls, useGLTF } from "@react-three/drei";
import { memo, useEffect, useMemo } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { SkeletonUtils } from "three-stdlib";
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
    const { scene } = useGLTF(model);
    const instance = useMemo(
      () => SkeletonUtils.clone(scene) as Group,
      [scene]
    );
    const eyesNode = useMemo(
      () => instance.getObjectByName("eyes") as Mesh | null,
      [instance]
    );
    const torsoNode = useMemo(
      () => instance.getObjectByName("torso") as Mesh | null,
      [instance]
    );
    const headNode = useMemo(
      () => instance.getObjectByName("head") as Mesh | null,
      [instance]
    );
    const leftArmNode = useMemo(
      () => instance.getObjectByName("leftArm") as Mesh | null,
      [instance]
    );
    const rightArmNode = useMemo(
      () => instance.getObjectByName("rightArm") as Mesh | null,
      [instance]
    );

    // console.log(nodes);

    useEffect(() => {
      if (eyesNode) {
        eyesNode.visible = eyes;
      }
    }, [eyesNode, eyes]);

    useEffect(() => {
      [torsoNode, headNode, leftArmNode, rightArmNode].forEach((mesh) => {
        if (!mesh) return;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else {
          mesh.material = (mesh.material as MeshStandardMaterial).clone();
        }
      });
      if (torsoNode) {
        const materialTorso = torsoNode.material as MeshStandardMaterial;
        materialTorso.color.set(eyes ? "red" : "green");
      }
      if (headNode) {
        const materialHead = headNode.material as MeshStandardMaterial;
        materialHead.color.set(eyes ? "red" : "yellow");
      }
      if (leftArmNode) {
        const materialLeftArm = leftArmNode.material as MeshStandardMaterial;
        materialLeftArm.color.set(eyes ? "red" : "blue");
      }
      if (rightArmNode) {
        const materialRightArm = rightArmNode.material as MeshStandardMaterial;
        materialRightArm.color.set(eyes ? "red" : "orange");
      }
    }, [torsoNode, headNode, leftArmNode, rightArmNode, eyes]);

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
            <primitive object={instance} />
          </group>
        </DragControls>
      </Select>
    );
  },
  (prevProps, nextProps) => {
    return shallowEqual(prevProps, nextProps);
  }
);
