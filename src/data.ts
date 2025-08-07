import type { Piece } from "./types";

const models = [
  "/models/cat/concrete_cat_statue_1k.gltf",
  "/models/bullhead/bull_head_1k.gltf",
  "/models/horsehead/horse_head_1k.gltf",
  "/models/lionhead/lion_head_1k.gltf",
  "/models/person.glb",
];

export const initialPieces: Piece[] = [
  {
    id: "cat statue",
    position: [-4.5, 0.05, -4.5],
    rotation: [0, Math.PI / 3, 0],
    scale: 4,
    model: models[0],
    eyes: true,
  },
  {
    id: "bullhead",
    position: [-4.5, 0.05, 4.5],
    rotation: [0, Math.PI / 1.5, 0],
    scale: 4,
    model: models[1],
    eyes: true,
  },
  {
    id: "horsehead",
    position: [4.5, 0.05, -4.5],
    rotation: [0, -Math.PI / 3, 0],
    scale: 4,
    model: models[2],
    eyes: true,
  },
  {
    id: "lionhead",
    position: [4.5, 0.05, 4.5],
    rotation: [0, -Math.PI / 1.5, 0],
    scale: 4,
    model: models[3],
    eyes: true,
  },
  {
    id: "poerson",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
    model: models[4],
    eyes: true,
  },
];

export const generatePiece = (): Piece => {
  const id = Math.random().toString(36).substring(2, 15);
  const position = [
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
  ] as [number, number, number];
  const rotation = [0, 0, 0] as [number, number, number];
  const scale = 1;
  const model = models[Math.floor(Math.random() * models.length)];
  return { id, position, rotation, scale, model, eyes: true };
};
