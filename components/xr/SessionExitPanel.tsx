'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useXRStore } from '@react-three/xr';
import { Text } from '@react-three/drei';
import Button3D, { XR_THEME } from './Button3D';

/**
 * Exit affordance for an active immersive session.
 *
 * Once a WebXR session starts the browser only composites the canvas, so the
 * DOM overlay — including its Exit button — is invisible. Without an in-scene
 * control the only way back is the headset/browser system menu, which reads as
 * a stuck app. This panel exists only while a session is running, floats within
 * reach in front of the head (damped, so gaze changes don't drag it), and ends
 * the session on press through the same pointer path the PIN pad uses, so
 * controllers, hands and the desktop mouse all work.
 */

const DISTANCE = 0.85; // metres in front of the head
const DROP = 0.22; // below the gaze centre, clear of the scene's panels
const DAMPING = 9;

export default function SessionExitPanel() {
    const store = useXRStore();
    const [session, setSession] = useState<XRSession | undefined>(() => store.getState().session);
    const [mode, setMode] = useState<XRSessionMode | null>(() => store.getState().mode);
    const camera = useThree((state) => state.camera);
    const group = useRef<THREE.Group>(null);
    const placed = useRef(false);

    // The XR store is a zustand vanilla store; subscribe instead of importing
    // zustand directly (it is not a declared dependency of this app).
    useEffect(() => {
        const read = () => {
            const state = store.getState();
            setSession((prev) => (prev === state.session ? prev : state.session));
            setMode((prev) => (prev === state.mode ? prev : state.mode));
        };
        read();
        return store.subscribe(read);
    }, [store]);

    // Snap to position on (re)entry, then follow smoothly.
    useEffect(() => {
        placed.current = false;
    }, [session]);

    useFrame((_, delta) => {
        const node = group.current;
        if (!node || !session) return;

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const target = camera.position
            .clone()
            .addScaledVector(forward, DISTANCE)
            .addScaledVector(up, -DROP);

        if (!placed.current) {
            node.position.copy(target);
            placed.current = true;
        } else {
            node.position.lerp(target, 1 - Math.exp(-DAMPING * delta));
        }
        node.lookAt(camera.position);
    });

    const endSession = () => {
        const active = store.getState().session;
        if (!active) return;
        active.end().catch((error) => console.warn('Failed to end XR session:', error));
    };

    if (!session) return null;

    const label = mode === 'immersive-ar' ? 'EXIT AR' : 'EXIT VR';

    return (
        <group ref={group}>
            <Button3D
                label={label}
                onPress={endSession}
                width={0.34}
                height={0.11}
                color={XR_THEME.danger}
                fontSize={0.032}
                pressOnPointerDown
            />
            <Text
                position={[0, -0.095, 0.031]}
                fontSize={0.019}
                color={XR_THEME.muted}
                anchorX="center"
                anchorY="middle"
                maxWidth={0.42}
            >
                tap to return to the browser
            </Text>
        </group>
    );
}
