import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GuestApp, ProblemView } from './GuestApp';
import './styles/tokens.css';
import './styles/base.css';
import './styles/guest.css';

// Magic links land on /g/<token>: the token in the path *is* the login, so
// there is exactly one route and no router dependency.
const match = window.location.pathname.match(/^\/g\/([^/]+)\/?$/);

const NO_TOKEN = {
  status: 404,
  code: 'LINK_INCOMPLETE',
  message: 'Open the full link your DJ sent you — it ends in /g/ and then a long code.',
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {match ? (
      <GuestApp token={decodeURIComponent(match[1])} />
    ) : (
      <ProblemView problem={NO_TOKEN} />
    )}
  </StrictMode>,
);
