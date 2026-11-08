# Project: PayPilot — AI-Assisted Financial Intelligence Platform

## Architecture
PayPilot is built with React 18.3, TypeScript, Vite, Tailwind CSS, Three.js, and AG Grid.
The architecture is structured in a clean, decoupled layer system:
- **Presentation Layer**: 12 core screens with dark obsidian fintech theme, accessible via responsive Sidebar and Header navigation.
- **Visuals Layer**: Three.js 3D canvas visual effects encapsulated in a safe `ThreeCanvasContainer` with strict lifecycle hooks (`init`, `updateData`, `resize`, `onPointerMove`, `destroy`), VRAM resource disposal, and automatic 2D SVG/Canvas fallback.
- **Tables Layer**: High-density AG Grid v32 dark-themed tables across Recovery Inbox, Payment Truth Queue, and Udhari Ledger with sorting, filtering, selection, and custom renderers.
- **State & Mock Services Layer**: Zustand store (`usePayPilotStore`) holding immutable deep-cloned demo seed data, atomic mutators, simulated PayPal Sandbox API execution (refunds, dispute filing, claims), and an instant One-Click Judge Reset mechanism.
- **Timeline & Charting Layer**: Custom, lightweight SVG/Canvas Gantt chart and real-time recalculated interactive Cash-Flow Curve responsive to parameter sliders.

```
frontend/
├── src/
│   ├── components/
│   │   ├── 3d/                  # Three.js Scene Controllers & ThreeCanvasContainer
│   │   │   ├── ThreeCanvasContainer.tsx
│   │   │   ├── scenes/
│   │   │   │   ├── GlobeScene.ts
│   │   │   │   ├── MoneyMapScene.ts
│   │   │   │   ├── TerrainScene.ts
│   │   │   │   ├── NodeGraphScene.ts
│   │   │   │   ├── FirewallScene.ts
│   │   │   │   ├── DigitalTwinScene.ts
│   │   │   │   ├── FunnelScene.ts
│   │   │   │   └── AmbientScene.ts
│   │   │   └── utils/threeDisposal.ts
│   │   ├── common/              # Shared UI cards, badges, sliders, drawers
│   │   │   ├── ExplainabilityDrawer.tsx
│   │   │   ├── JudgeResetButton.tsx
│   │   │   ├── DemoFlowStepper.tsx
│   │   │   ├── HashBadge.tsx
│   │   │   └── StatCard.tsx
│   │   ├── tables/              # AG Grid wrappers & custom cell renderers
│   │   │   ├── RecoveryInboxTable.tsx
│   │   │   ├── PaymentTruthTable.tsx
│   │   │   └── UdhariLedgerTable.tsx
│   │   ├── charts/              # Cash-flow curves, Gantt, Radar charts
│   │   │   ├── InteractiveCashCurve.tsx
│   │   │   ├── CommitmentGanttChart.tsx
│   │   │   └── SurvivalRadarChart.tsx
│   │   └── layout/              # Nav sidebar, topbar, status indicator
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── views/                   # 12 Core Module Screens
│   │   ├── CommandCenterView.tsx
│   │   ├── PayBackHunterView.tsx
│   │   ├── PaymentTruthView.tsx
│   │   ├── CommitmentsView.tsx
│   │   ├── DigitalTwinView.tsx
│   │   ├── SimulationLabView.tsx
│   │   ├── SurvivalRadarView.tsx
│   │   ├── UdhariLedgerView.tsx
│   │   ├── CopilotView.tsx
│   │   ├── ApprovalsView.tsx
│   │   ├── TeamSharingView.tsx
│   │   └── SettingsView.tsx
│   ├── store/                   # Zustand state store
│   │   ├── usePayPilotStore.ts
│   │   └── demoSeedData.ts
│   ├── services/                # Mock PayPal Sandbox & API abstraction
│   │   ├── sandboxService.ts
│   │   └── hashService.ts
│   ├── types/                   # TypeScript data contracts
│   │   └── index.ts
│   ├── test/                    # Test setup & test suites
│   │   └── setup.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── index.html
```

## Feature Inventory
Every feature from the Survey phase appears here with its assigned milestone.
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 12-Route Nav Shell | Responsive sidebar & header navigation across all 12 core application views | M4 | R3 |
| 2 | 3D Interactive Hero Globe | Three.js particle globe representing global transactions and PayPal cash flow | M2 | R2, R3 |
| 3 | Executive KPI Matrix | Cards for Total Cash ($142.5k), Recoverable ($18.4k), 30d Payables ($43.2k), Runway (94d) | M4 | R3 |
| 4 | 3D Visual Funnel | 3D tiered glowing funnel visualizing recovery pipeline conversion | M2 | R2, R4 |
| 5 | Recovery Inbox AG Grid | Interactive data table of identified lost revenue candidates | M3 | R1, R3 |
| 6 | Single/Batch Claim Trigger | Dispatches recovery claims to simulated PayPal Sandbox | M3 | R3, R5 |
| 7 | 3D Interactive Node Graph | Three.js node-link graph connecting Invoices, Bank Feeds, and PayPal Transactions | M2 | R2, R3 |
| 8 | Payment Truth Queue AG Grid | Reconciled transaction ledger highlighting variance and match confidence | M3 | R1, R3 |
| 9 | Discrepancy Mismatch Inspector | Modal/drawer highlighting discrepancy root cause between source records | M3 | R3, R4 |
| 10 | Animated 3D Shield/Firewall | Dynamic 3D force-field reacting to business risk and order viability | M2 | R2, R3 |
| 11 | Commitment Workbench Gantt | Open-source Gantt and timeline view of future financial commitments | M4 | R1, R3 |
| 12 | Order Evaluation Simulator | Interactive form to stress-test new purchase orders or vendor contracts | M4 | R3, R5 |
| 13 | Glowing 3D Orb / Particle System | Central Three.js energetic sphere reflecting liquidity and financial health | M2 | R2, R3 |
| 14 | Time Scrubbing Slider | Slider moving time forward from Day 0 to Day +90/+180 | M4 | R3 |
| 15 | Balance Sheet & Liquidity Matrix | Real-time working capital, quick ratio, burn rate, and cash reservoirs | M4 | R3 |
| 16 | 3D Cash-Flow Landscape/Terrain | Interactive heightfield mesh surface where valleys represent cash dips | M2 | R2, R3 |
| 17 | Interactive Cash-Flow Curve | Dynamic line chart of daily projected cash balance over 90 days with 3 sliders | M4 | R4 |
| 18 | Scenario Comparison Engine | Side-by-side comparison of Baseline, Optimistic, and Conservative tracks | M4 | R3, R4 |
| 19 | Multi-Axis Radar Chart | Visual spider/radar chart scoring 6 resilience dimensions | M4 | R3 |
| 20 | Stress-Test Execution Lab | Pre-configured shock scenarios (Client Default, Dispute Surge, Revenue Shock) | M4 | R3 |
| 21 | Udhari Debt Ledger AG Grid | Customer credit and receivable ledger with aging classification | M3 | R1, R3 |
| 22 | Aging Bucket Visualizer | Segmented metric bar for 0-15d, 16-30d, 31-60d, and 60+d debt | M3 | R3 |
| 23 | Collection Action Triggers | Quick action buttons for WhatsApp reminder, PayPal Invoice, Settlement | M3 | R3 |
| 24 | Grounded Financial Copilot | Natural-language conversational interface over verified business data | M5 | R3 |
| 25 | Verified Context Inspector | Sidebar displaying ground-truth data points currently bound to context | M5 | R3 |
| 26 | Governed Action Queue | List of AI-prepared actions requiring human owner sign-off | M5 | R3, R5 |
| 27 | Exact Payload Inspection | Deep JSON viewer showing raw payload destined for PayPal Sandbox API | M5 | R3, R4 |
| 28 | Sandbox Execution Simulator | Executes approved payload against simulated PayPal Sandbox endpoint | M5 | R3, R5 |
| 29 | Hash-Signed Report Generator | Generates auditable reports with cryptographic verification badge (SHA-256) | M5 | R4 |
| 30 | Scoped Expiring Link Generator | Creates shareable URL with embedded signature and expiration window | M5 | R3, R5 |
| 31 | PayPal Sandbox Configuration | Configuration card for PayPal Sandbox Client ID, Secret, and Environment | M1 | R3 |
| 32 | One-Click Judge Reset Button | Resets and re-seeds entire demo workspace with clean sample data | M1 | R4, R5 |
| 33 | Explainability Drawer | Global slide-over drawer displaying rule, formula, source, and raw JSON | M3 | R4 |
| 34 | Ambient Particle Background | Subtle Three.js / Canvas particle effect behind dark-themed UI cards | M1 | R2 |
| 35 | 5-Act Demo Controller | Step-by-step guided stepper for hackathon judges (Find -> Prove -> Recover -> Protect -> Share) | M5 | R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Project Foundation, Store & Sandbox | Vite, React 18.3, TypeScript, Tailwind CSS, Lucide icons, dark theme, TypeScript data contracts, Zustand store with deep-clone seed data, One-Click Judge Reset, simulated PayPal Sandbox service, ThreeCanvasContainer with WebGL lifecycle & 2D fallback | none | DONE |
| M2 | Three.js 3D Visual Graphics Engines | 8 Three.js scene controllers (Globe, MoneyMap, Terrain, NodeGraph, Shield, DigitalTwin, Funnel, Ambient) with lifecycle hooks, particle systems, shaders, and VRAM disposal | M1 | DONE |
| M3 | Recovery, Reconciliation & Udhari Tables | AG Grid tables for Recovery Inbox, Payment Truth Queue, and Udhari Ledger; 4-Stage Verified-Recovery Funnel; Explainability Drawer with raw JSON & formulas; collection action triggers | M1 | DONE |
| M4 | Intelligence, Commitments & Simulation Lab | Command Center dashboard, Commitment Workbench Gantt & Firewall evaluation, Financial Digital Twin with time scrubbing slider, Simulation Lab with Interactive Cash-Flow Curve (3 sliders) and scenarios, Survival Radar | M1, M2 | DONE |
| M5 | Copilot, Approvals, Sharing & Demo Flow | Agent Workspace Copilot, Approvals governed queue with raw JSON inspector, Team & Secure Sharing with SHA-256 hash badges, Settings & PayPal Sandbox config, 5-Act Demo Controller, nav shell across 12 routes | M1, M3, M4 | DONE |
| M6 | Final E2E Test Suite & Adversarial Hardening | Phase 1: 100% pass on E2E test suite published in TEST_READY.md; Phase 2: Adversarial coverage hardening with Challenger stress-testing | M1-M5, TEST_READY.md | DONE |
| E2E | Parallel E2E Testing Track | Independent opaque-box test infrastructure and test cases across Tier 1 (Feature Coverage), Tier 2 (Boundary & Corner), Tier 3 (Cross-Feature Combinations), Tier 4 (Real-World Demo Flows), publishing TEST_READY.md | none | DONE |

## Interface Contracts
### Store ↔ UI Components (`usePayPilotStore`)
- `usePayPilotStore.getState()`: Direct atomic state access.
- `resetToDemoState()`: Purges modifications, resets state to deep-cloned pristine demo dataset, returns boolean.
- `updateSimulationParameters(params: { depositPct: number; delayDays: number; split: MilestoneSplit })`: Recalculates projected daily cash balances array: `Array<{ day: number; date: string; balance: number; inFlow: number; outFlow: number }>`.
- `executeSandboxClaim(caseId: string, notes?: string)`: Simulates async PayPal Sandbox execution (800ms latency), returns `Promise<{ success: boolean; txnId: string; timestamp: string }>`.
- `openExplainability(ruleId: string, contextRecordId?: string)`: Sets drawer state `{ isOpen: true, ruleId, recordId }`.
- `generateSignedReport(type: ReportType)`: Returns `{ payloadHash: string; signatureBadge: string; generatedAt: string; data: any }`.

### ThreeCanvasContainer ↔ ThreeSceneController
```typescript
export interface ThreeSceneController {
  init(container: HTMLElement): void;
  updateData?(data: any): void;
  resize(width: number, height: number): void;
  onPointerMove?(x: number, y: number): void;
  destroy(): void;
}
```

## Code Layout
Standardized under `frontend/`:
- `src/types/`: Centralized interfaces for Cases, Transactions, Commitments, DigitalTwin, Simulations, Udhari, Approvals, Reports.
- `src/store/`: Zustand reactive state management and deep-cloned demo seed fixtures.
- `src/services/`: Mock PayPal Sandbox service with latency simulation and SHA-256 hash generation.
- `src/components/3d/`: Pure Three.js scene controllers and React wrapper `ThreeCanvasContainer`.
- `src/components/tables/`: AG Grid components with custom cell renderers.
- `src/components/charts/`: Interactive cash-flow curve, custom SVG/Canvas Gantt chart, spider radar.
- `src/components/common/`: Explainability drawer, judge reset button, 5-act stepper, hash badge.
- `src/views/`: 12 full-screen views matching the 12 navigation routes.
- `src/test/`: Vitest tests and testing utilities.
