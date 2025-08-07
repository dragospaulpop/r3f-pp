import { FlyControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface FirstPersonCameraProps {
  target: THREE.Group | null;
}

export default function FirstPersonCamera({ target }: FirstPersonCameraProps) {
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
    // Store current camera state as start
    startPosition.current.copy(camera.position);
    startQuaternion.current.copy(camera.quaternion);

    if (target) {
      const cameraTargetEmpty = target.getObjectByName("cameraTarget");
      const cameraLookAtEmpty = target.getObjectByName("cameraLookAt");

      // Temp variables to hold world positions/quaternions for calculations
      const tempCameraPosWorld = new THREE.Vector3();
      const tempLookAtTargetWorld = new THREE.Vector3(); // For camera.lookAt() method
      const tempCameraRotQuatForEuler = new THREE.Quaternion(); // For direct Euler conversion fallback

      if (cameraTargetEmpty && cameraLookAtEmpty) {
        // --- Empties ARE Present: Use camera.lookAt() derivation ---

        // 1. Get world position for camera's destination
        cameraTargetEmpty.getWorldPosition(tempCameraPosWorld);

        // 2. Get world position for where the camera should look AT
        cameraLookAtEmpty.getWorldPosition(tempLookAtTargetWorld);

        // Temporarily move the camera to the target position and make it look at the target look-at position
        // This will give us the quaternion needed for slerp.
        const originalCameraPosition = camera.position.clone();
        const originalCameraQuaternion = camera.quaternion.clone();

        camera.position.copy(tempCameraPosWorld); // Temporarily set camera's position
        camera.lookAt(tempLookAtTargetWorld); // Make it look at the target
        targetQuaternion.current.copy(camera.quaternion); // Capture the resulting quaternion

        // IMPORTANT: Reset Camera to its original position/quaternion immediately
        camera.position.copy(originalCameraPosition);
        camera.quaternion.copy(originalCameraQuaternion);

        // The camera's final animated position will be exactly `tempCameraPosWorld`
        targetPosition.current.copy(tempCameraPosWorld);

        // console.log("Using Empties: Camera will move to", targetPosition.current, "and look in direction from derived quaternion.");
      } else {
        // --- Empties are NOT Present: Fallback to target's position/rotation with your original offsets ---
        console.warn(
          "Blender Empties 'cameraTarget' or 'cameraLookAt' not found. Falling back to target's position and rotation."
        );

        target.getWorldPosition(tempCameraPosWorld);
        target.getWorldQuaternion(tempCameraRotQuatForEuler);

        // Convert world quaternion to Euler for your existing rotation logic
        const objectRotationEuler = new THREE.Euler().setFromQuaternion(
          tempCameraRotQuatForEuler,
          "XYZ" // Specify order if you know it, otherwise "XYZ" is common
        );

        // Position camera at the object's location with offsets
        const basePosition = tempCameraPosWorld.clone(); // Start with target's world position
        basePosition.y += 1.1; // Apply your vertical offset

        // Calculate target quaternion using the object's (target's) rotation
        // Flip the Y rotation by 180 degrees as per your original logic
        const adjustedObjectRotation = new THREE.Euler(
          objectRotationEuler.x,
          objectRotationEuler.y + Math.PI, // Your specific PI offset for Y rotation
          objectRotationEuler.z,
          "XYZ"
        );
        targetQuaternion.current.setFromEuler(adjustedObjectRotation);

        // Calculate forward direction from the target rotation and move camera forward
        const forwardDirection = new THREE.Vector3(0, 0, -1); // Camera's forward is -Z in its local space
        forwardDirection.applyQuaternion(targetQuaternion.current); // Apply the target camera's desired orientation
        const forwardOffset = forwardDirection.multiplyScalar(1); // Move 1 unit *forward* from the base position

        const newPosition = basePosition.add(forwardOffset);
        targetPosition.current.copy(newPosition);

        // console.log("Using Target Fallback: Camera will move to", targetPosition.current, "and orient from direct Euler + PI.");
      }

      // Start animation
      setIsAnimating(true);
      setAnimationComplete(false);
      animationStartTime.current = 0; // Reset animation timer
    } else {
      // Default position if no objects are selected (remains the same as previous default)
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
  }, [target, camera]); // Dependencies remain the same

  useFrame((state) => {
    if (isAnimating && !animationComplete) {
      // Animation is running
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

        lastRecordedPosition.current.copy(camera.position);
      }
    } else if (animationComplete) {
      // Track camera movement during FlyControls usage
      const currentTime = state.clock.getElapsedTime();

      if (currentTime - positionUpdateTimer.current > positionUpdateDelay) {
        const distanceMoved = camera.position.distanceTo(
          lastRecordedPosition.current
        );

        if (distanceMoved > 1) {
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
