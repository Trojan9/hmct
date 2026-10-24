import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface FlashState {
  flash?: string;
}

/**
 * Message to show once on the next page, for example "Task created".
 * It is cleared from history straight away so a refresh or the back button
 * does not show it again, and it is dropped when the page's query changes.
 */
export const useFlashMessage = (): string | undefined => {
  const { pathname, search, state } = useLocation();
  const navigate = useNavigate();
  const incoming = (state as FlashState | null)?.flash;
  const [message, setMessage] = useState(incoming);
  const [shownFor, setShownFor] = useState(search);

  if (incoming && incoming !== message) setMessage(incoming);
  if (search !== shownFor) {
    setShownFor(search);
    if (!incoming) setMessage(undefined);
  }

  useEffect(() => {
    if (incoming) navigate({ pathname, search }, { replace: true, state: null });
  }, [incoming, navigate, pathname, search]);

  return message;
};

export const useNavigateWithFlash = () => {
  const navigate = useNavigate();
  return (to: string, flash: string) => navigate(to, { state: { flash } satisfies FlashState });
};
