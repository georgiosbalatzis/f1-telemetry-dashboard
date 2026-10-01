import { copy, SITE_FOOTER_LINKS, SITE_LEGAL, SITE_SOCIAL_LINKS } from '../../copy';

// Matches the homepage partner strip, including its order and relationship labels.
const sponsors = [
  { logo: 'Balatzis', name: 'Μπαλατζής Χωματουργικά', href: 'https://balatzis.gr/', relation: 'ΧΟΡΗΓΟΣ' },
  { logo: 'ps', name: 'Πουρτσίδης Γεννήτριες', href: 'https://pourtsidisgenerators.gr/', relation: 'ΣΥΝΕΡΓΑΤΗΣ' },
  { logo: 'BalatzisDomika', name: 'Μπαλατζής Δομικά', href: 'https://balatzis.gr/#domika', relation: 'POWERED BY' },
  { logo: 'am', name: 'Αμβροσιάδης', href: 'https://ambrosiadis.gr/', relation: 'ΣΥΝΕΡΓΑΤΗΣ' },
  { logo: 'bedhome', name: 'Bed and Home', href: 'https://www.bedandhome.gr/', relation: 'ADVERTISING PARTNER' },
  { logo: 'GrandRealm', name: 'Grand Realm', href: 'https://www.grandrealm.gr/', relation: 'ΣΥΝΕΡΓΑΤΗΣ' },
];
const sponsorAssets = `${import.meta.env.BASE_URL}images/sponsors/normalized/`;

/** Homepage partners followed by the canonical F1Stories colophon. */
export function SiteFooter() {
  return (
    <>
    <section className="sponsor-strip" aria-labelledby="sponsors-heading">
      <div className="page-shell sponsor-strip-layout">
        <h2 className="sponsor-strip-label" id="sponsors-heading">ΜΑΖΙ ΣΤΗΝ ΕΚΚΙΝΗΣΗ</h2>
        <ul className="sponsor-logos">
          {sponsors.map(sponsor => <li key={sponsor.logo}>
            <a href={sponsor.href} target="_blank" rel="noopener sponsored" className="sponsor-logo">
              <img src={`${sponsorAssets}${sponsor.logo}.webp`} srcSet={`${sponsorAssets}${sponsor.logo}-1x.webp 1x, ${sponsorAssets}${sponsor.logo}.webp 2x`} alt={sponsor.name} loading="lazy" decoding="async" width="320" height="160" />
              <span>{sponsor.relation}</span>
            </a>
          </li>)}
        </ul>
      </div>
    </section>
    <footer className="colophon">
      <div className="page-shell">
        <div className="colophon-brand"><a href={SITE_LEGAL.home} className="brand-wordmark" aria-label={copy.masthead.homeAria}>F1 STORIES<span>.</span></a><p>{copy.footer.tagline}</p></div>
        <nav className="colophon-links" aria-label="Ενότητες">
          {SITE_FOOTER_LINKS.map((link) => <a key={link.label} href={link.href} {...('external' in link ? { target: '_blank', rel: 'noopener' } : {})}>{link.label}</a>)}
        </nav>
        <div className="colophon-meta">
          <span>{copy.footer.rights}</span>
          <span><a href="https://openf1.org/" target="_blank" rel="noreferrer">{copy.footer.credit} ↗</a></span>
        </div>
        <div className="colophon-social">
          {SITE_SOCIAL_LINKS.map((link) => <a key={link.icon} href={link.href} aria-label={link.label} {...(link.href.startsWith('https:') ? { target: '_blank', rel: 'noopener' } : {})}><svg width="20" height="20" aria-hidden="true"><use href={`${import.meta.env.BASE_URL}f1stories-social.svg#${link.icon}`} /></svg></a>)}
        </div>
        <div className="colophon-legal"><a href={SITE_LEGAL.privacy}>{copy.footer.privacy}</a><a href={SITE_LEGAL.terms}>{copy.footer.terms}</a></div>
      </div>
    </footer>
    </>
  );
}
