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
  startPosition,
  setStartPosition,
}: {
  startPosition: THREE.Vector3;
  setStartPosition: (position: THREE.Vector3) => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const [animationStarted, setAnimationStarted] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const animationStartTime = useRef<number>(0);

  useEffect(() => {
    // Set initial camera position and target immediately on mount
    // OrbitControls will override this if it's "makeDefault" and takes over
    // so we disable it temporarily.
    if (controlsRef.current) {
      camera.position.copy(startPosition);
      controlsRef.current.target.copy(startTarget);
      controlsRef.current.update(); // Important to update controls after manual changes
    }
    setAnimationStarted(true); // Trigger animation on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      camera.position.lerpVectors(startPosition, endPosition, progress);

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
        camera.position.copy(endPosition);
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
        // Only update start position when animation is complete
        // This ensures the next remount will start from where the user left the camera
        if (animationComplete) {
          setStartPosition(camera.position.clone());
        }
      }}
    />
  );
}
