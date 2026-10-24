import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useMatch } from 'react-router-dom';
import { SERVICE_NAME } from '../hooks/useDocumentTitle';

const NAV_ITEMS = [
  { to: '/tasks', label: 'Tasks' },
  { to: '/tasks/new', label: 'Create a task' },
];

/** https://design-system.service.gov.uk/components/service-navigation/ */
const NavItem = ({ to, label }: { to: string; label: string }) => {
  const isActive = useMatch({ path: to, end: true }) !== null;
  return (
    <li
      className={`govuk-service-navigation__item${isActive ? ' govuk-service-navigation__item--active' : ''}`}
    >
      <Link
        className="govuk-service-navigation__link"
        to={to}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* Bold fallback keeps the current item visible when colours are overridden. */}
        {isActive ? (
          <strong className="govuk-service-navigation__active-fallback">{label}</strong>
        ) : (
          label
        )}
      </Link>
    </li>
  );
};

/**
 * In a single-page app the browser does not reset focus on navigation, so
 * screen reader users would not hear that the page changed. Move focus to the
 * new page's h1 (waiting for it if the page is still loading) unless something
 * on the page, such as an error summary or banner, has already taken focus.
 */
const useFocusMainHeadingOnNavigate = (main: React.RefObject<HTMLElement | null>) => {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const container = main.current;
    if (!container) return;

    const tryFocus = () => {
      if (container.contains(document.activeElement)) return true;
      const heading = container.querySelector('h1');
      if (!heading) return false;
      heading.setAttribute('tabindex', '-1');
      heading.focus();
      return true;
    };
    if (tryFocus()) return;

    const observer = new MutationObserver(() => {
      if (tryFocus()) observer.disconnect();
    });
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname, main]);
};

export const Layout = () => {
  const main = useRef<HTMLElement>(null);
  useFocusMainHeadingOnNavigate(main);

  return (
    <>
      <a
        href="#main-content"
        className="govuk-skip-link"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to main content
      </a>

      {/* Generic header: this service is not on GOV.UK, so no crown or GOV.UK logotype. */}
      <header className="govuk-generic-header">
        <div className="govuk-generic-header__container govuk-width-container">
          <div className="govuk-generic-header__logo">
            <Link to="/tasks" className="govuk-generic-header__homepage-link">
              HM Courts &amp; Tribunals Service
            </Link>
          </div>
        </div>
      </header>

      <section className="govuk-service-navigation" aria-label="Service information">
        <div className="govuk-width-container">
          <div className="govuk-service-navigation__container">
            <span className="govuk-service-navigation__service-name">
              <Link to="/tasks" className="govuk-service-navigation__link">
                {SERVICE_NAME}
              </Link>
            </span>
            <nav aria-label="Menu" className="govuk-service-navigation__wrapper">
              <ul className="govuk-service-navigation__list">
                {NAV_ITEMS.map((item) => (
                  <NavItem key={item.to} to={item.to} label={item.label} />
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </section>

      <div className="govuk-width-container">
        <main className="govuk-main-wrapper" id="main-content" tabIndex={-1} ref={main}>
          <Outlet />
        </main>
      </div>

      <footer className="govuk-footer">
        <div className="govuk-width-container">
          <div className="govuk-footer__meta">
            <div className="govuk-footer__meta-item govuk-footer__meta-item--grow">
              <h2 className="govuk-visually-hidden">Support links</h2>
              <ul className="govuk-footer__inline-list">
                <li className="govuk-footer__inline-list-item">
                  <a className="govuk-footer__link" href="/api-docs">
                    API documentation
                  </a>
                </li>
                <li className="govuk-footer__inline-list-item">
                  <a className="govuk-footer__link" href="https://github.com/Trojan9/hmct">
                    Source code
                  </a>
                </li>
              </ul>
              <span className="govuk-footer__licence-description">
                Built for the HMCTS DTS developer technical test.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
