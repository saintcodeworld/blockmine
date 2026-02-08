import { useRef, useLayoutEffect, useMemo } from 'react';
import { Object3D, InstancedMesh } from 'three';
import { useMinecraftTextures, CubeType } from './MinecraftTextures';
import { useGameStore, Cube } from '@/store/gameStore';
import { MineCube } from './MineCube';

interface CubeWorldProps {
    playerPosition: [number, number, number];
}

export function CubeWorld({ playerPosition }: CubeWorldProps) {
    const cubes = useGameStore((state) => state.cubes);
    const cubesMap = useGameStore((state) => state.cubesMap); // O(1) loopups
    const renderDistance = useGameStore((state) => state.renderDistance);
    const selectedCubeId = useGameStore((state) => state.selectedCubeId);
    const miningCubeId = useGameStore((state) => state.miningCubeId);
    const worldBounds = useGameStore((state) => state.worldBounds);

    const textures = useMinecraftTextures();

    // 1. Filter out invisible (occluded) cubes AND cubes that are too far away
    const visibleCubes = useMemo(() => {
        if (!cubesMap) return []; // Safety check

        const [px, , pz] = playerPosition;
        // Distance squared thresholds
        const distVal = renderDistance === 'low' ? 60 : renderDistance === 'medium' ? 120 : 200;
        const maxDistSq = distVal * distVal;

        return cubes.filter(cube => {
            // A. Distance Cull
            const dx = cube.position[0] - px;
            const dz = cube.position[2] - pz;
            if (dx * dx + dz * dz > maxDistSq) return false;

            // B. World Boundary Cull
            const [cx, , cz] = cube.position;
            if (cx < worldBounds.minX || cx > worldBounds.maxX ||
                cz < worldBounds.minZ || cz > worldBounds.maxZ) return false;

            // C. Occlusion Cull (Hidden Block Removal) - REMOVED to ensure building is filled
            // We now render all blocks within range to prevent "hollow" look and ensure everything is visible

            return true;
        });
    }, [cubes, cubesMap, playerPosition, renderDistance, worldBounds]);

    // 2. Group by type for InstancedMesh
    const cubesByType = useMemo(() => {
        const groups: Record<string, Cube[]> = {};
        const types: CubeType[] = ['stone']; // Add value/rare types if they exist
        types.forEach(type => {
            groups[type] = [];
        });

        visibleCubes.forEach(cube => {
            if (!groups[cube.type]) groups[cube.type] = [];
            groups[cube.type].push(cube);
        });
        return groups;
    }, [visibleCubes]);

    const activeCubes = useMemo(() => {
        return cubes.filter(c => c.id === selectedCubeId || c.id === miningCubeId);
    }, [cubes, selectedCubeId, miningCubeId]);

    return (
        <>
            {Object.entries(cubesByType).map(([type, typeCubes]) => (
                <InstancedCubeGroup
                    key={type}
                    type={type as CubeType}
                    allCubes={typeCubes}
                    activeCubeIds={[selectedCubeId, miningCubeId]}
                    texture={textures[type as CubeType]}
                    playerPosition={playerPosition}
                />
            ))}

            {/* Render standalone active cubes */}
            {activeCubes.map(cube => (
                <MineCube
                    key={cube.id}
                    cube={cube}
                    isSelected={selectedCubeId === cube.id}
                    onSelect={() => useGameStore.getState().setSelectedCube(cube.id)}
                    playerPosition={playerPosition}
                />
            ))}
        </>
    );
}

interface InstancedCubeGroupProps {
    type: CubeType;
    allCubes: Cube[];
    activeCubeIds: (string | null)[];
    texture: any;
    playerPosition: [number, number, number];
}

function InstancedCubeGroup({
    type,
    allCubes,
    activeCubeIds,
    texture,
}: InstancedCubeGroupProps) {
    const meshRef = useRef<InstancedMesh>(null);
    const cubeIds = useMemo(() => allCubes.map(c => c.id), [allCubes]);

    useLayoutEffect(() => {
        if (!meshRef.current) return;
        meshRef.current.count = allCubes.length;
        const dummy = new Object3D();

        allCubes.forEach((cube, i) => {
            if (activeCubeIds.includes(cube.id)) {
                dummy.scale.set(0, 0, 0); // Hide if active (rendered separately)
            } else {
                dummy.position.set(cube.position[0], cube.position[1], cube.position[2]);
                dummy.scale.set(1, 1, 1);
                dummy.rotation.set(0, 0, 0);
            }
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [allCubes, activeCubeIds]);

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, allCubes.length]}
            castShadow
            receiveShadow
            userData={{ cubeIds }} // For Raycasting
            frustumCulled={true} // Ensure THREE.js frustum culling is on
        >
            <boxGeometry args={[2.0, 2.0, 2.0]} />
            <meshStandardMaterial
                map={texture}
                roughness={0.8}
                metalness={0.1}
            />
        </instancedMesh>
    );
}
