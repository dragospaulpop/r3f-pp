import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// Define start and end points (constants moved outside component)
const startTarget = new THREE.Vector3(0, 0, 0);
const endPosition = new THREE.Vector3(7, 4, -7);
const endTarget = new THREE.Vector3(0, 1, 0); // Focus slightly above origin
const animationDuration = 3; // seconds

export default function AnimatedOrbitCamera({
  lastOrbitPosition,
  setLastOrbitPosition,
}: {
  lastOrbitPosition: THREE.Vector3 | null;
  setLastOrbitPosition: (position: THREE.Vector3) => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const [animationStarted, setAnimationStarted] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const animationStartTime = useRef<number>(0);
  const startPosition = useRef<THREE.Vector3>(camera.position.clone());
  const animateToPosition = useRef<THREE.Vector3>(
    lastOrbitPosition || endPosition
  );

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.copy(startTarget);
      controlsRef.current.update(); // Important to update controls after manual changes
    }
    setAnimationStarted(true); // Trigger animation on mount
  }, []);

  useFrame((state) => {
    if (!animationStarted || animationComplete) return;

    // If this is the first frame of animation, record the start time
    if (animationStartTime.current === 0) {
      animationStartTime.current = state.clock.getElapsedTime();
    }

    const elapsed = state.clock.getElapsedTime() - animationStartTime.current;
    const progress = Math.min(1, elapsed / animationDuration);

    if (progress < 1) {
      // Interpolate camera position
      camera.position.lerpVectors(
        startPosition.current,
        animateToPosition.current,
        progress
      );

      // Interpolate controls target
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(
          startTarget,
          endTarget,
          progress
        );
        controlsRef.current.update(); // Update controls to reflect target change
      }
    } else {
      // Animation complete
      if (controlsRef.current) {
        camera.position.copy(animateToPosition.current);
        controlsRef.current.target.copy(endTarget);
        controlsRef.current.update();
        controlsRef.current.enabled = true; // Re-enable controls after animation
      }
      setAnimationComplete(true);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={!animationStarted || animationComplete} // Disable controls during animation
      enableDamping
      dampingFactor={0.05}
      onEnd={() => {
        setLastOrbitPosition(camera.position.clone());
      }}
    />
  );
}
