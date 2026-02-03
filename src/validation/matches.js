import { z } from 'zod';

/**
 * Query schema for listing matches.
 * Validates optional limit as coerced positive integer with maximum 100.
 */
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Match status constants (values in lowercase).
 */
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

/**
 * Param schema for match ID (e.g. route params).
 * Validates required id as coerced positive integer.
 */
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const isoDateString = z.string().refine(
  (val) => {
    const parsed = Date.parse(val);
    return !Number.isNaN(parsed);
  },
  { message: 'Must be a valid ISO date string' }
);

/**
 * Schema for creating a match.
 * Validates sport, homeTeam, awayTeam as non-empty strings;
 * startTime and endTime as valid ISO date strings (endTime after startTime);
 * optional homeScore and awayScore as coerced non-negative integers.
 */
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, 'Sport must be non-empty'),
    homeTeam: z.string().min(1, 'Home team must be non-empty'),
    awayTeam: z.string().min(1, 'Away team must be non-empty'),
    startTime: isoDateString,
    endTime: isoDateString,
    homeScore: z.coerce.number().int().min(0).optional(),
    awayScore: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    const start = Date.parse(data.startTime);
    const end = Date.parse(data.endTime);
    if (end <= start) {
      ctx.addIssue({
        code: 'custom',
        message: 'endTime must be chronologically after startTime',
        path: ['endTime'],
      });
    }
  });

/**
 * Schema for updating match scores.
 * Requires homeScore and awayScore as coerced non-negative integers.
 */
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});
