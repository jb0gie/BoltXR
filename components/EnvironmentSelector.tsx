'use client';

import { useState } from 'react';
import { Text, RoundedBox } from '@react-three/drei';

export type EnvType = 'space' | 'sunset' | 'forest' | 'city' | 'rain';

interface EnvironmentSelectorProps {
  current: EnvType;
  onSelect: (env: EnvType) => void;
}

const ENVS: { type: EnvType; label: string; color: string }[] = [
  { type: 'space', label: 'DEEP SPACE', color: '#6366f1' },
  { type: 'sunset', label: 'NEON SUNSET', color: '#f43f5e' },
  { type: 'forest', label: 'ZEN GARDEN', color: '#10b981' },
  { type: 'city', label: 'CYBER CITY', color: '#3b82f6' },
  { type: 'rain', label: 'TOKEN RAIN', color: '#f59e0b' }
];

/**
 * Scene presets as a fixed strip. It used to float and bob (a moving click
 * target) behind the swap centrepiece's invisible hit box, so presses landed on
 * nothing. Anchored, hover-lit, and centred so it reads as one control row.
 */
export default function EnvironmentSelector({ current, onSelect }: EnvironmentSelectorProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const setCursor = (value: string) => { document.body.style.cursor = value; };

  return (
    <group>
      <Text position={[0, 0.32, 0]} fontSize={0.06} color="#94a3b8" anchorX="center" anchorY="middle" maxWidth={2}>
        ENVIRONMENT
      </Text>

      {ENVS.map((env, i) => (
        <group
          key={env.type}
          position={[(i - (ENVS.length - 1) / 2) * 0.35, 0, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(env.type); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(i); setCursor('pointer'); }}
          onPointerOut={() => { setHovered(null); setCursor('auto'); }}
        >
          <RoundedBox args={[0.3, 0.3, 0.05]} radius={0.02} scale={hovered === i ? 1.12 : 1}>
            <meshStandardMaterial
              color={current === env.type ? env.color : hovered === i ? '#334155' : '#1e293b'}
              emissive={current === env.type ? env.color : hovered === i ? '#475569' : '#000'}
              emissiveIntensity={0.5}
            />
          </RoundedBox>
          <Text
            position={[0, -0.22, 0.03]}
            fontSize={0.04}
            color={hovered === i ? '#ffffff' : '#94a3b8'}
            anchorX="center"
            anchorY="middle"
            maxWidth={0.3}
            textAlign="center"
          >
            {env.label}
          </Text>
        </group>
      ))}
    </group>
  );
}
