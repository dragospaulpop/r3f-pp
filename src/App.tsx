import {
  Box,
  DragControls,
  Environment,
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  EffectComposer,
  Outline,
  selectionContext,
  type SelectApi,
} from "@react-three/postprocessing";
import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import "./App.css";

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="w-screen h-screen bg-neutral-300">
      <Canvas onPointerMissed={() => setSelectedId(null)}>
        <OrbitControls enabled={!selectedId} />
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
              edgeStrength={10}
              visibleEdgeColor={0xffffff}
              hiddenEdgeColor={0x22090a}
            />
          </EffectComposer>
          <CustomBox
            isSelected={selectedId === "a"}
            onPointerDown={() => setSelectedId("a")}
            position={[0, 0, 0]}
            color="red"
          />
          <CustomBox
            isSelected={selectedId === "b"}
            onPointerDown={() => setSelectedId("b")}
            position={[0, 1, 0]}
            color="blue"
          />
          <CustomBox
            isSelected={selectedId === "c"}
            onPointerDown={() => setSelectedId("c")}
            position={[0, 2, 0]}
            color="green"
          />
          <CustomBox
            isSelected={selectedId === "d"}
            onPointerDown={() => setSelectedId("d")}
            position={[0, 3, 0]}
            color="yellow"
          />
          <CustomBox
            isSelected={selectedId === "e"}
            onPointerDown={() => setSelectedId("e")}
            position={[0, 4, 0]}
            color="purple"
          />
          <CustomBox
            isSelected={selectedId === "f"}
            onPointerDown={() => setSelectedId("f")}
            position={[0, 5, 0]}
            color="orange"
          />
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

const CustomBox = memo(
  ({
    isSelected,
    onPointerDown,
    color,
    position,
  }: {
    isSelected: boolean;
    onPointerDown: () => void;
    color: string;
    position: [number, number, number];
  }) => {
    return (
      <Select enabled={isSelected}>
        <DragControls axisLock={"y"}>
          <group scale={1} position={position} onClick={onPointerDown}>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        </DragControls>
      </Select>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.isSelected === nextProps.isSelected;
  }
);

export function Selection({
  children,
  enabled = true,
}: {
  enabled?: boolean;
  children: React.ReactNode;
}) {
  const [selected, select] = useState<THREE.Object3D[]>([]);
  const value = useMemo(
    () => ({ selected, select, enabled }),
    [selected, enabled]
  );
  return (
    <selectionContext.Provider value={value}>
      {children}
    </selectionContext.Provider>
  );
}

export function Select({ enabled = false, children, ...props }: SelectApi) {
  const group = useRef<THREE.Group>(null!);
  const api = useContext(selectionContext);
  useEffect(() => {
    if (api && enabled) {
      let changed = false;
      const current: THREE.Object3D[] = [];

      group.current.traverse((o) => {
        if (o.type === "Mesh") {
          current.push(o);
          if (!api.selected.some((m) => m.uuid === o.uuid)) changed = true;
        }
      });

      console.log("------RUN------");

      console.log(
        "API.SELECTED: ",
        JSON.stringify(api.selected.map((m) => m.uuid))
      );

      console.log("CHANGED: ", changed);

      console.log("CURRENT: ", JSON.stringify(current.map((m) => m.uuid)));

      if (changed) {
        api.select((state) => {
          console.log(
            "adding: ",
            `STATE: ${JSON.stringify(state.map((m) => m.uuid))}`,
            `CURRENT: ${JSON.stringify(current.map((m) => m.uuid))}`
          );
          return [...state, ...current];
        });
        console.log(
          "changed API.SELECTED: ",
          JSON.stringify(api.selected.map((m) => m.uuid))
        );
        return () => {
          api.select((state) => {
            console.log(
              "cleanup STATE:",
              JSON.stringify(state.map((m) => m.uuid))
            );
            return state.filter((selected) => {
              console.log(
                "filtering: ",
                `SELECTED: ${selected.uuid}`,
                `CURRENT: ${JSON.stringify(current.map((m) => m.uuid))}`
              );
              return current.map((m) => m.uuid).includes(selected.uuid);
            });
          });
        };
      }
    }
  }, [enabled, children, api]);
  return (
    <group ref={group} {...props}>
      {children}
    </group>
  );
}

export default App;
