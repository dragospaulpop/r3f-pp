import { selectionContext, type SelectApi } from "@react-three/postprocessing";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

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
    // run triggered through initialization or state update
    if (api) {
      const toBeAdded: THREE.Object3D[] = [];
      const toBeRemoved: THREE.Object3D[] = [];
      const current: THREE.Object3D[] = [];

      group.current.traverse((o) => {
        if (o.type === "Mesh") {
          // keep a track of all meshes in the group, to be referenced in the cleanup function
          current.push(o);

          // check if the mesh is already selected
          const alreadySelected = api.selected.includes(o);

          // if the mesh is not selected and the selection is enabled, mark it for selection
          // if the mesh is selected and the selection is disabled, mark it for removal
          if (enabled && !alreadySelected) {
            toBeAdded.push(o);
          } else if (!enabled && alreadySelected) {
            toBeRemoved.push(o);
          }
        }
      });

      // add the meshes that are not selected and the selection is enabled
      // this will trigger a re-run of the useEffect hook
      if (toBeAdded.length > 0) {
        api.select((state) => {
          return [...state, ...toBeAdded];
        });
      }

      // remove the meshes that are selected and the selection is disabled
      // this will trigger a re-run of the useEffect hook
      if (toBeRemoved.length > 0) {
        api.select((state) => {
          return state.filter((o) => !toBeRemoved.includes(o));
        });
      }

      // if there's nothing to add or remove the useEffect hook will not be re-run and everything stops here

      // cleanup function runs before the body of the next useEffect hook re-run
      return () => {
        // the cleanup function only handles objects removed from the scene
        // if a mesh doesn't have a parent, it means it's not attached to a scene and we can remove it from the selection
        // so that we don't hog the memory with deleted objects

        const orphaned = current.filter((o) => o.parent === null);

        if (orphaned.length > 0) {
          api.select((state) => {
            console.log("set state in cleanup");
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

/**
From my findings, this is what causes the infinite loop:

1. Object Tracking and State Comparison (Infinite Loop Cause 1):
- The `useEffect` hook iterates through all Object3D instances within the group to determine if a state change is needed (changed flag is set if `api.selected.indexOf(o) === -1`).
- However, only Mesh objects are subsequently added to the `api.selected` state via the current array.
- This discrepancy means that non-mesh objects within the group are checked against `api.selected` (which exclusively contains meshes). For any non-mesh object, `api.selected.indexOf(o)` will always be -1, causing the changed flag to be perpetually true if any non-mesh object exists in the group.
- Consequently, `api.select` is called on every render, resulting in an uncontrolled infinite render loop.
2. `useEffect` Cleanup Always Alters State (Infinite Loop Cause 2):
- The cleanup function `api.select((state) => state.filter((selected) => !current.includes(selected)))` correctly attempts to remove the currently added meshes from the `api.selected` state when the component unmounts.
- However, because the `useEffect` hook is re-run after each addition or removal, the cleanup function is guaranteed to be called, it then alters the state resulting in an infinite loop.
*/

/**
Logic:

A. for a selection action:
- enabled changes to true which causes the useEffect hook to run
- objects are added to the state, triggering a re-run of the useEffect hook
- cleanup function runs, does nothing because there's no orphaned objects
- useEffect hook re-runs and sees that there's nothing to add or remove
- useEffect hook stops here

B. for a un-selection action:
- enabled changes to false which causes the useEffect hook to run
- objects are removed from the state, triggering a re-run of the useEffect hook
- cleanup function runs, does nothing because there's no orphaned objects
- useEffect hook re-runs and sees that there's nothing to add or remove
- useEffect hook stops here

C. for an unmount action:
- useEffect cleanup runs, all objects are orphaned, so we remove them from the state
- useEffect hook is destroyed
*/
