import fs from 'fs';
import path from 'path';

const root = path.resolve('src');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'test' || entry.name === '3d') continue;
      walk(full, acc);
    } else if (entry.name.endsWith('.tsx')) {
      acc.push(full);
    }
  }
  return acc;
}

const classReps = [
  ['hover:bg-slate-800', 'hover:bg-stone-200/80 dark:hover:bg-stone-800/80'],
  ['hover:bg-slate-700', 'hover:bg-stone-300/80 dark:hover:bg-stone-700/80'],
  ['hover:text-slate-200', 'hover:text-stone-900 dark:hover:text-stone-100'],
  ['hover:text-slate-300', 'hover:text-stone-900 dark:hover:text-stone-100'],
  ['p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-card-dark', 'glass tone-glow rounded-2xl p-5'],
  ['p-4 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-card-dark', 'glass tone-glow rounded-2xl p-5'],
  ['p-4 rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark', 'glass tone-glow rounded-2xl p-5'],
  ['rounded-2xl bg-gradient-to-b from-obsidian-900 to-obsidian-850 border border-slate-800 shadow-card-dark p-4', 'glass tone-glow rounded-2xl p-5'],
  ['rounded-2xl bg-gradient-to-br from-obsidian-900 via-obsidian-850 to-obsidian-900 border border-slate-800 shadow-card-dark overflow-hidden p-4', 'glass tone-glow relative overflow-hidden rounded-2xl p-5'],
  ['rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark p-4', 'glass tone-glow rounded-2xl p-5'],
  ['rounded-xl bg-obsidian-900 border border-slate-800 shadow-card-dark', 'glass tone-glow rounded-2xl'],
  ['rounded-2xl bg-obsidian-900 border border-slate-800 shadow-card-dark', 'glass tone-glow rounded-2xl'],
  ['bg-obsidian-900 border border-slate-800 shadow-card-dark', 'glass tone-glow'],
  ['bg-gradient-to-b from-obsidian-900 to-obsidian-850 border border-slate-800 shadow-card-dark', 'glass tone-glow'],
  ['bg-gradient-to-br from-obsidian-900 via-obsidian-850 to-obsidian-900 border border-slate-800 shadow-card-dark', 'glass tone-glow'],
  ['flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80', 'glass tone-glow rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'],
  ['tracking-tight text-white', 'tracking-tight text-stone-900 dark:text-white'],
  ['font-semibold text-white', 'font-semibold text-stone-900 dark:text-white'],
  ['font-bold text-white', 'font-bold text-stone-900 dark:text-white'],
  ['font-mono text-white', 'font-mono text-stone-900 dark:text-white'],
  ['text-slate-400', 'text-stone-500 dark:text-stone-400'],
  ['text-slate-500', 'text-stone-500 dark:text-stone-400'],
  ['text-slate-300', 'text-stone-600 dark:text-stone-300'],
  ['text-slate-200', 'text-stone-700 dark:text-stone-200'],
  ['border-slate-800/80', 'border-stone-200/50 dark:border-white/10'],
  ['border-slate-800', 'border-stone-200/60 dark:border-white/10'],
  ['border-slate-700', 'border-stone-300/70 dark:border-white/10'],
  ['bg-obsidian-950', 'bg-white/50 dark:bg-stone-950/60'],
  ['bg-obsidian-900', 'bg-white/40 dark:bg-stone-900/50'],
  ['bg-obsidian-850', 'bg-white/30 dark:bg-stone-900/40'],
  ['bg-slate-900', 'bg-stone-100/80 dark:bg-stone-900/60'],
  ['bg-slate-800', 'bg-stone-200/70 dark:bg-stone-800/70'],
  ['divide-slate-800', 'divide-stone-200/60 dark:divide-white/10'],
];

const copyReps = [
  ['Executive Command Center', 'Good morning, Manjiri'],
  [
    'Real-time cash liquidity, autonomous revenue recovery pipeline & global transaction transit.',
    "Here's the cash you have, the money you can still get back, and what's moving right now.",
  ],
  [
    '<span className="sr-only">Autonomous Capital Protection &amp; Leakage Interceptor</span>\n                    Active Capital &amp; Transit Radar',
    'Active Cash Flow Radar',
  ],
  [
    'Continuously scanning active transactions, settlements, and upcoming commitments.\n                    Elevated particle arcs model monetary transit in real-time across high-volume international payment corridors.',
    'We keep an eye on payments in motion, money that has settled, and bills coming up.',
  ],
  ['Global Transaction Telemetry', 'Live money movement'],
  ['Available Cash', 'Cash on hand'],
  ['>Recoverable<', '>You can get back<'],
  ['30d Payables', 'Bills due soon'],
  ['>Runway<', '>Days of cash left<'],
  ['Health Score', 'Business health'],
  ['Payment Truth Engine', 'Match your records'],
  ['>Commitment Firewall<', '>Upcoming bills<'],
  ['Autonomous Leakage Interceptor', 'Money you can claim back'],
  [
    'Algorithmic detection of fee discrepancies, unapplied dispute credits, and cross-border currency leakage across payment processors.',
    'We look for fees charged twice, credits that never arrived, and cash lost when currencies convert.',
  ],
  ['Identified Leakage', 'Money spotted'],
  ['Recovered To Date', 'Already recovered'],
  ['3D Pipeline Vortex', 'Recovery pipeline'],
  ['3-Way Multi-Source Ledger', 'Three records, one picture'],
  [
    'Autonomous graph-based reconciliation across PayPal REST API v2 transactions, bank clearing deposits, and accounting invoices.',
    'We line up PayPal, your bank, and your invoices so anything that does not match stands out.',
  ],
  ['Multi-Source Relationship Graph', 'How your records connect'],
  ['Commitment Workbench & Firewall', 'Upcoming bills'],
  [
    'Gantt scheduling, $25,000 minimum safety buffer protection & 3D holographic risk evaluation.',
    'See what you owe, keep a cash cushion, and check a new order before you commit.',
  ],
  ['Financial Digital Twin', 'Your cash, in one picture'],
  ['Autonomous Organism', 'Live model'],
  [
    'Time-aware autonomous model mapping multi-account cash velocity, burn decay, and liquidity strain.',
    'See the cash in each account, what you spend, and how long the money lasts.',
  ],
  ['Autonomous Liquidity Core & Concentric Orbital Rings', 'Cash at the center'],
  ['Cash Reservoirs & Liquid Receivables', 'Cash you have and money owed to you'],
  ['30-Day Forward Obligations & Burn', 'Bills and spending over the next 30 days'],
  ['Cash-Flow Simulation Lab & Time Machine', 'What-if cash planner'],
  [
    'Dynamic 3D terrain landscape, real-time liquidity recalculation & multi-track scenario forecasting.',
    'Change a few assumptions and see how your cash would move.',
  ],
  ['3D Topographical Cash-Flow Landscape', 'Cash over the next 90 days'],
  ['Business Survival Radar & Stress Lab', 'How sturdy is the business?'],
  [
    'Multidimensional solvency stress-testing, customer concentration defense & instant liquidity shock simulation.',
    'Try a late payment or a surprise bill and see if the business still stands.',
  ],
  ['Udhari Debt Ledger', 'Money customers still owe'],
  ['Customer Credit & Aging', 'Who still owes you'],
  [
    'Receivables tracking, automated multi-channel collection reminders, and discount-accelerated liquidity recovery.',
    'See unpaid invoices, send a reminder, or offer a small discount so you get paid sooner.',
  ],
  ['Total Outstanding', 'Still unpaid'],
  ['Recovered This Month', 'Collected this month'],
  ['Receivables Debt Aging Distribution', 'How old the unpaid invoices are'],
  ['Grounded Financial Copilot', 'Ask about your money'],
  ['Verified Store Context Bound', 'Uses your real numbers'],
  [
    'Natural-language financial intelligence strictly grounded in PayPilot ledger truth. Zero hallucination guarantee.',
    'Ask in plain English. Answers come only from your PayPilot records.',
  ],
  ['Verified Context Inspector', 'Numbers this answer uses'],
  ['Governed Action Queue & Approvals', 'Payments waiting for your OK'],
  ['Human-in-the-Loop Safeguard', 'Nothing sends until you say yes'],
  [
    'Zero autonomous disbursements without human owner review. Inspect verbatim PayPal REST API v2 payloads before sandbox execution.',
    'Read the exact PayPal request, then approve it yourself before anything is sent.',
  ],
  ['Financial Impact Projection Diff', 'What changes if you approve'],
  ['Team & Cryptographic Secure Sharing', 'Share a report safely'],
  ['SHA-256 Tamper-Proof Badges', 'Tamper-proof link'],
  [
    'Generate verifiable financial audit packs with FIPS PUB 180-2 compliant cryptographic signatures. Scoped, expiring links for external CPAs and partners.',
    'Create a report link that expires, and that others can check has not been changed.',
  ],
  ['Generate Signed Audit Report', 'Create a signed report'],
  ['Authorized Team Members & Permissions Roster', 'Who can see what'],
  ['Settings & PayPal Sandbox Configuration', 'Settings and sandbox'],
  ['REST v2 Developer Rail', 'PayPal connection'],
  [
    'Configure PayPal developer credentials, adjust latency simulator physics, wire backend endpoints, or trigger a full hackathon judge reset.',
    'Connect PayPal, tune the demo, or reset the workspace back to the starting numbers.',
  ],
  [
    'PayBack Hunter scans payment logs across payment corridors, algorithmically flagging $18,450.00 in fee overcharges.',
    'PayBack Hunter looks through your payments and finds $18,450.00 in fees you can claim back.',
  ],
  [
    'Payment Truth connects PayPal REST captures, bank clearing feeds, and invoices into an interactive 3D node graph.',
    'Payment Truth lines up PayPal, your bank, and your invoices so you can see where they disagree.',
  ],
  [
    'Owner reviews the exact JSON payload bound for PayPal REST v2 and executes an automated sandbox refund.',
    'You read the exact request that would go to PayPal, then approve a practice refund yourself.',
  ],
  [
    'Recovered liquidity updates the Digital Twin. The Commitment Firewall stress-tests new orders against the $15k safety buffer.',
    'Money you recover shows up in your cash picture. New orders are checked against your safety cushion.',
  ],
  [
    'Generate auditable reports sealed with a genuine SHA-256 proof badge and distribute scoped expiring links to CPAs.',
    'Create a report others can verify has not been changed, and share a link that expires.',
  ],
];

let changed = 0;
for (const file of walk(root)) {
  let text = fs.readFileSync(file, 'utf8');
  const original = text;
  for (const [from, to] of classReps) text = text.split(from).join(to);
  for (const [from, to] of copyReps) text = text.split(from).join(to);
  if (text !== original) {
    fs.writeFileSync(file, text);
    changed += 1;
    console.log('updated', path.relative(root, file));
  }
}
console.log('files changed', changed);
