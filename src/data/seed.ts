import { Project, SalvagedComponent, RoadmapEvent, AppData } from '@/types';
import { computeResurrectionScore, SCORE_MODEL_VERSION } from '@/lib/score';

// Compute scores deterministically via formula
const authScore = computeResurrectionScore({
  completion: 32,
  willingness: 2,
  usefulComponents: 3,
  hoursAvailable: 6,
  scopeClarity: 3,
  blockerSeverity: 3,
});

const paymentScore = computeResurrectionScore({
  completion: 58,
  willingness: 4,
  usefulComponents: 4,
  hoursAvailable: 15,
  scopeClarity: 4,
  blockerSeverity: 3,
});

const emailScore = computeResurrectionScore({
  completion: 84,
  willingness: 5,
  usefulComponents: 4,
  hoursAvailable: 22,
  scopeClarity: 5,
  blockerSeverity: 1,
});

const campusScore = computeResurrectionScore({
  completion: 22,
  willingness: 3,
  usefulComponents: 1,
  hoursAvailable: 8,
  scopeClarity: 2,
  blockerSeverity: 2,
});

export const SEED_PROJECTS: Project[] = [
  {
    id: 'seed-legacy-auth',
    name: 'legacy-auth',
    description: 'Stateless JWT authentication service with refresh token rotation and PostgreSQL storage.',
    stack: ['Node', 'Express', 'JWT', 'PostgreSQL'],
    category: 'API / Backend',
    completion: 32,
    status: 'deceased',
    lastActiveAt: '2025-11-14T10:00:00.000Z',
    createdAt: '2025-10-10T08:30:00.000Z',
    updatedAt: '2025-11-14T10:00:00.000Z',
    pinned: false,
    isSample: true,
    autopsy: {
      whatWasBuilt: 'Express boilerplate with bcrypt password hashing, token issue endpoints, and session revocation table in Postgres.',
      whatBroke: 'Race conditions during simultaneous token rotation requests in clustered environment caused intermittent auth drops.',
      whyStopped: 'Exhausted by debugging multi-instance token redis sync while solo developing alongside day job obligations.',
      stopCategory: 'burnout',
      willingness: 2,
      usefulComponents: 3,
      hoursAvailable: 6,
      scopeClarity: 3,
      blockerSeverity: 3,
      score: authScore.score,
      scoreModelVersion: SCORE_MODEL_VERSION,
      completedAt: '2025-11-14T11:00:00.000Z',
    },
  },
  {
    id: 'seed-payment-core',
    name: 'payment-core',
    description: 'Subscription billing orchestration layer integrating Stripe Webhooks and Redis idempotency locks.',
    stack: ['TypeScript', 'Stripe', 'Redis'],
    category: 'API / Backend',
    completion: 58,
    status: 'in_stasis',
    lastActiveAt: '2026-02-18T16:00:00.000Z',
    createdAt: '2025-12-01T12:00:00.000Z',
    updatedAt: '2026-02-18T16:00:00.000Z',
    pinned: true,
    isSample: true,
    autopsy: {
      whatWasBuilt: 'Webhook dispatcher, Stripe checkout session creator, and Redis lock idempotency wrapper.',
      whatBroke: 'Stripe API version mismatch during mid-sprint SDK update broke customer discount calculation schemas.',
      whyStopped: 'Core SaaS business model pivoted to enterprise direct invoicing before automated self-serve billing launched.',
      stopCategory: 'priorities',
      willingness: 4,
      usefulComponents: 4,
      hoursAvailable: 15,
      scopeClarity: 4,
      blockerSeverity: 3,
      score: paymentScore.score,
      scoreModelVersion: SCORE_MODEL_VERSION,
      completedAt: '2026-02-18T16:30:00.000Z',
    },
    plan: {
      path: 'archive',
      chosenAt: '2026-02-18T17:00:00.000Z',
      recommendedPath: 'phoenix',
      notes: 'Pivoted to enterprise direct invoicing. Codebase archived peacefully until self-serve tier is reintroduced.',
      epitaph: 'A resilient payment engine laid to rest when business priorities shifted to high-touch sales.',
      archivedAt: '2026-02-18T17:00:00.000Z',
    },
  },
  {
    id: 'seed-email-worker',
    name: 'email-worker',
    description: 'High-throughput transactional email delivery microservice powered by Celery queues and Amazon SES.',
    stack: ['Python', 'Celery', 'SES'],
    category: 'API / Backend',
    completion: 84,
    status: 'resurrecting',
    lastActiveAt: '2026-06-25T14:20:00.000Z',
    createdAt: '2026-05-10T09:00:00.000Z',
    updatedAt: '2026-06-25T14:20:00.000Z',
    pinned: true,
    isSample: true,
    autopsy: {
      whatWasBuilt: 'Celery worker cluster, HTML template compiler with Jinja2, SES raw message sender with exponential backoff.',
      whatBroke: 'Template preview live reload hot loop consumed 100% memory in local development environment.',
      whyStopped: 'Wanted to add a visual WYSIWYG editor and analytics dashboard before shipping the barebones CLI worker.',
      stopCategory: 'scope',
      willingness: 5,
      usefulComponents: 4,
      hoursAvailable: 22,
      scopeClarity: 5,
      blockerSeverity: 1,
      score: emailScore.score,
      scoreModelVersion: SCORE_MODEL_VERSION,
      completedAt: '2026-06-25T15:00:00.000Z',
    },
    plan: {
      path: 'phoenix',
      chosenAt: '2026-06-25T15:30:00.000Z',
      recommendedPath: 'phoenix',
      notes: 'Executing 3-day Phoenix Sprint to trim scope and deploy minimal CLI email queue.',
      tasks: [
        { id: 'task-1', text: 'Strip WYSIWYG editor dependencies and keep pure Jinja templates', done: true },
        { id: 'task-2', text: 'Configure Celery retry backoff queue for AWS SES throttling', done: true },
        { id: 'task-3', text: 'Benchmark 5,000 email burst test on staging Redis queue', done: false },
        { id: 'task-4', text: 'Add healthcheck HTTP endpoint for container uptime monitoring', done: false },
        { id: 'task-5', text: 'Deploy worker to production ECS cluster', done: false },
      ],
    },
  },
  {
    id: 'seed-campus-pulse',
    name: 'campus-pulse',
    description: 'Anonymous student feedback and campus event discovery board with geofencing.',
    stack: ['React', 'Firebase', 'Tailwind'],
    category: 'Web App',
    completion: 22,
    status: 'deceased',
    lastActiveAt: '2026-04-12T19:00:00.000Z',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-12T19:00:00.000Z',
    pinned: false,
    isSample: true,
    autopsy: {
      whatWasBuilt: 'Landing page, Firebase Auth with university email filter, and initial Firestore read/write feeds.',
      whatBroke: 'Firestore security rules allowed cross-origin writes during testing, leading to spam injection.',
      whyStopped: 'University semester ended and team members scattered for summer internships.',
      stopCategory: 'priorities',
      willingness: 3,
      usefulComponents: 1,
      hoursAvailable: 8,
      scopeClarity: 2,
      blockerSeverity: 2,
      score: campusScore.score,
      scoreModelVersion: SCORE_MODEL_VERSION,
      completedAt: '2026-04-12T20:00:00.000Z',
    },
  },
];

export const SEED_COMPONENTS: SalvagedComponent[] = [
  {
    id: 'seed-comp-jwt',
    projectId: 'seed-legacy-auth',
    name: 'jwt-refresh-middleware',
    type: 'snippet',
    description: 'Express middleware for verifying Authorization headers and automatically issuing fresh refresh tokens.',
    stack: ['Node', 'Express', 'JWT'],
    content: `// Express JWT Refresh Middleware
import jwt from 'jsonwebtoken';

export function verifyAndRefreshToken(secret, refreshSecret) {
  return async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token missing' });

    jwt.verify(token, secret, (err, user) => {
      if (!err) {
        req.user = user;
        return next();
      }
      // Attempt refresh token rotation
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) return res.status(403).json({ error: 'Session expired' });

      jwt.verify(refreshToken, refreshSecret, (refreshErr, decoded) => {
        if (refreshErr) return res.status(403).json({ error: 'Invalid refresh token' });
        const newAccessToken = jwt.sign({ id: decoded.id }, secret, { expiresIn: '15m' });
        res.setHeader('x-refreshed-token', newAccessToken);
        req.user = decoded;
        next();
      });
    });
  };
}`,
    tags: ['auth', 'security', 'middleware'],
    createdAt: '2025-11-14T11:15:00.000Z',
    updatedAt: '2025-11-14T11:15:00.000Z',
  },
  {
    id: 'seed-comp-sessions-schema',
    projectId: 'seed-legacy-auth',
    name: 'users-sessions',
    type: 'schema',
    description: 'PostgreSQL schema for secure user authentication, password salt storage, and active device sessions.',
    stack: ['PostgreSQL', 'SQL'],
    content: `-- PostgreSQL Authentication & Revocable Sessions Schema
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_sessions_token ON active_sessions(refresh_token_hash);`,
    tags: ['database', 'postgres', 'schema'],
    createdAt: '2025-11-14T11:20:00.000Z',
    updatedAt: '2025-11-14T11:20:00.000Z',
  },
  {
    id: 'seed-comp-stripe-handler',
    projectId: 'seed-payment-core',
    name: 'stripe-webhook-handler',
    type: 'snippet',
    description: 'Idempotent webhook processor verifying Stripe signatures and guaranteeing single execution via Redis keys.',
    stack: ['TypeScript', 'Stripe', 'Redis'],
    content: `// Idempotent Stripe Webhook Processor
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import Redis from 'ioredis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const redis = new Redis(process.env.REDIS_URL!);

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Idempotency lock via Redis
  const lockKey = \`stripe:event:\${event.id}\`;
  const acquired = await redis.set(lockKey, 'locked', 'EX', 86400, 'NX');
  if (!acquired) {
    return res.status(200).json({ received: true, note: 'Duplicate skipped' });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Fulfill order logic
      break;
    case 'customer.subscription.deleted':
      // Handle cancellation
      break;
  }

  return res.status(200).json({ received: true });
}`,
    tags: ['billing', 'stripe', 'redis', 'webhooks'],
    createdAt: '2026-02-18T16:45:00.000Z',
    updatedAt: '2026-02-18T16:45:00.000Z',
  },
  {
    id: 'seed-comp-checkout-form',
    projectId: 'seed-payment-core',
    name: 'checkout-form',
    type: 'ui_block',
    description: 'Clean billing checkout drawer showing subscription tiers, billing toggle, and Stripe Elements mount point.',
    stack: ['React', 'Tailwind', 'Stripe'],
    content: `// Checkout Subscription Modal UI Block
import React, { useState } from 'react';

export function CheckoutDrawer({ plans, onSelectPlan, onClose }) {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h3 className="font-mono text-lg font-semibold text-text">Select Subscription Plan</h3>
          <button onClick={onClose} className="text-muted hover:text-text font-mono text-sm">&times;</button>
        </div>

        <div className="my-6 flex items-center justify-center gap-3">
          <span className="text-xs text-muted">Monthly</span>
          <button
            type="button"
            onClick={() => setAnnual(!annual)}
            className="w-11 h-6 rounded-full bg-surface-2 border border-border flex items-center px-1"
          >
            <div className={\`w-4 h-4 rounded-full bg-acid transition-transform \${annual ? 'translate-x-5' : ''}\`} />
          </button>
          <span className="text-xs text-acid">Annual (Save 20%)</span>
        </div>

        <div id="stripe-payment-element-anchor" className="min-h-[140px] rounded border border-dashed border-border flex items-center justify-center text-xs text-muted">
          Stripe Payment Element Container
        </div>
      </div>
    </div>
  );
}`,
    tags: ['react', 'ui', 'billing', 'modal'],
    createdAt: '2026-02-18T16:50:00.000Z',
    updatedAt: '2026-02-18T16:50:00.000Z',
  },
  {
    id: 'seed-comp-celery-worker',
    projectId: 'seed-email-worker',
    name: 'queue-retry-worker',
    type: 'snippet',
    description: 'Celery task handler with exponential backoff, dead-letter logging, and rate limiting for SES.',
    stack: ['Python', 'Celery', 'SES'],
    content: `# Celery Retry Worker with SES Backoff
from celery import Celery
import boto3
from botocore.exceptions import ClientError
import logging

app = Celery('email_worker', broker='redis://localhost:6379/0')
ses = boto3.client('ses', region_name='us-east-1')

@app.task(bind=True, max_retries=5, default_retry_delay=60, rate_limit='14/s')
def dispatch_transactional_email(self, recipient, subject, html_body):
    try:
        response = ses.send_email(
            Source='noreply@projectgraveyard.dev',
            Destination={'ToAddresses': [recipient]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {'Html': {'Data': html_body, 'Charset': 'UTF-8'}}
            }
        )
        return response['MessageId']
    except ClientError as exc:
        code = exc.response['Error']['Code']
        if code in ('Throttling', 'ServiceUnavailable'):
            countdown = 2 ** self.request.retries * 10
            logging.warning(f"Throttled by SES. Retrying in {countdown}s")
            raise self.retry(exc=exc, countdown=countdown)
        raise exc`,
    tags: ['python', 'celery', 'email', 'queue'],
    createdAt: '2026-06-25T15:10:00.000Z',
    updatedAt: '2026-06-25T15:10:00.000Z',
  },
  {
    id: 'seed-comp-template-grid',
    projectId: 'seed-email-worker',
    name: 'email-template-grid',
    type: 'ui_block',
    description: 'Responsive preview cards with HTML iframe sandbox for inspecting email layouts.',
    stack: ['React', 'Tailwind'],
    content: `// Email Template Preview Sandbox Grid
import React, { useState } from 'react';

export function TemplatePreviewGrid({ templates }) {
  const [selected, setSelected] = useState(templates[0]?.id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {templates.map((tpl) => (
        <div
          key={tpl.id}
          onClick={() => setSelected(tpl.id)}
          className={\`cursor-pointer rounded-lg border p-3 transition-colors \${
            selected === tpl.id ? 'border-acid bg-surface-2' : 'border-border bg-surface'
          }\`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="font-mono text-xs font-medium text-text">{tpl.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted">{tpl.locale}</span>
          </div>
          <iframe
            srcDoc={tpl.html}
            title={tpl.name}
            sandbox="allow-same-origin"
            className="w-full h-32 rounded border border-border pointer-events-none bg-white"
          />
        </div>
      ))}
    </div>
  );
}`,
    tags: ['react', 'email', 'templates', 'preview'],
    createdAt: '2026-06-25T15:15:00.000Z',
    updatedAt: '2026-06-25T15:15:00.000Z',
  },
];

export const SEED_EVENTS: RoadmapEvent[] = [
  // legacy-auth events
  {
    id: 'ev-la-1',
    projectId: 'seed-legacy-auth',
    kind: 'project_created',
    message: 'Project buried in the Necropolis Vault.',
    at: '2025-10-10T08:30:00.000Z',
  },
  {
    id: 'ev-la-2',
    projectId: 'seed-legacy-auth',
    kind: 'autopsy_completed',
    message: `Autopsy post-mortem completed. Resurrection Score calculated at ${authScore.score}.`,
    at: '2025-11-14T11:00:00.000Z',
    meta: { score: authScore.score },
  },
  {
    id: 'ev-la-3',
    projectId: 'seed-legacy-auth',
    kind: 'component_added',
    message: 'Salvaged reusable snippet: jwt-refresh-middleware.',
    at: '2025-11-14T11:15:00.000Z',
  },
  {
    id: 'ev-la-4',
    projectId: 'seed-legacy-auth',
    kind: 'component_added',
    message: 'Salvaged database schema: users-sessions.',
    at: '2025-11-14T11:20:00.000Z',
  },

  // payment-core events
  {
    id: 'ev-pc-1',
    projectId: 'seed-payment-core',
    kind: 'project_created',
    message: 'Project buried in the Necropolis Vault.',
    at: '2025-12-01T12:00:00.000Z',
  },
  {
    id: 'ev-pc-2',
    projectId: 'seed-payment-core',
    kind: 'autopsy_completed',
    message: `Autopsy post-mortem completed. Resurrection Score calculated at ${paymentScore.score}.`,
    at: '2026-02-18T16:30:00.000Z',
    meta: { score: paymentScore.score },
  },
  {
    id: 'ev-pc-3',
    projectId: 'seed-payment-core',
    kind: 'component_added',
    message: 'Salvaged reusable snippet: stripe-webhook-handler.',
    at: '2026-02-18T16:45:00.000Z',
  },
  {
    id: 'ev-pc-4',
    projectId: 'seed-payment-core',
    kind: 'path_selected',
    message: 'Chose Peaceful Archive path. Epitaph engraved.',
    at: '2026-02-18T17:00:00.000Z',
    meta: { path: 'archive', from: 'deceased', to: 'in_stasis' },
  },

  // email-worker events
  {
    id: 'ev-ew-1',
    projectId: 'seed-email-worker',
    kind: 'project_created',
    message: 'Project buried in the Necropolis Vault.',
    at: '2026-05-10T09:00:00.000Z',
  },
  {
    id: 'ev-ew-2',
    projectId: 'seed-email-worker',
    kind: 'autopsy_completed',
    message: `Autopsy post-mortem completed. Resurrection Score calculated at ${emailScore.score}.`,
    at: '2026-06-25T15:00:00.000Z',
    meta: { score: emailScore.score },
  },
  {
    id: 'ev-ew-3',
    projectId: 'seed-email-worker',
    kind: 'path_selected',
    message: 'Activated Phoenix Protocol. 3-day MVP sprint initiated.',
    at: '2026-06-25T15:30:00.000Z',
    meta: { path: 'phoenix', from: 'deceased', to: 'resurrecting' },
  },

  // campus-pulse events
  {
    id: 'ev-cp-1',
    projectId: 'seed-campus-pulse',
    kind: 'project_created',
    message: 'Project buried in the Necropolis Vault.',
    at: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'ev-cp-2',
    projectId: 'seed-campus-pulse',
    kind: 'autopsy_completed',
    message: `Autopsy post-mortem completed. Resurrection Score calculated at ${campusScore.score}.`,
    at: '2026-04-12T20:00:00.000Z',
    meta: { score: campusScore.score },
  },
];

export function getInitialSeedData(): AppData {
  return {
    schemaVersion: 1,
    projects: SEED_PROJECTS,
    components: SEED_COMPONENTS,
    events: SEED_EVENTS,
  };
}
