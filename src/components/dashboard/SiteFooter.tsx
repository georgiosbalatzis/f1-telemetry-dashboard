import { copy, SITE_FOOTER_LINKS, SITE_LEGAL } from '../../copy';

/** Colophon matching f1stories.gr/partials/footer.html. */
export function SiteFooter() {
  return (
    <footer className="colophon">
      <div className="page-shell">
        <div className="colophon-brand"><a href={SITE_LEGAL.home} className="brand-wordmark">F1 STORIES<span>.</span></a><p>{copy.footer.tagline}</p></div>
        <nav className="colophon-links" aria-label="F1 Stories">
          {SITE_FOOTER_LINKS.map((link) => <a key={link.label} href={link.href} {...('external' in link ? { target: '_blank', rel: 'noopener' } : {})}>{link.label}</a>)}
        </nav>
        <div className="colophon-meta">
          <span>{copy.footer.rights}</span>
          <span><a href="https://openf1.org/" target="_blank" rel="noreferrer">{copy.footer.credit} ↗</a></span>
        </div>
        <div className="colophon-legal"><a href={SITE_LEGAL.privacy}>{copy.footer.privacy}</a><a href={SITE_LEGAL.terms}>{copy.footer.terms}</a></div>
      </div>
    </footer>
  );
}
