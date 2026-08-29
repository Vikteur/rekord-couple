/**
 * The API's types, generated from `rekord-contract`.
 *
 * These were hand-copied from the Python models and kept in sync by eye with
 * two other repos copying the same shapes independently. The couple's intake is
 * the one screen where a wrong field is expensive rather than merely wrong: it
 * autosaves, so a mismatch gets written back, not just displayed.
 *
 * Regenerate with `npm run types` after the contract changes.
 */

import type { components } from './api/schema'

type S = components['schemas']

export type ListKind = S['ListKind']
export type StartPref = S['StartPref']

/** couple | friend | dj — who put the song on the list. */
export type TokenKind = S['SourceKind']

export type CoupleEntry = S['SongEntry']
export type BlockEntry = S['BlockEntry']

/** One Spotify search suggestion (metadata only — nothing is downloaded). */
export type SongHit = S['SongHit']

/**
 * Everything the intake needs, in one response.
 *
 * `caps` comes from the server rather than being hard-coded here, so a cap
 * changes in one place; `search_available` lets the intake degrade to free text
 * and say so, instead of looking broken when Spotify credentials are missing.
 */
export type GuestState = S['PortalState']
