import { useEffect, useState } from 'react';
import { formatDuration } from './format';
import { ChevronDown, ChevronUp, Close } from './components/Icons';
import type { CoupleEntry, ListKind } from './types';
import { SongSearch } from './SongSearch';
import { useGuest } from './store';

/**
 * The autosave state, in the top-right corner of every page (9b–9h).
 * Deliberately understated: the couple should notice it once, believe it, and
 * never think about saving again.
 */
export function SaveChip() {
  const { saveState } = useGuest();
  const label =
    saveState === 'saved' ? 'saved just now ✓' : saveState === 'saving' ? 'saving…' : 'retrying…';
  return <span className={`save-chip save-${saveState}`}>{label}</span>;
}

/** Example placeholders, rotated so a 20-row table doesn't repeat one hint. */
const ROW_EXAMPLES = [
  'Type a song, artist and title…',
  'Another one you both love…',
  'Something that fills a floor…',
  'A song from your first year…',
  'One nobody expects…',
  'Whatever comes to mind…',
];

export function rowPlaceholder(index: number): string {
  return ROW_EXAMPLES[index % ROW_EXAMPLES.length];
}

interface SongCardProps {
  entry: CoupleEntry;
  onRemove?: () => void;
  /** The settled-state badge, e.g. "Locked in" or "Second song". */
  status?: string;
}

/** One chosen song, as it looks once it is picked (9b, 9c). */
export function SongCard({ entry, onRemove, status }: SongCardProps) {
  const duration = entry.duration_ms != null ? formatDuration(entry.duration_ms / 1000) : '';
  const sub = entry.artist || (entry.spotify_id ? '' : 'as typed');
  return (
    <div className="songcard">
      {entry.art_url ? (
        <img className="songcard-art" src={entry.art_url} alt="" loading="lazy" />
      ) : (
        <span className="songcard-art songcard-art-empty" aria-hidden>
          ♪
        </span>
      )}
      <span className="songcard-text">
        <span className="songcard-title">{entry.title}</span>
        <span className="songcard-sub">
          {sub}
          {sub && duration ? ' · ' : ''}
          {duration}
        </span>
      </span>
      {status && <span className="songcard-status">{status} ✓</span>}
      {onRemove && (
        <button className="icon-btn" aria-label="Choose a different song" onClick={onRemove}>
          <Close size={14} />
        </button>
      )}
    </div>
  );
}

interface SongTableProps {
  kind: ListKind;
  rows: number;
  canAdd: boolean;
  canRemove: boolean;
  canReorder: boolean;
  showSource?: boolean;
  /** Twenty lines want two columns; five must-plays want one. */
  single?: boolean;
}

/**
 * The numbered fill-in table behind the top 20, the friends' list and the
 * must-plays (9d, 9f, 9h): one line per slot, ruled like a printed list.
 *
 * Only one empty row is a live input at a time — the next one to fill —
 * because twenty simultaneous text fields read as a form, and this is meant to
 * read as a list you are writing. Clicking any later empty line moves the
 * input there, so no slot is ever out of reach.
 */
export function SongTable({
  kind,
  rows,
  canAdd,
  canRemove,
  canReorder,
  showSource = false,
  single = false,
}: SongTableProps) {
  const store = useGuest();
  const entries = store.listOf(kind);
  const byPosition = new Map(entries.map((entry) => [entry.position, entry]));

  const firstEmpty = Array.from({ length: rows }, (_, index) => index).find(
    (index) => !byPosition.has(index),
  );
  const [openRow, setOpenRow] = useState<number | null>(null);
  // When a pick fills the open row, follow the list down to the next gap.
  useEffect(() => {
    if (openRow != null && byPosition.has(openRow)) setOpenRow(null);
  }, [openRow, entries.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeRow = openRow ?? firstEmpty;

  const line = (index: number) => {
    const entry = byPosition.get(index);
    /*
     * Only the odd ones out are marked. The friends' list is written by
     * friends, so labelling all twenty "a friend" says nothing and costs the
     * width the song titles need — what is worth pointing at is the row the
     * couple themselves dropped in.
     */
    const chip =
      showSource && entry && entry.source_token_kind === 'couple' ? 'the couple' : null;
    return (
      <div
        key={entry?.uid ?? `empty-${index}`}
        className={`songtable-row ${!entry && index === activeRow ? 'filling' : ''}`}
      >
        <span className="mono songtable-num">{String(index + 1).padStart(2, '0')}</span>
        <span className="songtable-cell">
          {entry ? (
            <>
              <span className="songtable-value">
                {entry.title}
                {entry.artist && <span className="songtable-artist">, {entry.artist}</span>}
              </span>
              {chip && <span className="songcard-chip">{chip}</span>}
              <span className="songtable-actions">
                {canReorder && (
                  <>
                    <button
                      className="icon-btn"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => store.moveEntry(kind, entry.uid, -1)}
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Move down"
                      disabled={index === rows - 1}
                      onClick={() => store.moveEntry(kind, entry.uid, 1)}
                    >
                      <ChevronDown size={13} />
                    </button>
                  </>
                )}
                {canRemove && (
                  <button
                    className="icon-btn"
                    aria-label="Remove song"
                    onClick={() => store.removeEntry(entry.uid)}
                  >
                    <Close size={13} />
                  </button>
                )}
              </span>
            </>
          ) : canAdd && index === activeRow ? (
            <SongSearch
              compact
              placeholder={rowPlaceholder(index)}
              search={store.search}
              searchAvailable={store.data?.search_available ?? false}
              onPick={(pick) => store.pickSong(kind, index, pick)}
            />
          ) : canAdd ? (
            <button
              className="songtable-open"
              aria-label={`Add a song at ${index + 1}`}
              onClick={() => setOpenRow(index)}
            />
          ) : (
            <span className="songtable-open" />
          )}
        </span>
      </div>
    );
  };

  const columns = single
    ? [Array.from({ length: rows }, (_, index) => index)]
    : [
        Array.from({ length: Math.ceil(rows / 2) }, (_, index) => index),
        Array.from({ length: Math.floor(rows / 2) }, (_, index) => index + Math.ceil(rows / 2)),
      ];

  return (
    <div className={`songtable ${single ? 'songtable-single' : ''}`}>
      {columns.map((indexes, column) => (
        <div className="songtable-col" key={column}>
          {indexes.map(line)}
        </div>
      ))}
    </div>
  );
}

/** One line of the reveal (9e): the title in italic serif, the artist in mono. */
export function RevealRow({ entry }: { entry: CoupleEntry }) {
  return (
    <div className="reveal-row">
      <span className="reveal-title">{entry.title}</span>
      {entry.artist && <span className="reveal-artist">{entry.artist}</span>}
    </div>
  );
}

/** Readonly link + copy button (the shared friends link, 9f). */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="copylink">
      <input
        className="input copylink-input"
        readOnly
        value={url}
        onFocus={(event) => event.target.select()}
      />
      <button
        className="btn"
        onClick={() => {
          navigator.clipboard
            .writeText(url)
            .then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            })
            .catch(() => undefined);
        }}
      >
        {copied ? 'Copied ✓' : 'Copy link'}
      </button>
    </div>
  );
}
