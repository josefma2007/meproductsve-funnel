/**
 * AI Tool Definitions — converts DeepSpace BUILT_IN_TOOLS to Vercel AI SDK tools.
 *
 * The assistant can read AND modify data. Per-collection RBAC at the DO
 * layer is the actual security boundary — the user's role determines what
 * each tool call is allowed to do, regardless of what's in this allowlist.
 * Trim entries below if you want a stricter assistant for your app.
 */

import { jsonSchema, tool } from 'ai'
import type { ToolSet } from 'ai'
import { z } from 'zod/v4'
import { BUILT_IN_TOOLS, applyAiToolDefaults } from 'deepspace/worker'
import type { ToolSchema, CollectionSchema } from 'deepspace/worker'

type ToolExecutor = (toolName: string, params: Record<string, unknown>) => Promise<unknown>

/**
 * The assistant is read-only in this app: it answers product questions from
 * the MeProductsVE catalog and gives ONE funnel insight from live data. It
 * never creates, updates, or deletes records — orders are placed by the user
 * in the storefront, not by the assistant.
 */
const ALLOWED_TOOL_NAMES = [
  'schema.list',
  'schema.describe',
  'records.query',
  'records.get',
  'user.current',
]

// ============================================================================
// System prompt
// ============================================================================

type Interpretation = CollectionSchema['columns'][number]['interpretation']

/**
 * Interpretation is `string | Record<string, unknown>`. When it's an object
 * the convention across the SDK's schemas is `{ kind: string, ... }`.
 * Narrow safely to a human-readable name.
 */
function interpretationLabel(interpretation: Interpretation): string {
  if (typeof interpretation === 'string') return interpretation
  const kind = interpretation.kind
  return typeof kind === 'string' ? kind : 'object'
}

export function buildSystemPrompt(appName: string, schemas: CollectionSchema[]): string {
  const schemaSummary = schemas
    .map((s) => {
      const cols = (s.columns ?? [])
        .map((c) => `${c.name}:${interpretationLabel(c.interpretation)}${c.required ? '!' : ''}`)
        .join(', ')
      return `- ${s.name}${cols ? ` (${cols})` : ''}`
    })
    .join('\n')

  return [
    `You are the assistant for the "${appName}" app on DeepSpace — the demo storefront and funnel analytics of MeProductsVE, a small tech e-commerce in Barquisimeto, Venezuela (sold online from Orlando).`,
    'You can READ the user\'s data via the available tools. You cannot write anything: this assistant is read-only by design.',
    '',
    '## The business (answer ONLY from this catalog — never invent products, prices, or discounts)',
    '- iPhone 13 Pro 128GB, Grado A — $635 en 6 cuotas, or $685 (100% battery). The best seller.',
    '- iPhone 14 128GB (100% battery), Grado A — $570. The best price.',
    '- iPhone 14 Pro 256GB, Grado A — $790 en 6 cuotas, or $860 en 3 cuotas. Top of the line.',
    '- iPhones are "Grado A". NEVER call them "new" or "sealed".',
    '- Offer: 0% de inicial con Cashea · Nivel 6. Payment is completed via Cashea (BNPL) outside this demo app; this app only records an order draft, no real charge.',
    '',
    '## The funnel (stages, in order)',
    'ad_view (saw the ad) → product_view (opened a product) → offer_view (revealed the 0% inicial offer) → checkout_started (tapped "Apartar / Iniciar pedido") → order_placed (confirmed the draft order).',
    'Live events live in the "funnel-events" collection (fields: stage, productId). Orders live in "orders" (fields: productId, productName, priceLabel, userId, status).',
    '',
    '## Seeded demo baseline (real MeProductsVE numbers, labeled demo data)',
    '1.21M impressions, 52K clicks, 4.29% CTR, 440K reach, 63 orders, $14,236.92 revenue, $4,213.92 profit. Historically only impressions → clicks → orders were measured; offer views and checkout starts were NOT measured before — that is what this app measures live now.',
    '',
    '## How to give the funnel insight',
    'When asked for a funnel insight (or what experiment to try next): query "funnel-events", count events per stage, compute the conversion between consecutive stages, and name the single biggest drop-off. Then suggest exactly ONE concrete experiment to fix that step (e.g. if offer_view → checkout_started is the worst, suggest testing the sign-in friction or a clearer "sin pago hoy" line). If there are no live events yet, say so plainly and use the seeded demo baseline instead, labeled as demo data. Never invent numbers.',
    '',
    '## Guardrails',
    'Use tools to look up facts before answering. Do not invent data.',
    'If data is missing, say so plainly. Keep answers concise.',
    'Answer in the language the user writes in (Spanish or English).',
    '',
    'Available collections:',
    schemaSummary || '(none)',
  ].join('\n')
}

// ============================================================================
// Tool definitions
// ============================================================================

export function buildTools(executor: ToolExecutor): ToolSet {
  const tools: ToolSet = {}

  for (const def of BUILT_IN_TOOLS) {
    if (!ALLOWED_TOOL_NAMES.includes(def.name)) continue
    const safeName = def.name.replace('.', '_')
    tools[safeName] = tool({
      description: def.description,
      inputSchema: buildInputSchema(def),
      // Apply assistant-only param defaults (e.g. records.query page size) here
      // in the AI tool layer, so internal record readers that hit the tools
      // dispatch directly stay unbounded.
      execute: async (params: Record<string, unknown>) =>
        executor(def.name, applyAiToolDefaults(def.name, params)),
    })
  }

  return tools
}

// ============================================================================
// Convert ToolSchema params → Zod validator + derived provider JSON Schema
// ============================================================================

/**
 * The Zod validator is the single source; the provider-facing JSON Schema is
 * derived from it with Zod's native conversion, which keeps z.record()
 * objects open (`additionalProperties: {}`). The AI SDK's own Zod conversion
 * closes every object, which would incorrectly advertise the free-form
 * `data` and `where` objects as empty — so the conversion happens here.
 */
function buildInputSchema(def: ToolSchema) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const [name, param] of Object.entries(def.params)) {
    let s: z.ZodTypeAny
    switch (param.type) {
      case 'string':
        s = z.string()
        break
      case 'number':
        s = z.number()
        break
      case 'boolean':
        s = z.boolean()
        break
      case 'object':
        s = z.record(z.string(), z.unknown())
        break
      case 'array':
        s = z.array(z.unknown())
        break
    }
    if (param.description) s = s.describe(param.description)
    if (!param.required) s = s.optional()
    shape[name] = s
  }

  const validator = z.object(shape)
  return jsonSchema<Record<string, unknown>>(
    z.toJSONSchema(validator) as Parameters<typeof jsonSchema>[0],
    {
      validate: async (value) => {
        const result = await validator.safeParseAsync(value)
        return result.success
          ? { success: true, value: result.data }
          : { success: false, error: result.error }
      },
    },
  )
}
