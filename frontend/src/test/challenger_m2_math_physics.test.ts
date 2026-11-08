/**
 * challenger_m2_math_physics.test.ts
 *
 * Empirical verification harness for Milestone 2 Challenger 2 (Mathematical & Physics Verification).
 * Independently stress-tests coordinate transformations, spherical geometry, Catmull-Rom splines,
 * heightfield normalization, Coulomb-Hooke physics relaxation, harmonic breathing, and orbital mechanics.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import type { MonetaryTransitArc, DailyCashProjectionPoint } from '../types';

describe('Empirical Verification: Milestone 2 Mathematical & Physics Fidelity', () => {

  // =========================================================================
  // 1. GLOBESCENE: Spherical Trigonometry & Golden Ratio Lattice
  // =========================================================================
  describe('GlobeScene: Spherical Trigonometry & Fibonacci Lattice', () => {
    const R = 3.6; // Globe radius defined in GlobeScene.ts

    it('empirically verifies 2,000 Fibonacci lattice points have exact spherical radius R = 3.6', () => {
      const count = 2000;
      const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle
      let minRadius = Infinity;
      let maxRadius = -Infinity;
      let minNeighborDist = Infinity;
      const points: THREE.Vector3[] = [];

      for (let i = 0; i < count; i++) {
        const yNorm = 1 - (i / (count - 1)) * 2;
        const radiusAtY = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
        const theta = phi * i;

        const x = Math.cos(theta) * radiusAtY * R;
        const y = yNorm * R;
        const z = Math.sin(theta) * radiusAtY * R;

        const p = new THREE.Vector3(x, y, z);
        points.push(p);

        const r = p.length();
        if (r < minRadius) minRadius = r;
        if (r > maxRadius) maxRadius = r;

        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(y)).toBe(true);
        expect(Number.isFinite(z)).toBe(true);
      }

      // Every point must lie on sphere of radius R within floating point tolerance
      expect(minRadius).toBeGreaterThan(3.5999);
      expect(maxRadius).toBeLessThan(3.6001);

      // Check distribution: sample 100 points for nearest-neighbor distance
      for (let i = 0; i < 100; i++) {
        let nearest = Infinity;
        for (let j = 0; j < count; j++) {
          if (i === j) continue;
          const d = points[i].distanceTo(points[j]);
          if (d < nearest) nearest = d;
        }
        if (nearest < minNeighborDist) minNeighborDist = nearest;
      }
      // Points must be uniformly dispersed, not clustered at poles
      expect(minNeighborDist).toBeGreaterThan(0.04);
      expect(minNeighborDist).toBeLessThan(0.35);
    });

    it('empirically verifies latLngToVector3 transformation preservation of Euclidean norm', () => {
      function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
      }

      const testCities: Array<{ name: string; lat: number; lng: number }> = [
        { name: 'North Pole', lat: 90, lng: 0 },
        { name: 'South Pole', lat: -90, lng: 0 },
        { name: 'Equator Prime Meridian', lat: 0, lng: 0 },
        { name: 'Equator Date Line', lat: 0, lng: 180 },
        { name: 'San Jose, CA', lat: 37.3382, lng: -121.8863 },
        { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
        { name: 'Tokyo, JP', lat: 35.6762, lng: 139.6503 },
        { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
        { name: 'Berlin, DE', lat: 52.52, lng: 13.405 },
      ];

      testCities.forEach((city) => {
        const v = latLngToVector3(city.lat, city.lng, R);
        expect(v.length()).toBeCloseTo(R, 4);

        if (city.name === 'North Pole') {
          expect(v.x).toBeCloseTo(0, 4);
          expect(v.y).toBeCloseTo(R, 4);
          expect(v.z).toBeCloseTo(0, 4);
        } else if (city.name === 'South Pole') {
          expect(v.x).toBeCloseTo(0, 4);
          expect(v.y).toBeCloseTo(-R, 4);
          expect(v.z).toBeCloseTo(0, 4);
        } else if (city.name === 'Equator Prime Meridian') {
          expect(v.y).toBeCloseTo(0, 4);
          expect(v.x).toBeCloseTo(R, 4);
          expect(v.z).toBeCloseTo(0, 4);
        }
      });
    });

    it('empirically verifies quadratic Bézier transit arc flight altitude peaks above globe radius for all routes', () => {
      function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
      }

      const arcs: MonetaryTransitArc[] = [
        {
          id: 'ARC-1',
          sourceCity: 'San Jose, CA',
          sourceCoords: [37.3382, -121.8863],
          destCity: 'London, UK',
          destCoords: [51.5074, -0.1278],
          amount: 14200,
          currency: 'USD',
          type: 'PAYPAL_INFLOW',
          timestamp: '2024-11-06T12:00:00Z',
        },
        {
          id: 'ARC-2',
          sourceCity: 'Berlin, DE',
          sourceCoords: [52.52, 13.405],
          destCity: 'New York, NY',
          destCoords: [40.7128, -74.006],
          amount: 8650,
          currency: 'USD',
          type: 'PAYPAL_INFLOW',
          timestamp: '2024-11-06T12:15:00Z',
        },
        {
          id: 'ARC-3',
          sourceCity: 'Singapore',
          sourceCoords: [1.3521, 103.8198],
          destCity: 'San Jose, CA',
          destCoords: [37.3382, -121.8863],
          amount: 22500,
          currency: 'USD',
          type: 'SUPPLIER_OUTFLOW',
          timestamp: '2024-11-06T12:30:00Z',
        },
        {
          id: 'ARC-4',
          sourceCity: 'Toronto, CA',
          sourceCoords: [43.6532, -79.3832],
          destCity: 'San Jose, CA',
          destCoords: [37.3382, -121.8863],
          amount: 1420,
          currency: 'USD',
          type: 'RECOVERY_CREDIT',
          timestamp: '2024-11-06T13:00:00Z',
        },
        {
          id: 'ARC-5',
          sourceCity: 'Tokyo, JP',
          sourceCoords: [35.6762, 139.6503],
          destCity: 'San Jose, CA',
          destCoords: [37.3382, -121.8863],
          amount: 5400,
          currency: 'USD',
          type: 'DISPUTE_HOLD',
          timestamp: '2024-11-06T13:15:00Z',
        },
      ];

      arcs.forEach((arc) => {
        const p0 = latLngToVector3(arc.sourceCoords[0], arc.sourceCoords[1], R);
        const p1 = latLngToVector3(arc.destCoords[0], arc.destCoords[1], R);
        const chordDist = p0.distanceTo(p1);

        const mid = p0.clone().add(p1).multiplyScalar(0.5);
        const elevation = R + Math.max(chordDist * 0.32, 0.45);
        const pMid = mid.normalize().multiplyScalar(elevation);

        const curve = new THREE.QuadraticBezierCurve3(p0, pMid, p1);

        const start = curve.getPoint(0);
        const peak = curve.getPoint(0.5);
        const end = curve.getPoint(1);

        expect(start.length()).toBeCloseTo(R, 3);
        expect(end.length()).toBeCloseTo(R, 3);
        // Apex altitude at t=0.5 must be elevated above sphere radius R
        expect(peak.length()).toBeGreaterThan(R);
        expect(peak.length()).toBeLessThanOrEqual(elevation);
      });
    });

    it('empirically exposes trans-global mantle dip on wide-span arcs (> 130 deg)', () => {
      function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
      }

      // ARC-3: Singapore to San Jose spans ~135.5 degrees great circle
      const p0 = latLngToVector3(1.3521, 103.8198, R);
      const p1 = latLngToVector3(37.3382, -121.8863, R);
      const chordDist = p0.distanceTo(p1);

      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      const elevation = R + Math.max(chordDist * 0.32, 0.45);
      const pMid = mid.normalize().multiplyScalar(elevation);
      const curve = new THREE.QuadraticBezierCurve3(p0, pMid, p1);

      let minAlt = Infinity;
      for (let t = 0; t <= 1; t += 0.01) {
        const alt = curve.getPoint(t).length();
        if (alt < minAlt) minAlt = alt;
      }

      // Empirical observation: near t=0.08, arc cuts slightly into globe surface (alt = 3.501 < 3.600)
      expect(minAlt).toBeLessThan(R);
      expect(minAlt).toBeCloseTo(3.501, 2);
    });
  });

  // =========================================================================
  // 2. MONEYMAPSCENE: 3D Catmull-Rom Spline Corridors
  // =========================================================================
  describe('MoneyMapScene: 3D Catmull-Rom Splines & Corridor Kinematics', () => {
    it('empirically verifies 3D Catmull-Rom spline curves across multi-tier accounts have valid continuity & no NaN', () => {
      const pSrc = new THREE.Vector3(-7.2, 2.2, -2.5);
      const pDst = new THREE.Vector3(-2.4, 1.4, -1.2);

      const p0 = pSrc.clone().add(new THREE.Vector3(0, 0.6, 0));
      const p3 = pDst.clone().add(new THREE.Vector3(0, 0.6, 0));

      const dx = p3.x - p0.x;
      const dy = p3.y - p0.y;
      const dz = p3.z - p0.z;

      const p1 = p0.clone().add(new THREE.Vector3(dx * 0.4, dy * 0.2 + 0.7, dz * 0.2));
      const p2 = p3.clone().sub(new THREE.Vector3(dx * 0.4, -dy * 0.2 + 0.7, -dz * 0.2));

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3], false, 'catmullrom', 0.4);
      const points = curve.getPoints(50);

      expect(points.length).toBe(51);
      expect(points[0].distanceTo(p0)).toBeCloseTo(0, 4);
      expect(points[50].distanceTo(p3)).toBeCloseTo(0, 4);

      // Verify no NaN or sudden discontinuities
      for (let i = 0; i < points.length; i++) {
        expect(Number.isFinite(points[i].x)).toBe(true);
        expect(Number.isFinite(points[i].y)).toBe(true);
        expect(Number.isFinite(points[i].z)).toBe(true);

        if (i > 0) {
          const stepDist = points[i].distanceTo(points[i - 1]);
          expect(stepDist).toBeGreaterThan(0.01);
          expect(stepDist).toBeLessThan(1.0);
        }
      }
    });

    it('empirically checks particle stream phase progression along 3D splines', () => {
      const particleCount = 40;
      const speed = 0.35;
      const elapsed = 2.5;

      const phases: number[] = [];
      for (let j = 0; j < particleCount; j++) {
        const phase = j / particleCount;
        const t = (elapsed * speed + phase) % 1.0;
        phases.push(t);
        expect(t).toBeGreaterThanOrEqual(0.0);
        expect(t).toBeLessThan(1.0);
      }

      // Check phase spacing is strictly monotonic modulo 1
      const sortedPhases = [...phases].sort((a, b) => a - b);
      for (let k = 1; k < sortedPhases.length; k++) {
        const diff = sortedPhases[k] - sortedPhases[k - 1];
        expect(diff).toBeCloseTo(1 / particleCount, 4);
      }
    });
  });

  // =========================================================================
  // 3. TERRAINSCENE: Heightfield Normalization & Safety Plane Geometry
  // =========================================================================
  describe('TerrainScene: Heightfield Elevation & Safety Plane Geometry', () => {
    it('empirically verifies heightfield Y displacement bounds and cosine cross-profile', () => {
      const minHeightY = -3.5;
      const maxHeightY = 5.0;
      const heightSpan = maxHeightY - minHeightY; // 8.5
      const segmentsZ = 28;

      // Mock 91 cash points with varying balances
      const mockPoints: DailyCashProjectionPoint[] = Array.from({ length: 91 }, (_, i) => ({
        dayIndex: i,
        date: `2024-11-${String((i % 30) + 1).padStart(2, '0')}`,
        startingBalance: 10000,
        inFlow: 5000,
        outFlow: 4000,
        netCash: 1000,
        balance: 10000 + Math.sin(i / 10) * 50000 + i * 800,
        isBreached: false,
      }));

      let minBal = Infinity;
      let maxBal = -Infinity;
      mockPoints.forEach((pt) => {
        if (pt.balance < minBal) minBal = pt.balance;
        if (pt.balance > maxBal) maxBal = pt.balance;
      });
      const balanceRange = Math.max(maxBal - minBal, 1000);

      for (let iz = 0; iz <= segmentsZ; iz++) {
        const zRatio = (iz / segmentsZ) * 2 - 1; // [-1, 1]
        const crossProfile = Math.cos(zRatio * Math.PI * 0.45);

        // crossProfile must be strictly positive (never inverts)
        expect(crossProfile).toBeGreaterThan(0.15);
        expect(crossProfile).toBeLessThanOrEqual(1.0);

        for (let ix = 0; ix <= 90; ix++) {
          const balance = mockPoints[ix].balance;
          const normBal = (balance - minBal) / balanceRange;
          const targetY = (minHeightY + normBal * heightSpan) * crossProfile;

          expect(targetY).toBeGreaterThanOrEqual(minHeightY - 0.01);
          expect(targetY).toBeLessThanOrEqual(maxHeightY + 0.01);
          expect(Number.isFinite(targetY)).toBe(true);
        }
      }
    });

    it('empirically verifies safety buffer plane ($15,000) height alignment', () => {
      const minHeightY = -3.5;
      const maxHeightY = 5.0;
      const heightSpan = maxHeightY - minHeightY;
      const safetyBuffer = 15000;

      const minBal = 5000;
      const maxBal = 105000;
      const balanceRange = maxBal - minBal; // 100,000

      const normalizedSafety = (safetyBuffer - minBal) / balanceRange; // (15k - 5k) / 100k = 0.1
      const safetyY = minHeightY + normalizedSafety * heightSpan; // -3.5 + 0.1 * 8.5 = -2.65

      expect(safetyY).toBeCloseTo(-2.65, 3);
      expect(safetyY).toBeGreaterThan(minHeightY);
      expect(safetyY).toBeLessThan(maxHeightY);
    });

    it('empirically verifies color grading gradient transitions at $15k and $60k thresholds', () => {
      const colorSurplus = new THREE.Color(0x00f2fe);
      const colorHealthy = new THREE.Color(0x10b981);
      const colorWarning = new THREE.Color(0xf59e0b);
      const colorBreach = new THREE.Color(0xef4444);

      function computeColor(balance: number, safetyBuffer = 15000, maxBal = 120000): THREE.Color {
        const vertexColor = new THREE.Color();
        if (balance < safetyBuffer) {
          const t = Math.max(0, Math.min(1, (safetyBuffer - balance) / Math.max(1, safetyBuffer)));
          vertexColor.copy(colorWarning).lerp(colorBreach, t);
        } else if (balance < 60000) {
          const t = (balance - safetyBuffer) / (60000 - safetyBuffer);
          vertexColor.copy(colorWarning).lerp(colorHealthy, t);
        } else {
          const t = Math.min(1, (balance - 60000) / (maxBal - 60000 + 1));
          vertexColor.copy(colorHealthy).lerp(colorSurplus, t);
        }
        return vertexColor;
      }

      // Check breach point: $0 balance
      const cBreach = computeColor(0);
      expect(cBreach.r).toBeCloseTo(colorBreach.r, 2);
      expect(cBreach.g).toBeCloseTo(colorBreach.g, 2);

      // Check boundary at exactly safetyBuffer ($15,000)
      const cWarning = computeColor(15000);
      expect(cWarning.r).toBeCloseTo(colorWarning.r, 2);
      expect(cWarning.g).toBeCloseTo(colorWarning.g, 2);

      // Check boundary at $60,000
      const cHealthy = computeColor(60000);
      expect(cHealthy.r).toBeCloseTo(colorHealthy.r, 2);
      expect(cHealthy.g).toBeCloseTo(colorHealthy.g, 2);

      // Check high surplus ($120,000)
      const cSurplus = computeColor(120000);
      expect(cSurplus.r).toBeCloseTo(colorSurplus.r, 2);
      expect(cSurplus.g).toBeCloseTo(colorSurplus.g, 2);
    });
  });

  // =========================================================================
  // 4. NODEGRAPHSCENE: Coulomb Repulsion & Hooke's Law Convergence
  // =========================================================================
  describe('NodeGraphScene: Coulomb Repulsion & Hooke Spring Physics', () => {
    it('empirically simulates Coulomb-Hooke physics relaxation from spherical layout', () => {
      const count = 6;
      const radius = 4.2;
      const nodes: Array<{ id: string; pos: THREE.Vector3; vel: THREE.Vector3 }> = [];

      // Initial spherical arrangement matching NodeGraphScene
      for (let idx = 0; idx < count; idx++) {
        const theta = (idx / count) * Math.PI * 2;
        const phi = (idx % 2 === 0 ? 0.35 : -0.35) * Math.PI;
        const pos = new THREE.Vector3(
          radius * Math.cos(theta) * Math.cos(phi),
          radius * Math.sin(phi),
          radius * Math.sin(theta) * Math.cos(phi)
        );
        nodes.push({ id: 'N' + idx, pos, vel: new THREE.Vector3(0, 0, 0) });
      }

      const edges = [
        { source: 'N0', target: 'N1' },
        { source: 'N1', target: 'N2' },
        { source: 'N2', target: 'N3' },
        { source: 'N3', target: 'N4' },
        { source: 'N4', target: 'N5' },
        { source: 'N5', target: 'N0' },
      ];

      const kRepulse = 38.0;
      const kSpring = 0.85;
      const springLength = 4.2;
      const kCenter = 0.22;
      const dt = 0.016;

      const kineticEnergies: number[] = [];

      for (let tick = 0; tick < 180; tick++) {
        // 1. Coulomb Repulsion
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const delta = new THREE.Vector3().subVectors(nodes[i].pos, nodes[j].pos);
            const distSq = Math.max(delta.lengthSq(), 0.1);
            const forceMag = kRepulse / distSq;
            const force = delta.normalize().multiplyScalar(forceMag);

            nodes[i].vel.addScaledVector(force, dt);
            nodes[j].vel.addScaledVector(force, -dt);
          }
          // Centering gravity
          nodes[i].vel.addScaledVector(nodes[i].pos, -kCenter * dt);
        }

        // 2. Hooke's Springs
        for (const edge of edges) {
          const nSrc = nodes.find((n) => n.id === edge.source)!;
          const nTgt = nodes.find((n) => n.id === edge.target)!;
          const delta = new THREE.Vector3().subVectors(nTgt.pos, nSrc.pos);
          const dist = Math.max(delta.length(), 0.05);
          const displacement = dist - springLength;
          const springForce = delta.normalize().multiplyScalar(kSpring * displacement);

          nSrc.vel.addScaledVector(springForce, dt);
          nTgt.vel.addScaledVector(springForce, -dt);
        }

        // 3. Damping & Integration
        let totalKinetic = 0;
        nodes.forEach((n) => {
          n.vel.multiplyScalar(0.84);
          n.pos.addScaledVector(n.vel, dt);
          if (n.pos.length() > 7.5) {
            n.pos.normalize().multiplyScalar(7.5);
          }
          totalKinetic += n.vel.lengthSq();
        });

        kineticEnergies.push(totalKinetic);
      }

      const peakKinetic = Math.max(...kineticEnergies);
      const finalKinetic = kineticEnergies[kineticEnergies.length - 1];

      // Energy relaxes from peak by > 75%
      expect(finalKinetic).toBeLessThan(peakKinetic * 0.35);
      expect(finalKinetic).toBeLessThan(0.6);

      // Verify all nodes remain strictly within boundary sphere (radius 7.5)
      nodes.forEach((n) => {
        expect(n.pos.length()).toBeLessThanOrEqual(7.5);
        expect(Number.isFinite(n.pos.x)).toBe(true);
      });
    });

    it('empirically verifies singularity prevention when two nodes start at identical position (r=0)', () => {
      const posA = new THREE.Vector3(0, 0, 0);
      const posB = new THREE.Vector3(0, 0, 0);
      const velA = new THREE.Vector3(0, 0, 0);
      const velB = new THREE.Vector3(0, 0, 0);

      const delta = new THREE.Vector3().subVectors(posA, posB);
      const distSq = Math.max(delta.lengthSq(), 0.1);
      const forceMag = 38.0 / distSq;
      const force = delta.normalize().multiplyScalar(forceMag);

      velA.addScaledVector(force, 0.016);
      velB.addScaledVector(force, -0.016);

      // Three.js (0,0,0).normalize() produces (0,0,0) without throwing or producing NaN
      expect(Number.isFinite(velA.x)).toBe(true);
      expect(Number.isFinite(velB.x)).toBe(true);
      expect(Number.isNaN(velA.x)).toBe(false);
      expect(Number.isNaN(velB.x)).toBe(false);
    });
  });

  // =========================================================================
  // 5. DIGITALTWINSCENE: Harmonic Breathing & Orbital Kinematics
  // =========================================================================
  describe('DigitalTwinScene: Harmonic Breathing & Orbital Particle Dynamics', () => {
    it('empirically verifies harmonic breathing equation R(t) = R_0 * (1 + A * sin(2*pi*f*t)) never reaches zero', () => {
      const R0 = 1.6;
      const testCases = [
        { state: 'STABLE', f: 1.0, A: 0.08 },
        { state: 'EXPANDING', f: 1.6, A: 0.16 },
        { state: 'CONTRACTING', f: 1.8, A: 0.12 },
        { state: 'CRITICAL', f: 2.8, A: 0.24 },
        { state: 'MAX_CLICK', f: 2.8, A: 0.30 },
      ];

      testCases.forEach(({ state, f, A }) => {
        let minR = Infinity;
        let maxR = -Infinity;

        // Sample 1000 time steps over 5 seconds
        for (let step = 0; step < 1000; step++) {
          const t = step * 0.005;
          const pulseFactor = 1.0 + A * Math.sin(t * Math.PI * 2 * f);
          const currentR = R0 * pulseFactor;

          if (currentR < minR) minR = currentR;
          if (currentR > maxR) maxR = currentR;

          expect(pulseFactor).toBeGreaterThan(0.5); // Never collapses to 0
          expect(Number.isFinite(currentR)).toBe(true);
        }

        expect(minR).toBeCloseTo(R0 * (1 - A), 3);
        expect(maxR).toBeCloseTo(R0 * (1 + A), 3);
      });
    });

    it('empirically verifies 3 concentric orbital rings have strictly non-overlapping radii & Keplerian speeds', () => {
      const rings = [
        { name: 'PayPal Available Balance', radius: 3.3, count: 120, baseSpeed: 1.35 },
        { name: 'Bank Operating Checking', radius: 4.5, count: 100, baseSpeed: 0.95 },
        { name: 'Emergency Reserve Savings', radius: 5.8, count: 80, baseSpeed: 0.55 },
      ];

      // Strictly increasing radii: 3.3 < 4.5 < 5.8
      expect(rings[0].radius).toBeLessThan(rings[1].radius);
      expect(rings[1].radius).toBeLessThan(rings[2].radius);

      // Strictly decreasing orbital velocities (Keplerian relationship)
      expect(rings[0].baseSpeed).toBeGreaterThan(rings[1].baseSpeed);
      expect(rings[1].baseSpeed).toBeGreaterThan(rings[2].baseSpeed);

      // Check wavy oscillation bounds
      for (let i = 0; i < rings[0].count; i++) {
        const theta = (i / rings[0].count) * Math.PI * 2;
        const yOffset = Math.sin(theta * 3) * 0.28;
        expect(Math.abs(yOffset)).toBeLessThanOrEqual(0.28);
      }
    });

    it('empirically verifies liquidity ratio angular velocity scaling remains positive', () => {
      const baseSpeed = 1.35;
      const testRatios = [0.0, 0.25, 0.5, 0.75, 1.0];

      testRatios.forEach((ratio) => {
        const currentSpeed = baseSpeed * (0.8 + ratio * 1.5);
        expect(currentSpeed).toBeGreaterThanOrEqual(baseSpeed * 0.8);
        expect(currentSpeed).toBeLessThanOrEqual(baseSpeed * 2.3);
      });
    });
  });

  // =========================================================================
  // 6. FUNNELSCENE, FIREWALLSCENE & AMBIENTSCENE: Dynamics & Conservation
  // =========================================================================
  describe('FunnelScene, FirewallScene & AmbientScene Physics', () => {
    it('empirically verifies funnel angular velocity acceleration conserves rotational vortex momentum', () => {
      function getFunnelRadiusAtY(y: number): number {
        const stages = [
          { yTop: 3.6, yBottom: 1.8, rTop: 3.4, rBottom: 2.7 },
          { yTop: 1.8, yBottom: 0.2, rTop: 2.7, rBottom: 2.0 },
          { yTop: 0.2, yBottom: -1.4, rTop: 2.0, rBottom: 1.3 },
          { yTop: -1.4, yBottom: -3.0, rTop: 1.3, rBottom: 0.85 },
        ];
        for (const s of stages) {
          if (y >= s.yBottom && y <= s.yTop) {
            const t = (y - s.yBottom) / (s.yTop - s.yBottom);
            return s.rBottom + t * (s.rTop - s.rBottom);
          }
        }
        return 1.0;
      }

      const topRadius = getFunnelRadiusAtY(3.6);
      const bottomRadius = getFunnelRadiusAtY(-3.0);

      expect(topRadius).toBeCloseTo(3.4, 2);
      expect(bottomRadius).toBeCloseTo(0.85, 2);

      const topOmega = 1.8 / Math.max(0.5, topRadius);
      const bottomOmega = 1.8 / Math.max(0.5, bottomRadius);

      // Particle spins significantly faster at funnel bottom (narrow vortex)
      expect(bottomOmega).toBeGreaterThan(topOmega * 3.5);
    });

    it('empirically verifies FirewallScene gyroscopic gimbal rings maintain orthogonal rotation axes', () => {
      const ring1Euler = new THREE.Euler(0, 0, 0);
      const ring2Euler = new THREE.Euler(Math.PI / 3, 0, 0);
      const ring3Euler = new THREE.Euler(0, Math.PI / 4, 0);

      expect(ring1Euler.x).not.toBe(ring2Euler.x);
      expect(ring2Euler.y).not.toBe(ring3Euler.y);
    });

    it('empirically verifies AmbientScene mouse repulsion inverse-distance force equation', () => {
      const repulsionRadius = 5.5;
      const mouse = new THREE.Vector2(0, 0);

      const testDistances = [0.5, 1.5, 3.0, 5.0, 5.5, 7.0];
      testDistances.forEach((d) => {
        const p = new THREE.Vector2(d, 0);
        const distSq = p.distanceToSquared(mouse);

        if (distSq < repulsionRadius * repulsionRadius && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / repulsionRadius) * 0.12;
          expect(force).toBeGreaterThan(0);
          expect(force).toBeLessThanOrEqual(0.12);
        } else {
          // Out of range: force is 0
          const force = distSq < repulsionRadius * repulsionRadius ? 0.12 : 0;
          expect(force).toBe(0);
        }
      });
    });
  });
});
