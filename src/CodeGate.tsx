import { useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, GuestApi } from './api';

/**
 * The one screen between the link and the intake.
 *
 * The link itself is the security boundary — 256 bits of randomness, and
 * anyone holding it holds it. The code is here for something narrower and
 * quite practical: a link forwarded into a family group chat should not open
 * by itself for forty relatives, and the couple should feel that the page is
 * theirs, because that changes what they are willing to put on a never list.
 *
 * It is not a second factor and is not described to anyone as one. Two initials
 * and a date the holder of the invitation already knows is on the order of ten
 * to nineteen bits.
 */
export function CodeGate({
  api,
  onOpen,
}: {
  api: GuestApi;
  onOpen: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.openSession(code.trim());
      onOpen();
    } catch (caught) {
      setError(messageFor(caught));
      setBusy(false);
    }
  }

  return (
    <div className="guest-shell">
      <header className="g-head">
        <span className="g-head-names" />
      </header>
      <main className="g-main">
        <div className="g-col g-col-center">
          <h1 className="g-title">Just checking it's you.</h1>
          <p className="g-lead">
            Type both your initials and your wedding date — the code on the card your
            planner gave you. For Emma &amp; Julian on 14 June 2027 that is{' '}
            <strong>EJ14062027</strong>.
          </p>

          <form onSubmit={submit} className="g-body g-gate">
            <label className="g-gate-label" htmlFor="access-code">
              YOUR CODE
            </label>
            <input
              id="access-code"
              className="g-gate-input"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="EJ14062027"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'access-code-error' : undefined}
            />
            {error && (
              <p className="g-gate-error" id="access-code-error" role="alert">
                {error}
              </p>
            )}
            {/*
              .btn, not .btn-primary: base.css reserves the solid ink pill for
              the one button that ends the journey.
            */}
            <button className="btn g-gate-button" type="submit" disabled={busy || !code.trim()}>
              {busy ? 'Checking…' : 'Open our page'}
            </button>
            <p className="g-gate-note">
              Spaces, dots and slashes don't matter, and either initial can come first.
              We'll remember this device.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'CODE_LOCKED':
        // The server locks the portal after repeated failures, and says for how
        // long in its message — better to pass that through than to guess.
        return error.message;
      case 'LINK_REVOKED':
        return 'That code is right, but this link has been switched off. Ask your DJ for a new one.';
      case 'LINK_EXPIRED':
        return 'This link has retired — the wedding has been and gone.';
      case 'BAD_LINK':
        // Deliberately vague, because the server is deliberately vague: an
        // unknown link, a switched-off link and a wrong code all answer the
        // same, so this cannot be used to find out which links exist.
        return "That code doesn't match this link. Check the card and try again.";
      default:
        return error.message;
    }
  }
  return 'Could not reach the server. Check your connection and try again.';
}
