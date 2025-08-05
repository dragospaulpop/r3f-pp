import type { Piece } from "@/types";
import { FlyControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface FirstPersonCameraProps {
  target: Piece | null;
  setStartPosition: (position: THREE.Vector3) => void;
}

export default function FirstPersonCamera({
  target,
  setStartPosition,
}: FirstPersonCameraProps) {
  const { camera } = useThree();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const animationStartTime = useRef<number>(0);
  const startPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const startQuaternion = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const targetPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const targetQuaternion = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const lastRecordedPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const positionUpdateTimer = useRef<number>(0);

  const animationDuration = 2; // seconds
  const positionUpdateDelay = 0.5; // Update start position every 0.5 seconds during movement

  useEffect(() => {
    if (target) {
      // Calculate target position and rotation
      const [x, y, z] = target.position;
      const [rotX, rotY, rotZ] = target.rotation;

      // Store current camera state as start
      startPosition.current.copy(camera.position);
      startQuaternion.current.copy(camera.quaternion);

      // Calculate target quaternion using the object's rotation
      // Flip the Y rotation by 180 degrees so camera faces the same direction as the object
      const objectRotation = new THREE.Euler(rotX, rotY + Math.PI, rotZ, "XYZ");
      targetQuaternion.current.setFromEuler(objectRotation);

      // Position camera at the object's location with offsets
      const basePosition = new THREE.Vector3(x, y + 1.1, z); // Slightly above the object

      // Calculate forward direction from the target rotation and move camera forward
      const forwardDirection = new THREE.Vector3(0, 0, -1); // Camera's forward is -Z
      forwardDirection.applyQuaternion(targetQuaternion.current);
      const forwardOffset = forwardDirection.multiplyScalar(1); // Move 2 units forward

      const newPosition = basePosition.add(forwardOffset);
      targetPosition.current.copy(newPosition);

      // Start animation
      setIsAnimating(true);
      setAnimationComplete(false);
      animationStartTime.current = 0; // Reset animation timer
    } else {
      // Default position if no objects are selected
      const defaultPos = new THREE.Vector3(10, 4, 10);
      const defaultRotation = new THREE.Euler(0, Math.PI / 4, 0); // Look toward origin

      startPosition.current.copy(camera.position);
      startQuaternion.current.copy(camera.quaternion);
      targetPosition.current.copy(defaultPos);
      targetQuaternion.current.setFromEuler(defaultRotation);

      setIsAnimating(true);
      setAnimationComplete(false);
      animationStartTime.current = 0;
    }
  }, [target, camera]);

  useFrame((state) => {
    if (isAnimating && !animationComplete) {
      // Animation is running

      // If this is the first frame of animation, record the start time
      if (animationStartTime.current === 0) {
        animationStartTime.current = state.clock.getElapsedTime();
      }

      const elapsed = state.clock.getElapsedTime() - animationStartTime.current;
      const progress = Math.min(1, elapsed / animationDuration);

      // Use easeInOutCubic for smooth animation
      const easeProgress =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      if (progress < 1) {
        // Interpolate position
        camera.position.lerpVectors(
          startPosition.current,
          targetPosition.current,
          easeProgress
        );

        // Interpolate rotation
        camera.quaternion.slerpQuaternions(
          startQuaternion.current,
          targetQuaternion.current,
          easeProgress
        );
      } else {
        // Animation complete
        camera.position.copy(targetPosition.current);
        camera.quaternion.copy(targetQuaternion.current);
        setIsAnimating(false);
        setAnimationComplete(true);

        // Update start position for orbit camera when FPV animation completes
        setStartPosition(camera.position.clone());
        lastRecordedPosition.current.copy(camera.position);
      }
    } else if (animationComplete) {
      // Track camera movement during FlyControls usage
      const currentTime = state.clock.getElapsedTime();

      // Check if enough time has passed and camera has moved significantly
      if (currentTime - positionUpdateTimer.current > positionUpdateDelay) {
        const distanceMoved = camera.position.distanceTo(
          lastRecordedPosition.current
        );

        if (distanceMoved > 1) {
          // Only update if moved more than 1 unit
          setStartPosition(camera.position.clone());
          lastRecordedPosition.current.copy(camera.position);
          positionUpdateTimer.current = currentTime;
        }
      }
    }
  });

  return (
    <>
      {!isAnimating && animationComplete && (
        <FlyControls
          movementSpeed={10}
          rollSpeed={0.5}
          dragToLook={true}
          autoForward={false}
        />
      )}
    </>
  );
}
