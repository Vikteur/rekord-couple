// Mirrors the JSON shapes served by the backend's couple intake API
// (server/couples.py + server/couples_api.py in Vikteur/spotify-to-rekordbox).
//
// Only the guest-facing half lives here. The DJ-side shapes (CoupleSummary,
// CoupleDetail, links, change log) belong to Vikteur/rekord-dj.

export type ListKind =
  | 'opening_dance'
  | 'second_third'
  | 'couple_top20'
  | 'friends_top20'
  | 'must_plays'
  | 'playlist_links';

export type StartPref = 'top' | 'chorus' | 'fade';
export type TokenKind = 'couple' | 'friend' | 'dj';

export interface CoupleEntry {
  uid: string;
  kind: ListKind;
  position: number;
  spotify_id: string | null;
  isrc: string | null;
  title: string;
  artist: string;
  duration_ms: number | null;
  art_url: string | null;
  free_text: string | null;
  note: string | null;
  start_pref: StartPref | null;
  source_token_kind: TokenKind;
  created_at: string;
  updated_at: string;
}

export interface BlockEntry {
  uid: string;
  position: number;
  spotify_id: string | null;
  isrc: string | null;
  title: string;
  artist: string;
  duration_ms: number | null;
  art_url: string | null;
  free_text: string | null;
  source_token_kind: TokenKind;
  created_at: string;
}

/** One Spotify search suggestion (metadata only — nothing is downloaded). */
export interface SongHit {
  spotify_id: string | null;
  uri?: string | null;
  isrc: string | null;
  title: string;
  artist: string;
  duration_ms: number | null;
  art_url: string | null;
  album?: string | null;
}

export interface GuestState {
  scope: 'couple' | 'friends';
  names: string;
  wedding_date: string;
  caps: Record<string, number | null>;
  search_available: boolean;
  entries: Partial<Record<ListKind, CoupleEntry[]>>;
  briefing_text?: string;
  blocklist?: BlockEntry[];
  friends_link?: string;
}
