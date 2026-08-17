import { useEffect, useState } from 'react';
import type { StartPref } from './types';
import { SongSearch } from './SongSearch';
import { Close } from './components/Icons';
import { formatWeddingDate } from './format';
import { CopyLink, RevealRow, SongCard, SongTable } from './parts';
import { useGuest } from './store';

/**
 * The eight pages of the intake, built to Claude Design turn 9 (9a–9h).
 *
 * Each one asks a single question, in the couple's own language rather than
 * the DJ's: the headline is the question, the lead explains why it matters,
 * and the answer is the only control on the page.
 */

/* ------------------------------------------------ 1 · the invitation (9a) */

export function WelcomeScreen({ onBegin }: { onBegin: () => void }) {
  const store = useGuest();
  const data = store.data!;
  const ready = Boolean(data.names.trim() && data.wedding_date);
  // A native date field can only render as mm/dd/yyyy, which is not what this
  // page is for. Show the date written out, and swap in the picker on click.
  const [editingDate, setEditingDate] = useState(false);
  return (
    <div className="g-col g-col-center">
      <input
        className="g-names-input"
        aria-label="Your names"
        placeholder="Your names"
        value={data.names}
        onChange={(event) => store.patchCouple({ names: event.target.value })}
      />
      {editingDate || !data.wedding_date ? (
        <input
          type="date"
          className="g-date-input"
          aria-label="Wedding date"
          autoFocus={editingDate}
          value={data.wedding_date}
          onBlur={() => setEditingDate(false)}
          onChange={(event) => store.patchCouple({ wedding_date: event.target.value }, false)}
        />
      ) : (
        <button className="g-date-input" onClick={() => setEditingDate(true)}>
          {formatWeddingDate(data.wedding_date)}
        </button>
      )}
      <h1 className="g-title g-title-lg g-welcome-headline">
        Let's build the beautiful story of your wedding.
      </h1>
      <p className="g-lead">
        Your DJ set this page up just for the two of you. Eight small questions, about ten
        minutes together on the couch, and every answer flows straight into the set played
        that night.
      </p>
      <div className="g-welcome-cta">
        <button className="btn" disabled={!ready} onClick={onBegin}>
          Begin →
        </button>
      </div>
      <p className="hint">
        {ready
          ? 'Everything saves as you type. Come back to this link any time.'
          : 'Add your names and your wedding date to begin.'}
      </p>
    </div>
  );
}

/* ------------------------------------------------ 2 · opening dance (9b) */

const START_OPTIONS: { value: StartPref; label: string }[] = [
  { value: 'top', label: 'From the top' },
  { value: 'chorus', label: 'From the chorus' },
  { value: 'fade', label: 'Fade it in' },
];

export function OpeningScreen() {
  const store = useGuest();
  const entry = store.listOf('opening_dance')[0];
  return (
    <div className="g-col">
      <h1 className="g-title">Which song opens your first dance?</h1>
      <p className="g-lead">
        Most couples open the party with a wedding dance. The one you two will remember
        forever, and your DJ treats it with care.
      </p>
      <div className="g-body">
        {/*
          The search stays on the page after a pick (9b): changing your mind
          should be one search away, not a delete followed by a search. Picking
          again replaces the entry in place, so the note and the start
          preference below survive it.
        */}
        <SongSearch
          autoFocus={!entry}
          placeholder="Search a song, or paste a Spotify link…"
          search={store.search}
          searchAvailable={store.data?.search_available ?? false}
          onPick={(pick) => store.pickSong('opening_dance', 0, pick, entry?.uid)}
        />
        {entry && (
          <div className="g-slot">
            <SongCard
              entry={entry}
              status="Locked in"
              onRemove={() => store.removeEntry(entry.uid)}
            />
          </div>
        )}

        <div className="g-pillrow">
          <span className="g-pillrow-label">How and when should it start?</span>
          {START_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`g-pill ${entry?.start_pref === option.value ? 'active' : ''}`}
              disabled={!entry}
              onClick={() =>
                entry && store.setEntryExtras(entry.uid, { start_pref: option.value })
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        <textarea
          className="g-note"
          aria-label="Anything the DJ should know"
          placeholder="A note for your DJ, e.g. the confetti drops at the second chorus…"
          value={entry?.note ?? ''}
          disabled={!entry}
          onChange={(event) =>
            entry && store.setEntryExtras(entry.uid, { note: event.target.value }, true)
          }
        />
      </div>
    </div>
  );
}

/* ------------------------------------------- 3 · second & third song (9c) */

export function SecondThirdScreen({ onSkip }: { onSkip: () => void }) {
  const store = useGuest();
  const entries = store.listOf('second_third');
  const second = entries.find((item) => item.position === 0);
  const third = entries.find((item) => item.position === 1);
  return (
    <div className="g-col">
      <h1 className="g-title">When the first dance ends, what plays next?</h1>
      <p className="g-lead">
        A second song, maybe a third. This is the moment everyone joins you on the floor.
      </p>
      <div className="g-body">
        {second ? (
          <SongCard
            entry={second}
            status="Second song"
            onRemove={() => store.removeEntry(second.uid)}
          />
        ) : (
          <SongSearch
            autoFocus
            placeholder="Search the second song…"
            search={store.search}
            searchAvailable={store.data?.search_available ?? false}
            onPick={(pick) => store.pickSong('second_third', 0, pick)}
          />
        )}

        {second &&
          (third ? (
            <div className="g-slot">
              <SongCard
                entry={third}
                status="Third song"
                onRemove={() => store.removeEntry(third.uid)}
              />
            </div>
          ) : (
            <>
              <div className="g-slot">
                <SongSearch
                  placeholder="And a third, if you like…"
                  search={store.search}
                  searchAvailable={store.data?.search_available ?? false}
                  onPick={(pick) => store.pickSong('second_third', 1, pick)}
                />
              </div>
              <button className="g-skip" onClick={onSkip}>
                Two is plenty →
              </button>
            </>
          ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------- 4 · their top 20 (9d) */

/** "eight to go" reads better than "8" on a page that is trying to be warm. */
const WORDS = [
  'none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty',
];
const spell = (n: number) => WORDS[n] ?? String(n);

export function TopTwentyScreen() {
  const store = useGuest();
  const count = store.listOf('couple_top20').length;
  return (
    <div className="g-col g-col-wide">
      <h1 className="g-title">The twenty songs that are so you.</h1>
      <p className="g-lead">
        Any order, any era. Type them in, your DJ weaves them through the night.
      </p>
      <div className="g-body">
        <SongTable kind="couple_top20" rows={20} canAdd canRemove canReorder />
      </div>
      <p className="songtable-count g-count">
        {count} of 20
        {count < 20 ? `, ${spell(20 - count)} to go` : ' — the list is complete'}
      </p>
    </div>
  );
}

/* --------------------------------------------------------- 5 · reveal (9e) */

const START_LABELS: Record<StartPref, string> = {
  top: 'from the top',
  chorus: 'from the chorus',
  fade: 'faded in',
};

export function RevealScreen() {
  const store = useGuest();
  const opening = store.listOf('opening_dance')[0];
  const secondThird = store.listOf('second_third');
  const top20 = store.listOf('couple_top20');
  const missing = 20 - top20.length;
  return (
    <div className="g-col g-col-wide g-col-center">
      <p className="g-eyebrow">Your top 20 · saved</p>
      <h1 className="g-title g-title-lg">What a beautiful twenty.</h1>
      <p className="g-lead">Read it back once. This is you two, in music.</p>

      {opening && (
        <>
          <p className="reveal-section">The opening</p>
          <RevealRow entry={opening} />
          <p className="reveal-line reveal-line-tight">
            played {opening.start_pref ? START_LABELS[opening.start_pref] : 'from the top'}
            {opening.note ? ` — “${opening.note}”` : ''}
          </p>
        </>
      )}

      {secondThird.length > 0 && (
        <>
          <p className="reveal-section">Then</p>
          {secondThird.map((entry) => (
            <RevealRow key={entry.uid} entry={entry} />
          ))}
        </>
      )}

      {top20.length > 0 ? (
        <>
          <div className="reveal-grid">
            {[
              top20.slice(0, Math.ceil(top20.length / 2)),
              top20.slice(Math.ceil(top20.length / 2)),
            ].map((half, column) => (
              <div className="reveal-col" key={column}>
                {half.map((entry) => (
                  <RevealRow key={entry.uid} entry={entry} />
                ))}
              </div>
            ))}
          </div>
          {missing > 0 && (
            <p className="reveal-line">
              and room for {spell(missing)} more, whenever they come to you
            </p>
          )}
        </>
      ) : (
        <p className="reveal-line">your top twenty is still a blank page — that's allowed</p>
      )}
    </div>
  );
}

/* -------------------------------------------- 6 · friends' top 20 (9f) */

export function FriendsScreen() {
  const store = useGuest();
  const link = store.data?.friends_link
    ? `${window.location.origin}${store.data.friends_link}`
    : '';
  // Friends fill this list from their own phones — keep it fresh while open.
  useEffect(() => {
    const timer = window.setInterval(() => void store.refresh(), 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const count = store.listOf('friends_top20').length;
  return (
    <div className="g-col g-col-wide">
      <h1 className="g-title">The twenty songs your friends can't sit down to.</h1>
      <p className="g-lead">
        Share one link, they type their picks, everything lands right here.
      </p>
      {link && <CopyLink url={link} />}
      <div className="g-body">
        <SongTable kind="friends_top20" rows={20} canAdd canRemove canReorder showSource />
      </div>
      <p className="songtable-count g-count">
        {count} of 20 · friends can add, only you two can remove or reorder
      </p>
    </div>
  );
}

/* ------------------------------------------------------ 7 · never list (9g) */

export function NeverScreen() {
  const store = useGuest();
  const blocklist = store.data?.blocklist ?? [];
  const rows = Math.max(blocklist.length + 2, 4);
  return (
    <div className="g-col">
      <h1 className="g-title">Which songs are banned from your dance floor, forever?</h1>
      <p className="g-lead">Every wedding has a few. No judgement, your DJ guards the door.</p>
      <div className="g-body">
        {/*
          Same ruled list as the top 20, but crossed out rather than numbered —
          these are the only lines on the whole flow that mean "not this".
        */}
        <div className="songtable songtable-single">
          {Array.from({ length: rows }, (_, index) => {
            const block = blocklist[index];
            return (
              <div
                key={block?.uid ?? `empty-${index}`}
                className={`songtable-row ${!block && index === blocklist.length ? 'filling' : ''}`}
              >
                <span className="songtable-cross" aria-hidden>
                  ✗
                </span>
                <span className="songtable-cell">
                  {block ? (
                    <>
                      <span className="songtable-value">
                        {block.title}
                        {block.artist && <span className="songtable-artist">, {block.artist}</span>}
                      </span>
                      <span className="songtable-actions">
                        <button
                          className="icon-btn"
                          aria-label="Allow this song again"
                          onClick={() => store.removeBlock(block.uid)}
                        >
                          <Close size={13} />
                        </button>
                      </span>
                    </>
                  ) : index === blocklist.length ? (
                    <SongSearch
                      compact
                      placeholder="Type the song you never want to hear…"
                      search={store.search}
                      searchAvailable={store.data?.search_available ?? false}
                      onPick={(pick) => store.addBlock(pick)}
                    />
                  ) : (
                    <span className="songtable-open" />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- 8 · finale (9h) */

export function FinaleScreen({ onFinish }: { onFinish: () => void }) {
  const store = useGuest();
  const data = store.data!;
  const links = store.listOf('playlist_links');
  const [url, setUrl] = useState('');
  const valid = /^https?:\/\//i.test(url.trim());

  function addLink() {
    if (!valid) return;
    const nextPosition = links.reduce((max, item) => Math.max(max, item.position), -1) + 1;
    store.pickSong('playlist_links', nextPosition, { free_text: url.trim() });
    setUrl('');
  }

  return (
    <div className="g-col">
      <h1 className="g-title">Okay, picture this.</h1>
      <p className="g-lead">
        You have been listening and talking to people the entire day. Your feet hurt, your
        cheeks ache from smiling. Which songs, even that exhausted, would you still scream
        and shout from the first word to the very last?
      </p>
      <div className="g-body">
        <SongTable kind="must_plays" rows={5} canAdd canRemove canReorder single />

        <label className="g-fieldlabel" htmlFor="g-briefing">
          And how do you two party? Tell it like a story, your DJ reads every line.
        </label>
        <textarea
          id="g-briefing"
          className="textarea"
          placeholder="Sweaty sing-alongs early in the night, hands-in-the-air classics when the parents leave, and after midnight it may get harder and faster…"
          value={data.briefing_text ?? ''}
          onChange={(event) => store.patchCouple({ briefing_text: event.target.value })}
        />

        <label className="g-fieldlabel" htmlFor="g-playlist">
          And if you have playlists that already sound like you, just drop the links.
        </label>
        <div className="g-linkrow">
          <input
            id="g-playlist"
            className="input"
            placeholder="Paste a Spotify playlist link…"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addLink();
            }}
          />
          <button className="btn" disabled={!valid} onClick={addLink}>
            Add link
          </button>
        </div>
        {links.length > 0 && (
          <div className="g-linkchips">
            {links.map((entry) => (
              <span key={entry.uid} className="g-linkchip">
                <a href={entry.free_text ?? '#'} target="_blank" rel="noreferrer">
                  {entry.free_text}
                </a>
                <button
                  className="icon-btn"
                  aria-label="Remove link"
                  onClick={() => store.removeEntry(entry.uid)}
                >
                  <Close size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="g-nav">
        <span />
        <button className="btn btn-primary" onClick={onFinish}>
          Finish your story
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 9 · done */

export function DoneScreen({ onReview }: { onReview: () => void }) {
  const store = useGuest();
  const data = store.data!;
  return (
    <div className="g-col g-col-center">
      <div className="g-done-mark" aria-hidden>
        ✓
      </div>
      <h1 className="g-title g-title-lg">That's your story, told.</h1>
      <p className="g-lead">
        Every answer is saved and already with your DJ. Come back to this same link any
        time before {data.wedding_date ? formatWeddingDate(data.wedding_date) : 'the wedding'} to
        change your mind.
      </p>
      <div className="g-welcome-cta">
        <button className="btn" onClick={onReview}>
          Read it back from the start →
        </button>
      </div>
    </div>
  );
}
