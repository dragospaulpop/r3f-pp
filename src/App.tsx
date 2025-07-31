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

import { MinusIcon, PlusIcon } from "lucide-react";
import "./App.css";
import { Button } from "./components/ui/button";

type Piece = {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
};

const initialPieces: Piece[] = [
  {
    id: "a",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
    color: "#ff0000",
  },
  {
    id: "b",
    position: [0, 1, 0],
    rotation: [0, 0, 0],
    scale: 1,
    color: "#0000ff",
  },
  {
    id: "c",
    position: [0, 2, 0],
    rotation: [0, 0, 0],
    scale: 1,
    color: "#00ff00",
  },
  {
    id: "d",
    position: [0, 3, 0],
    rotation: [0, 0, 0],
    scale: 1,
    color: "#ffff00",
  },
  {
    id: "e",
    position: [0, 4, 0],
    rotation: [0, 0, 0],
    scale: 1,
    color: "#ff00ff",
  },
  {
    id: "f",
    position: [0, 5, 0],
    rotation: [0, 0, 0],
    scale: 1,
    color: "#ffa500",
  },
];

const generatePiece = (): Piece => {
  const id = Math.random().toString(36).substring(2, 15);
  const position = [
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
  ] as [number, number, number];
  const rotation = [0, 0, 0] as [number, number, number];
  const scale = 1;
  const color = `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padEnd(6, "0")}`;
  return { id, position, rotation, scale, color };
};

function App() {
  const [selectedId, setSelectedId] = useState<string[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    setPieces(initialPieces);
  }, []);

  return (
    <div className="w-screen h-screen bg-neutral-300 relative">
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          variant="outline"
          size="icon"
          className="text-blue-500"
          onClick={() => setPieces([...pieces, generatePiece()])}
        >
          <PlusIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="text-red-500"
          onClick={() => setPieces(pieces.slice(0, -1))}
        >
          <MinusIcon className="w-4 h-4" />
        </Button>
      </div>

      <Canvas onPointerMissed={() => setSelectedId([])}>
        <OrbitControls
          enabled={selectedId.length === 0}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.25}
        />
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
          {pieces.map((piece) => (
            <CustomBox
              id={piece.id}
              key={piece.id}
              isSelected={selectedId.includes(piece.id)}
              onPointerDown={() =>
                setSelectedId((prev) =>
                  prev.includes(piece.id)
                    ? prev.filter((id) => id !== piece.id)
                    : [...prev, piece.id]
                )
              }
              position={piece.position}
              color={piece.color}
            />
          ))}
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
    id,
  }: {
    isSelected: boolean;
    onPointerDown: () => void;
    color: string;
    position: [number, number, number];
    id: string;
  }) => {
    return (
      <Select enabled={isSelected}>
        <DragControls axisLock={"y"}>
          <group scale={1} position={position} onClick={onPointerDown}>
            <mesh name={id}>
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
    [selected, select, enabled]
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
    if (api) {
      const toBeAdded: THREE.Object3D[] = [];
      const toBeRemoved: THREE.Object3D[] = [];
      const current: THREE.Object3D[] = [];

      group.current.traverse((o) => {
        if (o.type === "Mesh") {
          current.push(o);

          const alreadySelected = api.selected.some((m) => m.uuid === o.uuid);

          if (enabled && !alreadySelected) {
            toBeAdded.push(o);
          } else if (!enabled && alreadySelected) {
            toBeRemoved.push(o);
          }
        }
      });

      if (toBeAdded.length > 0) {
        api.select((state) => {
          return [...state, ...toBeAdded];
        });
      }

      if (toBeRemoved.length > 0) {
        api.select((state) => {
          return state.filter((o) => !toBeRemoved.includes(o));
        });
      }

      return () => {
        // the cleanup function only handles objects removed from the scene
        // if a mesh doesn't have a parent, it means it's not attached to a scene and we can remove it from the selection
        // so that we don't hog the memory with deleted objects

        const orphaned = current.filter((o) => o.parent === null);

        if (orphaned.length > 0) {
          api.select((state) => {
            return state.filter((o) => !orphaned.includes(o));
          });
        }

        return;
      };
    }
  }, [enabled, children, api]);
  return (
    <group ref={group} {...props}>
      {children}
    </group>
  );
}

export default App;

/**
From my findings, this is what causes the infinite loop:

1. Object Tracking and State Comparison (Infinite Loop Cause):
- The `useEffect` hook iterates through all Object3D instances within the group to determine if a state change is needed (changed flag is set if `api.selected.indexOf(o) === -1`).
- However, only Mesh objects are subsequently added to the `api.selected` state via the current array.
- This discrepancy means that non-mesh objects within the group are checked against `api.selected` (which exclusively contains meshes). For any non-mesh object, `api.selected.indexOf(o)` will always be -1, causing the changed flag to be perpetually true if any non-mesh object exists in the group.
- Consequently, `api.select` is called on every render, resulting in an uncontrolled infinite render loop.
2. `useEffect` Cleanup Undoes State Updates:
- The cleanup function `api.select((state) => state.filter((selected) => !current.includes(selected)))` correctly attempts to remove the currently added meshes from the `api.selected` state when the component unmounts.
- However, due to the infinite loop described in point 1, the `useEffect` hook continuously re-adds the current meshes. The cleanup function from the previous `useEffect` run then immediately executes, removing these same meshes.
- This effectively negates the state update, leaving `api.selected` consistently empty at the start of each new `useEffect` execution and preventing the selection state from ever stabilizing or accumulating.
*/
