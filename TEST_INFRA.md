# PayPilot: Test Infrastructure & 4-Tier Opaque-Box Quality Plan

## 1. Executive Summary & Testing Philosophy

PayPilot is an AI-assisted financial intelligence and autonomous action platform built for the PayPal AI Hackathon. Its mission is to empower small businesses with ground-truth payment reconciliation, automated revenue recovery, forward-looking commitment firewalls, and time-aware simulation curves paired with Three.js 3D data visualization.

This document defines the comprehensive **4-Tier Test Infrastructure Specification** for PayPilot, designed to guarantee rock-solid stability, zero-regression behavior, and total integrity during live hackathon judging.

### 1.1 The 4-Tier Test Architecture
1. **Tier 1: Comprehensive Feature Coverage**: Every one of the 35 discrete features identified in `PROJECT.md` has at least 5 dedicated opaque-box tests covering primary happy paths, required inputs, state mutations, and UI outputs ($35 \times 5 = 175$ tests).
2. **Tier 2: Boundary & Corner Cases**: Every feature has at least 5 dedicated adversarial edge-case tests targeting boundary limits, extreme inputs, zero-division guards, empty collections, rapid user clicks, and WebGL hardware failure ($35 \times 5 = 175$ tests).
3. **Tier 3: Cross-Feature Interactions (Pairwise Combinations)**: Cross-module integration tests verifying cascading state flows (e.g. Recovery claim updates Approvals Queue; Cash curve sliders update Commitment Firewall; Sandbox execution updates Digital Twin balance and funnel metrics).
4. **Tier 4: Real-World Application Scenarios (5-Act Hackathon Demo Flow)**: Full end-to-end execution of the 3-minute hackathon judge flow: `Find (Act 1) → Prove (Act 2) → Recover (Act 3) → Protect (Act 4) → Share (Act 5)`.

### 1.2 Opaque-Box Testing Principles
- **Implementation Agnostic**: Tests strictly assert against published domain contracts (`usePayPilotStore`, `sandboxService`, `hashService`, `ThreeSceneController`), DOM outputs, accessibility roles, and user interaction events. Tests do not inspect or mock internal React hook variables or private component states.
- **Zero Facade Guarantee**: Tests execute actual calculation logic, mathematical models, state mutators, and cryptographic hashing. No test passes vacuously without executing real logic.
- **Deterministic State Isolation**: Every test begins with a deep-cloned pristine demo dataset and cleans up after execution, ensuring tests are completely isolated and order-independent.

---

## 2. Feature Inventory & Mapping (35 Features)

| Feature # | Feature Name | Primary Module | Contract Source |
| :--- | :--- | :--- | :--- |
| **F01** | 12-Route Nav Shell | Navigation | R3, PROJECT.md |
| **F02** | 3D Interactive Hero Globe | Command Center | R2, R3, PROJECT.md |
| **F03** | Executive KPI Matrix | Command Center | R3, PROJECT.md |
| **F04** | 3D Visual Funnel | PayBack Hunter | R2, R4, PROJECT.md |
| **F05** | Recovery Inbox AG Grid | PayBack Hunter | R1, R3, PROJECT.md |
| **F06** | Single/Batch Claim Trigger | PayBack Hunter | R3, R5, PROJECT.md |
| **F07** | 3D Interactive Node Graph | Payment Truth | R2, R3, PROJECT.md |
| **F08** | Payment Truth Queue AG Grid | Payment Truth | R1, R3, PROJECT.md |
| **F09** | Discrepancy Mismatch Inspector | Payment Truth | R3, R4, PROJECT.md |
| **F10** | Animated 3D Shield/Firewall | Commitments | R2, R3, PROJECT.md |
| **F11** | Commitment Workbench Gantt | Commitments | R1, R3, PROJECT.md |
| **F12** | Order Evaluation Simulator | Commitments | R3, R5, PROJECT.md |
| **F13** | Glowing 3D Orb / Particle System | Digital Twin | R2, R3, PROJECT.md |
| **F14** | Time Scrubbing Slider | Digital Twin | R3, PROJECT.md |
| **F15** | Balance Sheet & Liquidity Matrix | Digital Twin | R3, PROJECT.md |
| **F16** | 3D Cash-Flow Landscape/Terrain | Simulation Lab | R2, R3, PROJECT.md |
| **F17** | Interactive Cash-Flow Curve | Simulation Lab | R4, PROJECT.md |
| **F18** | Scenario Comparison Engine | Simulation Lab | R3, R4, PROJECT.md |
| **F19** | Multi-Axis Radar Chart | Survival Radar | R3, PROJECT.md |
| **F20** | Stress-Test Execution Lab | Survival Radar | R3, PROJECT.md |
| **F21** | Udhari Debt Ledger AG Grid | Udhari Ledger | R1, R3, PROJECT.md |
| **F22** | Aging Bucket Visualizer | Udhari Ledger | R3, PROJECT.md |
| **F23** | Collection Action Triggers | Udhari Ledger | R3, PROJECT.md |
| **F24** | Grounded Financial Copilot | Agent Workspace | R3, PROJECT.md |
| **F25** | Verified Context Inspector | Agent Workspace | R3, PROJECT.md |
| **F26** | Governed Action Queue | Approvals | R3, R5, PROJECT.md |
| **F27** | Exact Payload Inspection | Approvals | R3, R4, PROJECT.md |
| **F28** | Sandbox Execution Simulator | Approvals | R3, R5, PROJECT.md |
| **F29** | Hash-Signed Report Generator | Team & Sharing | R4, PROJECT.md |
| **F30** | Scoped Expiring Link Generator | Team & Sharing | R3, R5, PROJECT.md |
| **F31** | PayPal Sandbox Configuration | Settings | R3, PROJECT.md |
| **F32** | One-Click Judge Reset Button | Global / Settings | R4, R5, PROJECT.md |
| **F33** | Explainability Drawer | Global / Drawer | R4, PROJECT.md |
| **F34** | Ambient Particle Background | Global / Visuals | R2, PROJECT.md |
| **F35** | 5-Act Demo Controller | Demo Stepper | R5, PROJECT.md |

---

## 3. Tier 1: Feature Coverage Specifications (175 Tests)

Every feature is specified with $\ge 5$ explicit tests.

### Feature 1: 12-Route Nav Shell
- **TC-T1-F01-01**: Active route defaults to `/command-center` upon initial application load.
- **TC-T1-F01-02**: Clicking sidebar link `/payback-hunter` switches active route state and renders PayBack Hunter screen view.
- **TC-T1-F01-03**: Iterating across all 12 navigation routes (`command-center`, `payback-hunter`, `payment-truth`, `commitments`, `digital-twin`, `simulation-lab`, `survival-radar`, `udhari-ledger`, `copilot`, `approvals`, `team-sharing`, `settings`) correctly sets route state without throwing errors.
- **TC-T1-F01-04**: Active route item in navigation bar reflects selected visual indicator/class styling.
- **TC-T1-F01-05**: Accessing an invalid route path falls back safely to `/command-center`.

### Feature 2: 3D Interactive Hero Globe
- **TC-T1-F02-01**: `GlobeScene` controller implements `ThreeSceneController` contract (`init`, `updateData`, `resize`, `onPointerMove`, `destroy`).
- **TC-T1-F02-02**: Controller initializes canvas container, creates Scene, Camera, and WebGLRenderer without error.
- **TC-T1-F02-03**: `onPointerMove(x, y)` adjusts camera/globe rotation angles based on cursor coordinates.
- **TC-T1-F02-04**: `updateData` refreshes particle arc points when monetary transit events change.
- **TC-T1-F02-05**: `destroy()` disposes geometries, materials, textures, and cancels animation frame cleanly.

### Feature 3: Executive KPI Matrix
- **TC-T1-F03-01**: Total Available Cash renders accurately as `$142,500.00` from store state.
- **TC-T1-F03-02**: Identified Recoverable revenue displays `$18,450.00` matching total identified recovery cases.
- **TC-T1-F03-03**: 30-Day Payables metric displays sum of commitments due within 30 days (`$43,200.00`).
- **TC-T1-F03-04**: Runway calculation renders `94 Days` based on liquid cash divided by net daily burn rate.
- **TC-T1-F03-05**: Positive delta chips (e.g. `+8.4%`) render in emerald color styling.

### Feature 4: 3D Visual Funnel
- **TC-T1-F04-01**: Funnel scene controller mounts and renders 4 visual tiers representing recovery stages.
- **TC-T1-F04-02**: Top tier displays total Potential Identified amount (`$18,450.00`).
- **TC-T1-F04-03**: Fourth tier displays Verified Recovered amount (`$4,200.00`).
- **TC-T1-F04-04**: Hovering over or clicking a funnel tier emits stage selection filter event.
- **TC-T1-F04-05**: `destroy()` unbinds render loop and releases VRAM resources without memory leaks.

### Feature 5: Recovery Inbox AG Grid
- **TC-T1-F05-01**: Recovery table renders initial seed dataset containing all 12 recovery cases.
- **TC-T1-F05-02**: Table displays columns: Case ID, Provider, Discrepancy Type, Amount, Detected Date, Confidence, Status, and Actions.
- **TC-T1-F05-03**: Case `#REC-101` shows amount formatted as `$1,420.00` in green font.
- **TC-T1-F05-04**: Multi-row selection checkbox selects rows and updates selected count badge.
- **TC-T1-F05-05**: Filtering by category (e.g. `Duplicate Processing Fee`) reduces visible rows to matching subset.

### Feature 6: Single/Batch Claim Trigger
- **TC-T1-F06-01**: Clicking "Claim" on an individual case dispatches claim action to store.
- **TC-T1-F06-02**: Selecting 3 cases and clicking "Claim Selected" submits all 3 cases in batch.
- **TC-T1-F06-03**: Claim submission transitions case status from `POTENTIAL_IDENTIFIED` to `CLAIM_SUBMITTED`.
- **TC-T1-F06-04**: Claim trigger logs audit event containing timestamp and actor in case audit trail.
- **TC-T1-F06-05**: Batch claim button is disabled when zero rows are selected.

### Feature 7: 3D Interactive Node Graph
- **TC-T1-F07-01**: `NodeGraphScene` controller mounts and instantiates nodes for PayPal captures, bank deposits, and invoices.
- **TC-T1-F07-02**: Graph generates links connecting matching records and discrepancy nodes.
- **TC-T1-F07-03**: Discrepancy nodes are visually differentiated with warning red/amber pulses.
- **TC-T1-F07-04**: Clicking a node triggers focus zoom event and highlights connected edges.
- **TC-T1-F07-05**: Controller cleans up node meshes and edge lines on `destroy()`.

### Feature 8: Payment Truth Queue AG Grid
- **TC-T1-F08-01**: Reconciliation table loads all 3-way matched and discrepant records.
- **TC-T1-F08-02**: Discrepancy rows render non-zero variance amounts highlighted in red (e.g. `+$1,420.00`).
- **TC-T1-F08-03**: Match score badge displays percentage (e.g. `98%`).
- **TC-T1-F08-04**: Sorting by variance orders records descending from largest discrepancy.
- **TC-T1-F08-05**: Status filter chips toggle between `All`, `Discrepancies`, and `Reconciled`.

### Feature 9: Discrepancy Mismatch Inspector
- **TC-T1-F09-01**: Selecting a discrepant record and clicking "Inspect" opens side-by-side mismatch view.
- **TC-T1-F09-02**: Mismatch inspector displays PayPal transaction gross, fee, and net alongside bank deposit.
- **TC-T1-F09-03**: Inspector highlights the calculated delta amount (`$1,420.00`).
- **TC-T1-F09-04**: Inspector provides action link to trigger recovery claim directly from the discrepancy.
- **TC-T1-F09-05**: Closing the inspector clears the selected discrepancy state.

### Feature 10: Animated 3D Shield/Firewall
- **TC-T1-F10-01**: `FirewallScene` controller initializes shield geometry with dynamic shader/material.
- **TC-T1-F10-02**: Shield displays glowing emerald state when projected cash balance exceeds safe buffer ($15k).
- **TC-T1-F10-03**: `updateData` triggers amber warning pulse when an evaluated order threatens buffer.
- **TC-T1-F10-04**: `updateData` triggers crimson distress ripples when order breaches zero cash buffer.
- **TC-T1-F10-05**: `destroy()` cleans up shield mesh, vertex buffers, and cancels shader uniforms.

### Feature 11: Commitment Workbench Gantt
- **TC-T1-F11-01**: Timeline renders horizontal time axis spanning 30, 60, and 90-day horizons.
- **TC-T1-F11-02**: Commitments render as horizontal duration bars grouped into categories (Payroll, Inventory, SaaS).
- **TC-T1-F11-03**: Hovering a commitment bar displays counterparty, amount, and due date tooltip.
- **TC-T1-F11-04**: Integrated cash-line overlay shows projected cash trajectory overlaid on commitment bars.
- **TC-T1-F11-05**: Horizontal red threshold line marks minimum safety buffer at `$15,000.00`.

### Feature 12: Order Evaluation Simulator
- **TC-T1-F12-01**: Simulator form accepts Vendor, Amount, Target Date, and Payment Terms (Net-15/30/60).
- **TC-T1-F12-02**: Submitting `$12,000.00` order evaluates cash balance impact across 60 days.
- **TC-T1-F12-03**: When buffer remains above $15k, displays "APPROVED: Safe to commit" badge.
- **TC-T1-F12-04**: When simulated order breaches $15k, displays "WARNING: Breaches $15k safety threshold" with exact breach date.
- **TC-T1-F12-05**: Form resets input values when cleared.

### Feature 13: Glowing 3D Orb / Particle System
- **TC-T1-F13-01**: `DigitalTwinScene` controller mounts orb mesh with orbiting particle rings.
- **TC-T1-F13-02**: Orb pulses smoothly at baseline frequency (1.0 Hz) when health score is high ($>85$).
- **TC-T1-F13-03**: Color dynamically transitions from emerald (healthy) to amber/red under stress.
- **TC-T1-F13-04**: Mouse movement alters orbital camera tilt smoothly.
- **TC-T1-F13-05**: Scene unmounts and disposes particle systems without memory leaks.

### Feature 14: Time Scrubbing Slider
- **TC-T1-F14-01**: Time slider supports range from Day 0 (Today) to Day +180.
- **TC-T1-F14-02**: Scrubbing slider to Day +30 recalculates projected available cash balance.
- **TC-T1-F14-03**: Scrubbing slider updates displayed balance sheet figures to future projected date.
- **TC-T1-F14-04**: Slider thumb position reflects selected day value.
- **TC-T1-F14-05**: Quick preset buttons (`Day 0`, `Day +30`, `Day +60`, `Day +90`) jump slider directly to target day.

### Feature 15: Balance Sheet & Liquidity Matrix
- **TC-T1-F15-01**: Working Capital calculates as Total Current Assets minus Total Current Liabilities.
- **TC-T1-F15-02**: Quick Ratio calculates as `(Cash + Liquid AR) / Current Liabilities` ($1.82$).
- **TC-T1-F15-03**: Daily Burn Rate displays `$1,250.00/day` based on recurring operational commitments.
- **TC-T1-F15-04**: Cash reservoirs breakdown displays PayPal balance, bank operating account, and reserve funds.
- **TC-T1-F15-05**: Financial health score calculates composite score ($88/100$) reflecting liquidity depth.

### Feature 16: 3D Cash-Flow Landscape/Terrain
- **TC-T1-F16-01**: `TerrainScene` controller instantiates heightfield plane geometry with cash-curve displacement.
- **TC-T1-F16-02**: Elevated terrain ridges represent cash peaks; valleys represent cash drought periods.
- **TC-T1-F16-03**: Dynamic height color gradient shades peaks in emerald and valleys in amber/crimson.
- **TC-T1-F16-04**: Orbit controls allow rotating and tilting the 3D landscape terrain mesh.
- **TC-T1-F16-05**: Releasing controller disposes wireframe shaders and geometry buffers.

### Feature 17: Interactive Cash-Flow Curve
- **TC-T1-F17-01**: Cash-flow curve renders daily projected balance over 90 days as continuous SVG path.
- **TC-T1-F17-02**: Adjusting Upfront Deposit slider from 20% to 40% immediately raises starting trajectory.
- **TC-T1-F17-03**: Adjusting Customer Payment Delay slider from 15 to 45 days deepens cash valley at Day 30-45.
- **TC-T1-F17-04**: Minimum Cash Point badge pinpoints exact lowest balance date and dollar amount.
- **TC-T1-F17-05**: Safety buffer zone renders red band below $15,000 threshold.

### Feature 18: Scenario Comparison Engine
- **TC-T1-F18-01**: Baseline scenario displays current business trajectory.
- **TC-T1-F18-02**: Optimistic scenario models +25% collection acceleration and zero payment delays.
- **TC-T1-F18-03**: Conservative scenario models -20% revenue dip and 30-day payment delay.
- **TC-T1-F18-04**: Scenario toggle overlays all 3 projection curves simultaneously on the chart.
- **TC-T1-F18-05**: Comparison table displays Ending Cash, Minimum Dip, and Runway for each scenario.

### Feature 19: Multi-Axis Radar Chart
- **TC-T1-F19-01**: Radar chart renders 6 resilience dimensions: Concentration, Supplier, Liquidity, Delay, Fixed Cost, and Dispute Tolerance.
- **TC-T1-F19-02**: Each axis plots score normalized between 0 and 100.
- **TC-T1-F19-03**: Polygon path displays filled translucent shape representing overall resilience posture.
- **TC-T1-F19-04**: Industry benchmark polygon renders as reference overlay.
- **TC-T1-F19-05**: Overall Survival Index renders composite average score.

### Feature 20: Stress-Test Execution Lab
- **TC-T1-F20-01**: Pre-configured shock "Top Client Defaults" applies immediate -$25,000 revenue reduction.
- **TC-T1-F20-02**: Pre-configured shock "PayPal Chargeback Surge" simulates 3% dispute spike.
- **TC-T1-F20-03**: Executing shock recalculates days until insolvency under stress conditions.
- **TC-T1-F20-04**: Generates dynamic actionable defense playbook checklist.
- **TC-T1-F20-05**: Stress-test simulation completes and displays verdict badge (e.g. `MODERATE_STRESS`).

### Feature 21: Udhari Debt Ledger AG Grid
- **TC-T1-F21-01**: Udhari table renders customer records with total credit, balance, and aging status.
- **TC-T1-F21-02**: Outstanding balance displays in bold amber font (`$16,800.00` total).
- **TC-T1-F21-03**: Customer code and contact info render in customer column.
- **TC-T1-F21-04**: Table supports sorting by days outstanding and balance.
- **TC-T1-F21-05**: Multi-row selection allows selecting multiple overdue debtors for batch action.

### Feature 22: Aging Bucket Visualizer
- **TC-T1-F22-01**: Visual segmented bar renders 4 buckets: `0-15d`, `16-30d`, `31-60d`, `60d+ Overdue`.
- **TC-T1-F22-02**: Segment widths accurately reflect percentage distribution of outstanding balance.
- **TC-T1-F22-03**: Overdue 60d+ segment displays red warning tag (`$6,450.00`).
- **TC-T1-F22-04**: Clicking an aging bucket segment filters the AG Grid to that bucket.
- **TC-T1-F22-05**: Summary metric displays average collection period (14 Days DSO).

### Feature 23: Collection Action Triggers
- **TC-T1-F23-01**: Clicking "WhatsApp" reminder simulates sending templated reminder message.
- **TC-T1-F23-02**: Reminder action updates customer `lastReminderDate` to current timestamp.
- **TC-T1-F23-03**: Clicking "PayPal Link" generates and copies `PayPal.Me` payment request link.
- **TC-T1-F23-04**: "Settle" action opens settlement modal to record cash/PayPal receipt.
- **TC-T1-F23-05**: Recording a settlement updates customer balance and ledger totals immediately.

### Feature 24: Grounded Financial Copilot
- **TC-T1-F24-01**: Chat interface accepts user financial questions and renders message thread.
- **TC-T1-F24-02**: Copilot streams response grounded strictly in verified ledger data.
- **TC-T1-F24-03**: Suggested prompt chips (e.g. "Can I afford $12k inventory?") populate input.
- **TC-T1-F24-04**: Copilot responses include rich interactive action cards linking to system views.
- **TC-T1-F24-05**: Questions outside verified financial data trigger polite clarification without hallucination.

### Feature 25: Verified Context Inspector
- **TC-T1-F25-01**: Context inspector panel displays active financial ground truth figures.
- **TC-T1-F25-02**: Displays current verified cash balance (`$142,500.00`).
- **TC-T1-F25-03**: Displays active recovery cases count and pending amount.
- **TC-T1-F25-04**: Updates in real time when store state changes via mutations.
- **TC-T1-F25-05**: Displays active PayPal Sandbox connection status badge.

### Feature 26: Governed Action Queue
- **TC-T1-F26-01**: Approvals screen lists all AI-prepared actions requiring human sign-off.
- **TC-T1-F26-02**: Action card displays title, risk tier badge (Low, Med, High), and impact amount.
- **TC-T1-F26-03**: Action `#APR-001` targets PayPal dispute claim submission for `$1,420.00`.
- **TC-T1-F26-04**: Approving an action removes it from pending queue and executes workflow.
- **TC-T1-F26-05**: Rejecting an action marks it dismissed with reason notes.

### Feature 27: Exact Payload Inspection
- **TC-T1-F27-01**: Payload inspector renders syntax-highlighted JSON destined for PayPal Sandbox API.
- **TC-T1-F27-02**: Displays HTTP method (`POST`), endpoint path (`/v1/customer-disputes`), and headers.
- **TC-T1-F27-03**: Payload includes exact dispute amount object (`{ currency_code: "USD", value: "1420.00" }`).
- **TC-T1-F27-04**: "Copy Payload JSON" button copies formatted JSON to clipboard.
- **TC-T1-F27-05**: Displays diff viewer showing before vs after state impact.

### Feature 28: Sandbox Execution Simulator
- **TC-T1-F28-01**: Clicking "Approve & Execute via PayPal Sandbox" triggers `sandboxService.executeSandboxClaim`.
- **TC-T1-F28-02**: Execution enters loading state simulating realistic 800ms network round-trip.
- **TC-T1-F28-03**: Returns mock HTTP 200 response with simulated transaction ID (`PP-TXN-884102`).
- **TC-T1-F28-04**: Execution updates case status to `VERIFIED_RECOVERED`.
- **TC-T1-F28-05**: Displays success toast notification confirming PayPal Sandbox settlement.

### Feature 29: Hash-Signed Report Generator
- **TC-T1-F29-01**: Report generator accepts report type (`Recovery Audit Proof`, `Payment Truth Pack`).
- **TC-T1-F29-02**: Deterministically computes SHA-256 hash over canonical JSON report data.
- **TC-T1-F29-03**: Displays cryptographic verification badge with 64-char hex SHA-256 string.
- **TC-T1-F29-04**: Displays green verification seal: "Verified by PayPilot Cryptographic Ledger".
- **TC-T1-F29-05**: "Download Signed Report" exports JSON package containing data and hash signature.

### Feature 30: Scoped Expiring Link Generator
- **TC-T1-F30-01**: Generates shareable URL with embedded report ID and token.
- **TC-T1-F30-02**: Configures expiration window (24 Hours or 7 Days).
- **TC-T1-F30-03**: Enforces role permission scope (e.g. `EXTERNAL_ACCOUNTANT` read-only).
- **TC-T1-F30-04**: Active shared links table lists generated links with access count and revocation action.
- **TC-T1-F30-05**: Clicking "Revoke Access" immediately invalidates the shared link.

### Feature 31: PayPal Sandbox Configuration
- **TC-T1-F31-01**: Settings card renders Client ID, Secret, and Environment (Sandbox vs Live) inputs.
- **TC-T1-F31-02**: Pre-populates valid simulated PayPal Sandbox credentials.
- **TC-T1-F31-03**: Connection indicator displays "Connected — PayPal Sandbox REST API v2".
- **TC-T1-F31-04**: "Ping PayPal Webhook" button dispatches simulated ping test.
- **TC-T1-F31-05**: Simulator latency slider configures simulated API latency (100ms - 2000ms).

### Feature 32: One-Click Judge Reset Button
- **TC-T1-F32-01**: Reset button is permanently accessible in header and inside Settings.
- **TC-T1-F32-02**: Clicking button executes `resetToDemoState()` in Zustand store.
- **TC-T1-F32-03**: Completely restores all 12 recovery cases to original seed states.
- **TC-T1-F32-04**: Resets cash-flow sliders back to defaults (Deposit 20%, Delay 15d, Split 30/40/30).
- **TC-T1-F32-05**: Emits confirmation toast: "Workspace re-seeded with clean demo data for Hackathon judges".

### Feature 33: Explainability Drawer
- **TC-T1-F33-01**: Clicking "Why flagged?" opens global slide-over Explainability Drawer.
- **TC-T1-F33-02**: Section 1 displays plain-English detection rule name and policy code.
- **TC-T1-F33-03**: Section 2 displays mathematical calculation formula showing overcharge delta.
- **TC-T1-F33-04**: Section 3 displays linked source records (PayPal capture vs bank deposit).
- **TC-T1-F33-05**: Section 4 displays verbatim raw PayPal JSON API payload with copy control.

### Feature 34: Ambient Particle Background
- **TC-T1-F34-01**: `AmbientScene` controller mounts subtle background particle effect behind dark UI cards.
- **TC-T1-F34-02**: Particles float gently in 3D space with low CPU overhead.
- **TC-T1-F34-03**: Cursor drift imparts subtle rotational inertia to particles.
- **TC-T1-F34-04**: Canvas is styled with pointer-events-none so it does not block UI clicks.
- **TC-T1-F34-05**: Disposes particle geometry and buffer attributes cleanly on unmount.

### Feature 35: 5-Act Demo Controller
- **TC-T1-F35-01**: Stepper bar renders 5 sequential demo acts (Find, Prove, Recover, Protect, Share).
- **TC-T1-F35-02**: Clicking Act 1 navigates directly to `/payback-hunter`.
- **TC-T1-F35-03**: Clicking Act 2 navigates to `/payment-truth` and highlights discrepancy node.
- **TC-T1-F35-04**: Clicking Act 3 navigates to `/approvals` with pending recovery claim.
- **TC-T1-F35-05**: Completing all 5 acts marks stepper completed with celebratory banner.

---

## 4. Tier 2: Boundary & Corner Cases Specifications (175 Tests)

Adversarial edge-case tests targeting boundary extremes, null/empty states, rapid interactions, and hardware degradation ($35 \times 5 = 175$ tests).

### Feature 1: 12-Route Nav Shell (Boundaries)
- **TC-T2-F01-01**: Navigating to deep nested or malformed URL (e.g. `/unknown/sub/path`) recovers without crash.
- **TC-T2-F01-02**: Rapid clicking across 10 route tabs in <500ms produces zero race conditions or unhandled rejections.
- **TC-T2-F01-03**: Navigating during an active Three.js animation frame unmounts canvas cleanly without WebGL warnings.
- **TC-T2-F01-04**: Empty route string `""` falls back to `/command-center`.
- **TC-T2-F01-05**: Window resize across mobile (375px), tablet (768px), and 4K (3840px) maintains layout without overflow crash.

### Feature 2: 3D Interactive Hero Globe (Boundaries)
- **TC-T2-F02-01**: `webglcontextlost` event triggers 2D Canvas / SVG fallback without breaking parent component.
- **TC-T2-F02-02**: `onPointerMove` with extreme coordinates (`NaN`, `Infinity`, negative out-of-bounds) clamps rotation safely.
- **TC-T2-F02-03**: Container resized to `0x0` dimensions halts rendering without divide-by-zero aspect ratio error.
- **TC-T2-F02-04**: Empty monetary transit events array (`[]`) renders base globe without particle arcs.
- **TC-T2-F02-05**: Re-mounting `GlobeScene` 10 times in rapid succession does not accumulate orphaned WebGL contexts.

### Feature 3: Executive KPI Matrix (Boundaries)
- **TC-T2-F03-01**: Zero available cash (`$0.00`) renders formatted `$0.00` and displays critical runway warning.
- **TC-T2-F03-02**: Negative net daily cash flow handles runway calculation without `NaN` or negative day output.
- **TC-T2-F03-03**: Extreme high values ($999,999,999.00) format with proper commas without text truncation.
- **TC-T2-F03-04**: Zero daily burn rate handles division by zero safely (`runway = 999+ days`).
- **TC-T2-F03-05**: Unseeded/empty store data gracefully displays `$0.00` placeholders rather than crashing.

### Feature 4: 3D Visual Funnel (Boundaries)
- **TC-T2-F04-01**: Funnel with $0 in all stages renders neutral wireframe tiers without divide-by-zero cone height.
- **TC-T2-F04-02**: 100% conversion rate (all cases verified recovered) renders full emerald funnel.
- **TC-T2-F04-03**: Rapid hover across all 4 tiers in 100ms triggers throttled animation smoothly.
- **TC-T2-F04-04**: Resizing viewport during tier click retains active filter selection.
- **TC-T2-F04-05**: WebGL context loss switches smoothly to SVG stacked funnel.

### Feature 5: Recovery Inbox AG Grid (Boundaries)
- **TC-T2-F05-01**: Filter search query with zero matches displays custom empty overlay ("No candidates match criteria").
- **TC-T2-F05-02**: Search input containing regex meta-characters (`.*+?^${}()|[]\`) does not crash filter engine.
- **TC-T2-F05-03**: Sorting on column with null/undefined values groups nulls predictably at bottom.
- **TC-T2-F05-04**: "Select All" with active filter only selects currently visible filtered rows.
- **TC-T2-F05-05**: Recovery case with extreme amount ($0.01 vs $1,000,000.00) formats accurately without rounding error.

### Feature 6: Single/Batch Claim Trigger (Boundaries)
- **TC-T2-F06-01**: Clicking claim button repeatedly during async network delay triggers only one submission (debounced).
- **TC-T2-F06-02**: Batch claim with 100+ cases handles payload packaging without thread freeze.
- **TC-T2-F06-03**: Claiming a case already in `CLAIM_SUBMITTED` state returns error or disables button.
- **TC-T2-F06-04**: Submitting claim with empty notes string `""` handles default notes gracefully.
- **TC-T2-F06-05**: Claim execution failure retains case in original state with error toast notification.

### Feature 7: 3D Interactive Node Graph (Boundaries)
- **TC-T2-F07-01**: Graph with single isolated node renders without physics simulation explosion.
- **TC-T2-F07-02**: Graph with 500+ interconnected nodes throttles link updates to maintain 60fps.
- **TC-T2-F07-03**: Clicking empty space deselects focused node and smoothly resets camera target.
- **TC-T2-F07-04**: Nodes with identical 3D positions apply collision separation without NaN coordinates.
- **TC-T2-F07-05**: Rapid camera pan/zoom gestures clamp within min/max distance boundaries.

### Feature 8: Payment Truth Queue AG Grid (Boundaries)
- **TC-T2-F08-01**: Zero variance (`$0.00`) displays neutral status badge without red warning highlight.
- **TC-T2-F08-02**: Missing bank deposit record renders "PENDING CLEARING" placeholder rather than null crash.
- **TC-T2-F08-03**: Missing PayPal transaction record renders "MANUAL LEDGER ENTRY" indicator.
- **TC-T2-F08-04**: High variance amount (>$500,000) formats with warning icon.
- **TC-T2-F08-05**: Rapid column resizing does not cause horizontal scrollbar misalignment.

### Feature 9: Discrepancy Mismatch Inspector (Boundaries)
- **TC-T2-F09-01**: Opening inspector for non-existent record ID displays "Record not found" state.
- **TC-T2-F09-02**: Source records with missing fields (e.g. payer name null) display "N/A" fallback.
- **TC-T2-F09-03**: Rapidly toggling inspector open/close 10 times does not leave orphaned backdrop overlay.
- **TC-T2-F09-04**: Large payload text wraps cleanly in inspector without clipping container.
- **TC-T2-F09-05**: Copying discrepancy details when clipboard API is denied falls back to manual select text.

### Feature 10: Animated 3D Shield/Firewall (Boundaries)
- **TC-T2-F10-01**: Simulated order amount of `$0.00` retains current shield state without alert pulse.
- **TC-T2-F10-02**: Simulated order amount greater than total company assets ($1,000,000) triggers maximum critical pulse.
- **TC-T2-F10-03**: Negative order amount is rejected by input validator before reaching shield.
- **TC-T2-F10-04**: Rapid consecutive order evaluations smoothly interpolate shield color transitions.
- **TC-T2-F10-05**: WebGL context loss displays 2D SVG shield badge reflecting current risk level.

### Feature 11: Commitment Workbench Gantt (Boundaries)
- **TC-T2-F11-01**: Zero active commitments displays clean empty timeline state ("No upcoming commitments").
- **TC-T2-F11-02**: Commitments spanning across year boundaries (Dec to Jan) render correct time coordinates.
- **TC-T2-F11-03**: Commitment with due date in the past renders with "OVERDUE" status bar pattern.
- **TC-T2-F11-04**: Switching timeframe views (30d to 90d) recalibrates SVG time scale instantaneously.
- **TC-T2-F11-05**: 50 overlapping commitments on the same due date stack without visual clipping.

### Feature 12: Order Evaluation Simulator (Boundaries)
- **TC-T2-F12-01**: Non-numeric amount input (e.g. `"abc"`) is prevented by form validator.
- **TC-T2-F12-02**: Due date set to today evaluates immediate cash deduction impact.
- **TC-T2-F12-03**: Due date beyond 180 days displays notice "Beyond active forecasting window".
- **TC-T2-F12-04**: Order exactly equal to safe buffer threshold triggers boundary warning.
- **TC-T2-F12-05**: Submitting order with empty vendor name flags validation message.

### Feature 13: Glowing 3D Orb / Particle System (Boundaries)
- **TC-T2-F13-01**: Health score 0 renders dim, dark-crimson vibrating particle cloud.
- **TC-T2-F13-02**: Health score 100 renders brilliant glowing cyan/emerald calm sphere.
- **TC-T2-F13-03**: Rapid store mutations update orb uniforms without frame drops or memory accumulation.
- **TC-T2-F13-04**: High device pixel ratio (Retina 3x) caps canvas pixel ratio at 2x for performance.
- **TC-T2-F13-05**: WebGL context loss renders 2D glowing SVG orb fallback.

### Feature 14: Time Scrubbing Slider (Boundaries)
- **TC-T2-F14-01**: Dragging slider past Day 180 clamps at maximum boundary (180).
- **TC-T2-F14-02**: Dragging slider below Day 0 clamps at minimum boundary (0).
- **TC-T2-F14-03**: Rapid continuous scrubbing over 180 days throttles projection recalculations via requestAnimationFrame.
- **TC-T2-F14-04**: Non-integer step inputs round to nearest whole day.
- **TC-T2-F14-05**: Keyboard arrow key navigation increments/decrements slider by exactly 1 day.

### Feature 15: Balance Sheet & Liquidity Matrix (Boundaries)
- **TC-T2-F15-01**: Liabilities equal to zero sets Quick Ratio to safe infinity representation (`>99.0`).
- **TC-T2-F15-02**: Both assets and liabilities equal to zero renders balanced ratio (`1.0`).
- **TC-T2-F15-03**: Negative working capital renders in red bold font with insolvency badge.
- **TC-T2-F15-04**: Fractional cent amounts round deterministically to 2 decimal places.
- **TC-T2-F15-05**: Rapid currency toggle (USD, EUR, GBP) updates currency symbols without math drift.

### Feature 16: 3D Cash-Flow Landscape/Terrain (Boundaries)
- **TC-T2-F16-01**: Flat cash flow (zero delta across 90 days) renders smooth flat plane.
- **TC-T2-F16-02**: Massive cash spikes ($1,000,000 inflow) clamp height displacement within camera frustum.
- **TC-T2-F16-03**: Negative cash valley dips clamp to floor plane with crimson warning glow.
- **TC-T2-F16-04**: Orbit controls prevent camera from clipping beneath terrain plane.
- **TC-T2-F16-05**: WebGL context loss renders 2D contour plot fallback.

### Feature 17: Interactive Cash-Flow Curve (Boundaries)
- **TC-T2-F17-01**: Upfront Deposit slider set to 0% shifts all inflows to delivery; validates curve dip.
- **TC-T2-F17-02**: Upfront Deposit slider set to 100% shifts all inflows to Day 0; validates immediate cash spike.
- **TC-T2-F17-03**: Customer Payment Delay set to maximum 60 days shifts receivables 60 days rightward.
- **TC-T2-F17-04**: Customer Payment Delay set to 0 days eliminates collection lag.
- **TC-T2-F17-05**: Rapid dragging of all 3 sliders simultaneously maintains mathematical convergence without NaN path.

### Feature 18: Scenario Comparison Engine (Boundaries)
- **TC-T2-F18-01**: Deselecting all scenarios defaults to Baseline curve.
- **TC-T2-F18-02**: Conservative scenario with severe revenue dip highlights insolvency warning date.
- **TC-T2-F18-03**: Identical parameters across scenarios produce perfectly overlapping curves.
- **TC-T2-F18-04**: Rapid scenario toggling does not cause SVG curve flicker.
- **TC-T2-F18-05**: Exporting scenario comparison generates valid CSV data structure.

### Feature 19: Multi-Axis Radar Chart (Boundaries)
- **TC-T2-F19-01**: All scores set to 0 renders collapsed point at polygon center.
- **TC-T2-F19-02**: All scores set to 100 renders maximum outer perimeter polygon.
- **TC-T2-F19-03**: Single axis score set to 0 creates inward spike without SVG path NaN error.
- **TC-T2-F19-04**: Negative score inputs clamp automatically to 0.
- **TC-T2-F19-05**: Score inputs exceeding 100 clamp automatically to 100.

### Feature 20: Stress-Test Execution Lab (Boundaries)
- **TC-T2-F20-01**: Running multiple stress tests concurrently cancels prior run or queues cleanly.
- **TC-T2-F20-02**: Stress test triggering instant Day 0 insolvency generates immediate emergency playbook.
- **TC-T2-F20-03**: Stress test with 0% cash impact retains resilient verdict.
- **TC-T2-F20-04**: Resetting stress lab restores baseline financial metrics.
- **TC-T2-F20-05**: Action checklist items support toggleable completion state.

### Feature 21: Udhari Debt Ledger AG Grid (Boundaries)
- **TC-T2-F21-01**: Customer with $0 balance is classified in current bucket without overdue alert.
- **TC-T2-F21-02**: Customer with 365+ days overdue renders maximum critical delinquency styling.
- **TC-T2-F21-03**: Filtering on non-existent customer name displays empty results overlay.
- **TC-T2-F21-04**: Customer name containing Unicode / non-ASCII characters renders without corruption.
- **TC-T2-F21-05**: Selecting all customers across pagination pages updates batch action counter accurately.

### Feature 22: Aging Bucket Visualizer (Boundaries)
- **TC-T2-F22-01**: Zero total outstanding debt renders empty gray distribution bar.
- **TC-T2-F22-02**: 100% of debt in single bucket renders full-width bar for that bucket.
- **TC-T2-F22-03**: Empty intermediate bucket (e.g. 0% in 16-30d) renders 0 width without breaking bar layout.
- **TC-T2-F22-04**: Fractional percentages round to 100% total sum without layout overflow.
- **TC-T2-F22-05**: Hovering empty bucket segment does not show null tooltip.

### Feature 23: Collection Action Triggers (Boundaries)
- **TC-T2-F23-01**: Sending reminder to customer without phone number prompts for phone input or email fallback.
- **TC-T2-F23-02**: Clicking reminder repeatedly within 10 seconds displays "Reminder recently sent" warning.
- **TC-T2-F23-03**: Settlement amount exceeding outstanding balance prompts confirmation for credit overpayment.
- **TC-T2-F23-04**: Settlement amount of $0 is rejected with validation message.
- **TC-T2-F23-05**: Partial settlement deducts exact amount and leaves remaining balance overdue.

### Feature 24: Grounded Financial Copilot (Boundaries)
- **TC-T2-F24-01**: Prompt containing prompt-injection phrasing ("ignore all rules") returns polite grounded finance reply.
- **TC-T2-F24-02**: Extremely long user prompt (10,000+ characters) truncates or handles gracefully without freeze.
- **TC-T2-F24-03**: Empty prompt submission is disabled.
- **TC-T2-F24-04**: Sending prompt while copilot is generating response enters queue or disables send button.
- **TC-T2-F24-05**: Clearing chat history resets conversation thread to initial greeting message.

### Feature 25: Verified Context Inspector (Boundaries)
- **TC-T2-F25-01**: Inspector handles empty store records without undefined error.
- **TC-T2-F25-02**: Inspector updates within 16ms of store state mutation.
- **TC-T2-F25-03**: Collapsing inspector sidebar animates width cleanly without content overflow.
- **TC-T2-F25-04**: Clicking a verified context record links directly to that record in its parent view.
- **TC-T2-F25-05**: Disconnected PayPal Sandbox toggles context badge to warning amber state.

### Feature 26: Governed Action Queue (Boundaries)
- **TC-T2-F26-01**: Empty action queue displays celebratory empty state ("All actions reviewed and settled").
- **TC-T2-F26-02**: Expired approval request displays "EXPIRED" badge and disables execution.
- **TC-T2-F26-03**: Action queue containing 50+ actions scrolls virtually without DOM degradation.
- **TC-T2-F26-04**: Batch approve action executes all selected actions sequentially with status updates.
- **TC-T2-F26-05**: Dismissing all actions empties queue and emits summary notification.

### Feature 27: Exact Payload Inspection (Boundaries)
- **TC-T2-F27-01**: Deeply nested JSON payload (10+ levels) renders with collapsible nodes without stack overflow.
- **TC-T2-F27-02**: Malformed JSON string in payload viewer renders parse error indicator safely.
- **TC-T2-F27-03**: Special characters in payload keys/values (HTML tags, quotes) escape cleanly.
- **TC-T2-F27-04**: Large payload (>500KB) renders with virtualization or truncation notice.
- **TC-T2-F27-05**: Copy button handles clipboard permission rejection gracefully.

### Feature 28: Sandbox Execution Simulator (Boundaries)
- **TC-T2-F28-01**: Network latency set to 0ms executes instantly without timer exception.
- **TC-T2-F28-02**: Network error simulation rate set to 100% returns simulated HTTP 500 / 422 error.
- **TC-T2-F28-03**: Executing claim with invalid Case ID rejects with "Case not found" error.
- **TC-T2-F28-04**: Resetting workspace mid-execution cancels pending timers without orphan state.
- **TC-T2-F28-05**: Successful execution updates PayPal available balance by exact claim amount.

### Feature 29: Hash-Signed Report Generator (Boundaries)
- **TC-T2-F29-01**: Modifying a single character in report payload changes SHA-256 hash completely (avalanche effect).
- **TC-T2-F29-02**: Generating report with empty dataset produces deterministic hash of empty array `[]`.
- **TC-T2-F29-03**: Canonical JSON sorting guarantees identical hash regardless of key insertion order.
- **TC-T2-F29-04**: SHA-256 hash output is verified to match regex `^[a-f0-9]{64}$`.
- **TC-T2-F29-05**: Hash verification badge flashes update animation upon recalculation.

### Feature 30: Scoped Expiring Link Generator (Boundaries)
- **TC-T2-F30-01**: Generating link with 0-minute expiry immediately flags link as expired.
- **TC-T2-F30-02**: Revoking an already revoked link is a safe no-op.
- **TC-T2-F30-03**: Accessing revoked link displays "Access Denied: Link revoked by owner".
- **TC-T2-F30-04**: Generating 100 links handles list pagination without slowdown.
- **TC-T2-F30-05**: Share link URL is encoded properly and contains valid UUID query token.

### Feature 31: PayPal Sandbox Configuration (Boundaries)
- **TC-T2-F31-01**: Empty Client ID or Secret displays input validation warning.
- **TC-T2-F31-02**: Toggling to "Live Production Mode" displays confirmation safety prompt.
- **TC-T2-F31-03**: Invalid webhook URL format flags syntax error.
- **TC-T2-F31-04**: Resetting credentials restores default simulated sandbox keys.
- **TC-T2-F31-05**: Secret key remains masked with toggle to reveal.

### Feature 32: One-Click Judge Reset Button (Boundaries)
- **TC-T2-F32-01**: Clicking reset button 5 times rapidly executes safely without state corruption.
- **TC-T2-F32-02**: Reset clears all local storage mutations and active timers.
- **TC-T2-F32-03**: Deep clone guarantees that mutating the active store does not contaminate pristine seed.
- **TC-T2-F32-04**: Reset works cleanly from any of the 12 screens and resets navigation to Command Center.
- **TC-T2-F32-05**: Reset re-initializes all 8 Three.js scene orientations to default camera angles.

### Feature 33: Explainability Drawer (Boundaries)
- **TC-T2-F33-01**: Clicking "Why flagged?" on record without explainability details displays fallback notice.
- **TC-T2-F33-02**: Rapid clicking across 5 different case rows switches drawer content instantly without race conditions.
- **TC-T2-F33-03**: Pressing `Escape` key closes the drawer cleanly.
- **TC-T2-F33-04**: Clicking backdrop overlay closes the drawer.
- **TC-T2-F33-05**: Long formulas render with horizontal scroll without breaking drawer container.

### Feature 34: Ambient Particle Background (Boundaries)
- **TC-T2-F34-01**: Switching browser tabs pauses ambient animation loop (`document.hidden`).
- **TC-T2-F34-02**: Device with low battery / reduced motion preferences reduces particle count by 50%.
- **TC-T2-F34-03**: WebGL context loss gracefully hides ambient particles without console errors.
- **TC-T2-F34-04**: Resizing window across multiple monitors updates canvas buffer dimensions cleanly.
- **TC-T2-F34-05**: Canvas unmount cleans up all buffer attributes and materials.

### Feature 35: 5-Act Demo Controller (Boundaries)
- **TC-T2-F35-01**: Jumping directly to Act 5 out of order allows execution while noting skipped steps.
- **TC-T2-F35-02**: Resetting workspace via Judge Reset resets demo stepper back to Act 1.
- **TC-T2-F35-03**: Free navigation across sidebar routes does not break active stepper state.
- **TC-T2-F35-04**: "Next Act" button advances sequentially from Act 1 through Act 5.
- **TC-T2-F35-05**: "Previous Act" button navigates backward safely, clamping at Act 1.

---

## 5. Tier 3: Cross-Feature Interactions & Pairwise Combinations

Testing complex real-world workflows where state changes in one module cascade across other modules:

1. **CF-01: Recovery Claim → Approvals Queue → Sandbox Execution → Digital Twin Update**
   - User triggers claim in PayBack Hunter (`F06`).
   - Claim generates pending approval request in Approvals (`F26`).
   - Approvals inspector displays raw PayPal JSON payload (`F27`).
   - User approves and executes via Sandbox (`F28`).
   - Case transitions to `VERIFIED_RECOVERED` in Recovery Grid (`F05`).
   - Funnel updates verified recovered tier (`F04`).
   - Digital Twin increases available cash by claim amount (`F15`).
   - Executive KPI matrix increments total cash (`F03`).

2. **CF-02: Payment Truth Discrepancy → Explainability Drawer → Truth Graph Focus**
   - User identifies discrepancy row in Payment Truth Queue (`F08`).
   - User clicks "Why flagged?", opening Explainability Drawer (`F33`).
   - Drawer renders 3-way match formula and linked records (`F09`).
   - User clicks "View in Truth Graph", navigating to 3D Node Graph (`F07`).
   - Node graph centers camera and pulses discrepancy node in crimson.

3. **CF-03: Cash-Flow Slider Tuning → Commitment Firewall Shield → Simulation Terrain**
   - User enters simulator and submits `$35,000` order (`F12`).
   - Commitment Firewall evaluates order, shield pulses amber warning buffer breach (`F10`).
   - User opens Simulation Lab and drags Upfront Deposit slider from 20% to 40% (`F17`).
   - Projected cash curve recalculates dynamically, lifting minimum cash point above $15k (`F17`).
   - 3D Terrain Landscape mesh updates vertex heights, elevating valley out of drought zone (`F16`).
   - Shield material transitions back to solid green safe state (`F10`).

4. **CF-04: Udhari Ledger Debt Settlement → Balance Sheet Update → Copilot Grounded Context**
   - User records cash/PayPal settlement of `$5,000` on customer account (`F21`, `F23`).
   - Aging bucket visualizer recalculates outstanding debt percentages (`F22`).
   - Digital Twin liquidity matrix updates cash and accounts receivable (`F15`).
   - Verified Context Inspector in Copilot workspace immediately reflects updated cash and Udhari balances (`F25`).
   - Copilot answers user query referencing updated ledger balances (`F24`).

5. **CF-05: Stress-Test Execution → Survival Radar Distortion → One-Click Judge Reset**
   - User triggers "Top Client Defaults" shock test in Survival Lab (`F20`).
   - Multi-Axis Radar Chart contracts polygon on Concentration and Liquidity axes (`F19`).
   - Financial Digital Twin orb begins vibrating rapidly with turbulent amber pulse (`F13`).
   - User clicks "Judge Reset: Clean Demo State" (`F32`).
   - Store purges shock mutations, radar chart returns to baseline polygon, orb stabilizes to calm emerald pulse, and navigation returns to Command Center (`F01`).

6. **CF-06: Recovery Report Generation → Cryptographic Hashing → Scoped Expiring Share Link**
   - User selects "Recovery Audit Proof" report in Team Sharing (`F29`).
   - Hash service calculates canonical SHA-256 hash (`F29`).
   - User configures 48-hour expiration for external accountant (`F30`).
   - System generates scoped URL containing hash signature and token (`F30`).
   - Recipient view preview displays verified cryptographic ledger badge.

---

## 6. Tier 4: Real-World Application Scenarios (5-Act Hackathon Demo Flow)

A rigorous end-to-end verification of the exact 3-minute hackathon judge flow:

```
[ACT 1: FIND] ➔ [ACT 2: PROVE] ➔ [ACT 3: RECOVER] ➔ [ACT 4: PROTECT] ➔ [ACT 5: SHARE]
```

### Scenario Flow Specification:
- **Step 1 (Act 1: FIND)**:
  - Navigate to `/payback-hunter`.
  - Assert 3D Visual Funnel displays `$18,450.00` total identified leaks.
  - Assert Recovery Inbox AG Grid displays Case `#REC-101`: *"Duplicate Merchant Fee Overcharge — $1,420.00"*.
  - Trigger "Why flagged?" on Case `#REC-101`.
  - Assert Explainability Drawer opens displaying rule `RULE-DUP-FEE-02`, calculation formula, linked records, and raw PayPal JSON payload.
- **Step 2 (Act 2: PROVE)**:
  - Click "View in Truth Graph" navigating to `/payment-truth`.
  - Assert 3D Node Graph renders interconnected PayPal, Bank, and Invoice nodes.
  - Assert discrepancy node `#DISC-902` pulses in crimson with `$1,420.00 Variance`.
  - Assert Payment Truth AG Grid highlights matched transaction row.
- **Step 3 (Act 3: RECOVER)**:
  - Click "Initiate Recovery Claim" navigating to `/approvals`.
  - Assert pending action `#APR-001` exists: *"Submit PayPal Dispute Claim for $1,420.00"*.
  - Inspect exact payload destined for PayPal Sandbox API (`POST /v1/customer-disputes`).
  - Click "Approve & Execute via PayPal Sandbox".
  - Assert execution simulates network round-trip and returns mock HTTP 200.
  - Assert Case `#REC-101` transitions to `VERIFIED_RECOVERED`.
  - Assert total recovered count increments by `+$1,420.00`.
- **Step 4 (Act 4: PROTECT)**:
  - Navigate to `/commitments`.
  - Assert 3D Commitment Firewall shield is glowing emerald.
  - Enter order in Simulator: `$35,000.00, Net-15 terms`.
  - Evaluate order: Assert shield pulses amber warning *"Dips below $15,000 buffer"*.
  - Open Simulation Lab cash curve, adjust "Upfront Deposit %" slider from 20% to 40%.
  - Assert projected curve recalculates in real time, lifting lowest cash point to `$18,200.00`.
  - Assert Firewall verdict returns to *"SAFE TO COMMIT"*.
- **Step 5 (Act 5: SHARE)**:
  - Navigate to `/team-sharing`.
  - Select "Recovery Audit Proof Report".
  - Click "Generate Signed Report".
  - Assert SHA-256 verification badge renders valid 64-character hex hash.
  - Assert green verification seal: *"Verified by PayPilot Cryptographic Ledger"*.
  - Generate scoped link with 48h expiry.
  - Assert link preview displays accountant view with tamper-proof verification badge.

---

## 7. Test Execution & Reporting Infrastructure

### 7.1 Test Suite Directory Structure
All test suites reside in `frontend/src/test/e2e/`:
- `frontend/src/test/e2e/tier1_feature_coverage.test.ts`
- `frontend/src/test/e2e/tier2_boundaries.test.ts`
- `frontend/src/test/e2e/tier3_pairwise_combinations.test.ts`
- `frontend/src/test/e2e/tier4_demo_scenarios.test.ts`

### 7.2 Running the Test Suite
The tests are executed via Vitest from `frontend/`:
```bash
# Run all 4 test tiers
npm test -- src/test/e2e

# Run individual tiers
npm test -- src/test/e2e/tier1_feature_coverage.test.ts
npm test -- src/test/e2e/tier2_boundaries.test.ts
npm test -- src/test/e2e/tier3_pairwise_combinations.test.ts
npm test -- src/test/e2e/tier4_demo_scenarios.test.ts
```

### 7.3 Success Criteria
1. Clean execution with **0 test failures** across all 4 tiers.
2. Coverage spans all 35 features, boundaries, cross-feature workflows, and the 5-act demo narrative.
3. Every test executes real assertion logic, validating mathematical models, state transitions, and contract adherence.
