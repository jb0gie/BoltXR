'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useXRInputSourceState } from '@react-three/xr';
import SwapScale from '../SwapScale';

/**
 * The swap scale as a carried tool: wrist-sized, parked at the lower right of
 * the view (or on the left hand/controller when the session has one), and
 * pressed once to bring the full-size scale into view. Keeping it small means
 * its hit area is ~0.38 m wide instead of the 2.1 m slab that used to sit in
 * front of the coins and swallow their presses.
 */

const SIZE = 0.18;
const PARKED = new THREE.Vector3(0.36, -0.20, -0.62); // camera space, lower right

export default function SwapTool({ onActivate }: { onActivate: () => void }) {
    const group = useRef<THREE.Group>(null);
    const camera = useThree((state) => state.camera);
    // Prefer the non-dominant hand; fall back to a controller if hands are off.
    const hand = useXRInputSourceState('hand', 'left') ?? useXRInputSourceState('controller', 'left');
    const anchor = hand?.object;
    const target = useRef(new THREE.Vector3());
    const placed = useRef(false);

    useFrame((_, delta) => {
        const node = group.current;
        if (!node) return;

        if (anchor) {
            anchor.getWorldPosition(target.current);
            target.current.y += 0.07; // sit just above the wrist
        } else {
            target.current.copy(PARKED).applyMatrix4(camera.matrixWorld);
        }

        if (!placed.current) {
            node.position.copy(target.current);
            placed.current = true;
        } else {
            node.position.lerp(target.current, 1 - Math.exp(-12 * delta));
        }
        node.lookAt(camera.position);
    });

    return (
        <group ref={group} scale={SIZE}>
            <SwapScale onActivate={onActivate} />
        </group>
    );
}
