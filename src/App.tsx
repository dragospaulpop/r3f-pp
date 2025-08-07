import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";

import {
  CameraIcon,
  EarthIcon,
  EyeIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
import "./App.css";
import Scene from "./components/scene";
import { Button } from "./components/ui/button";
import { initialPieces } from "./data";
import type { Piece } from "./types";

import { Toggle } from "./components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import { generatePiece } from "./data";

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [view, setView] = useState<"orbit" | "fpv">("orbit");

  const handleViewChange = useCallback(
    (value: "orbit" | "fpv") => {
      if (value === "fpv" && !selectedId) return;
      setView(value);
    },
    [selectedId]
  );

  useEffect(() => {
    setPieces(initialPieces);
  }, []);

  return (
    <div className="w-screen h-screen bg-neutral-300 relative">
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {selectedId && (
          <Toggle
            variant="outline"
            size="default"
            pressed={pieces.find((piece) => piece.id === selectedId)?.eyes}
            onPressedChange={() => {
              setPieces(
                pieces.map((piece) => {
                  if (piece.id === selectedId) {
                    return { ...piece, eyes: !piece.eyes };
                  }
                  return piece;
                })
              );
            }}
          >
            <EyeIcon className="h-4 w-4" />
          </Toggle>
        )}
        <ToggleGroup
          variant="default"
          type="single"
          value={view}
          onValueChange={handleViewChange}
        >
          <ToggleGroupItem value="orbit" aria-label="Toggle bold">
            <EarthIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="fpv" aria-label="Toggle italic">
            <CameraIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
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

      <Canvas
        onPointerMissed={() => setSelectedId(null)}
        camera={{ position: [0, 0, 100] }}
      >
        <Scene
          selectedId={selectedId}
          pieces={pieces}
          setSelectedId={setSelectedId}
          view={view}
        />
      </Canvas>
    </div>
  );
}

export default App;
