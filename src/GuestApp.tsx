import { useEffect, useState } from 'react';
import { formatWeddingDate } from './format';
import { SaveChip, SongTable } from './parts';
import {
  DoneScreen,
  FinaleScreen,
  FriendsScreen,
  NeverScreen,
  OpeningScreen,
  RevealScreen,
  SecondThirdScreen,
  TopTwentyScreen,
  WelcomeScreen,
} from './screens';
import { GuestProvider, useGuest, type LinkProblem } from './store';

/** The couple's eight pages, in the order they meet them (mockups 9a–9h). */
const STEPS = [
  'Welcome',
  'Opening dance',
  'Second & third',
  'Your top 20',
  'The reveal',
  "Friends' top 20",
  'Never list',
  'Finale',
];
const DONE_STEP = STEPS.length;

/**
 * The bar across the top of every page: their names on the left, the save
 * state on the right. There is no logo and no product name — the couple was
 * sent a link about their own wedding, not to a piece of software.
 */
function GuestHead({ names }: { names?: string }) {
  return (
    <header className="g-head">
      <span className="g-head-names">{names || ''}</span>
      {names !== undefined && <SaveChip />}
    </header>
  );
}

export function ProblemView({ problem }: { problem: LinkProblem }) {
  const title =
    problem.code === 'LINK_EXPIRED'
      ? 'This link has retired'
      : problem.code === 'LINK_REVOKED'
        ? 'This link is switched off'
        : problem.code === 'OFFLINE'
          ? "Can't reach the server"
          : "This link doesn't work";
  return (
    <div className="guest-shell">
      <GuestHead />
      <main className="g-main">
        <div className="g-col g-col-center g-problem">
          <h1 className="g-title">{title}</h1>
          <p className="g-lead">{problem.message}</p>
        </div>
      </main>
    </div>
  );
}

/** What a friend sees through the shared link: just the friends' top 20. */
function FriendsView() {
  const store = useGuest();
  const data = store.data!;
  // Other friends type at the same time — keep the shared table live.
  useEffect(() => {
    const timer = window.setInterval(() => void store.refresh(), 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const count = store.listOf('friends_top20').length;
  return (
    <div className="guest-shell">
      <GuestHead names={data.names} />
      <main className="g-main">
        <div className="g-col g-col-wide">
          <h1 className="g-title">
            The twenty songs {data.names || 'the couple'} can't sit down to.
          </h1>
          <p className="g-lead">
            You and their other friends share twenty spots
            {data.wedding_date ? ` for ${formatWeddingDate(data.wedding_date)}` : ''}. Type into any free line —
            everyone sees the list grow, and every pick is saved the moment you make it.
          </p>
          <div className="g-body">
            <SongTable
              kind="friends_top20"
              rows={20}
              canAdd
              canRemove={false}
              canReorder={false}
              showSource
            />
          </div>
          <p className="songtable-count g-count">
            {count} of 20
            {count >= 20 ? ' — every spot is taken 🎉' : ' · the couple keeps the final word'}
          </p>
        </div>
      </main>
    </div>
  );
}

function CoupleWizard({ token }: { token: string }) {
  const store = useGuest();
  const data = store.data!;
  const storageKey = `rm-guest-step:${token.slice(0, 12)}`;
  const [step, setStep] = useState(() => {
    const saved = Number(window.localStorage.getItem(storageKey));
    return Number.isInteger(saved) && saved >= 0 && saved <= DONE_STEP ? saved : 0;
  });
  useEffect(() => {
    window.localStorage.setItem(storageKey, String(step));
    window.scrollTo({ top: 0 });
  }, [step, storageKey]);

  const go = (next: number) => setStep(Math.max(0, Math.min(DONE_STEP, next)));

  /** What still blocks "Next" on this step, if anything. */
  function blockedHint(): string | null {
    if (step === 1 && store.listOf('opening_dance').length === 0) {
      return 'Choose your opening dance to continue.';
    }
    if (step === 2 && !store.listOf('second_third').some((entry) => entry.position === 0)) {
      return 'The second song is the one required pick here.';
    }
    return null;
  }
  const hint = blockedHint();

  const screen = [
    <WelcomeScreen key="welcome" onBegin={() => go(1)} />,
    <OpeningScreen key="opening" />,
    <SecondThirdScreen key="secondthird" onSkip={() => go(3)} />,
    <TopTwentyScreen key="top20" />,
    <RevealScreen key="reveal" />,
    <FriendsScreen key="friends" />,
    <NeverScreen key="never" />,
    <FinaleScreen key="finale" onFinish={() => go(DONE_STEP)} />,
    <DoneScreen key="done" onReview={() => go(0)} />,
  ][step];

  // The invitation carries its own "Begin", and the finale its own "Finish".
  const showNav = step > 0 && step < STEPS.length - 1;
  // The twenty-line tables and the reveal need the wider column; so does their nav.
  const wide = step === 3 || step === 4 || step === 5;

  /** The next page, named — the mockups promise what is coming, not "Next". */
  const nextLabel = [
    '',
    'Next: a second song, maybe a third →',
    'Next: your top twenty →',
    'Next →',
    'Continue →',
    'Next →',
    'Next →',
  ][step];

  return (
    <div className="guest-shell">
      <GuestHead names={data.names} />
      <main className="g-main">
        {screen}
        {showNav && (
          <div className={`g-col ${wide ? 'g-col-wide' : ''}`}>
            <div className="g-nav">
              <span className="g-nav-left">
                <button className="g-back" onClick={() => go(step - 1)}>
                  ← Back
                </button>
                {hint && <span className="g-nav-hint">{hint}</span>}
              </span>
              <button className="btn" disabled={hint !== null} onClick={() => go(step + 1)}>
                {nextLabel}
              </button>
            </div>
          </div>
        )}
      </main>
      {step < DONE_STEP && (
        <nav className="g-progress" aria-label="Steps">
          {STEPS.map((label, index) => (
            <button
              key={label}
              className={`g-dot ${index === step ? 'active' : ''} ${index < step ? 'seen' : ''}`}
              title={label}
              aria-label={`${label} (step ${index + 1} of ${STEPS.length})`}
              aria-current={index === step ? 'step' : undefined}
              onClick={() => go(index)}
            />
          ))}
        </nav>
      )}
    </div>
  );
}

function GuestInner({ token }: { token: string }) {
  const store = useGuest();
  if (store.problem) return <ProblemView problem={store.problem} />;
  if (!store.data) {
    return (
      <div className="guest-shell">
        <GuestHead />
        <main className="g-main">
          <div className="g-col g-col-center">
            <p className="g-lead">Loading…</p>
          </div>
        </main>
      </div>
    );
  }
  return store.data.scope === 'friends' ? <FriendsView /> : <CoupleWizard token={token} />;
}

/** Everything behind a magic link (`/g/<token>`) — couple wizard or friends view. */
export function GuestApp({ token }: { token: string }) {
  return (
    <GuestProvider token={token}>
      <GuestInner token={token} />
    </GuestProvider>
  );
}
