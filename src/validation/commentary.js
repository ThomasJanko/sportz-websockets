import { z } from 'zod';

/**
 * Query schema for listing commentary.
 * Validates optional limit as coerced positive integer with maximum 100.
 */
export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Schema for creating a commentary entry.
 * Validates minute (non-negative int), sequence, period, eventType, actor, team,
 * message (required), metadata (record), and tags (array of strings).
 */
export const createCommentarySchema = z.object({
  minute: z.number().int().min(0),
  sequence: z.number().int().min(0),
  period: z.string(),
  eventType: z.string(),
  actor: z.string(),
  team: z.string(),
  message: z.string().min(1, 'Message must be non-empty'),
  metadata: z.record(z.string(), z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
});
