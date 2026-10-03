import { useEffect, useState, memo } from 'react';
import { Columns2, Menu, MoonStar, Printer, Save, SunMedium, Undo2 } from 'lucide-react';
import { copy, RACE_DESK_NAV, SITE_NAV } from '../../copy';
import { formatCountdown, pickNextMeeting } from './nextMeeting';
import { ToolbarButton } from './shared';

type Props = {
  presetName: string;
  presetNames: string[];
  splitMode: boolean;
  embedMode: boolean;
  themeMode: 'dark' | 'light';
  openDashboardUrl: string;
  heroSubtitle: string;
  nextMeeting: ReturnType<typeof pickNextMeeting>;
  onPresetNameChange: (value: string) => void;
  onSavePreset: () => void;
  onPrint: () => void;
  onToggleSplit: () => void;
  onToggleTheme: () => void;
  onBack: () => void;
};

function NavCountdown({ meeting }: { meeting: Props['nextMeeting'] }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  if (!meeting || meeting.start <= now) return null;
  return (
    <div className="nav-countdown">
      <span className="nav-countdown-name">{meeting.name}</span>
      <span className="nav-countdown-time">{formatCountdown(meeting.start - now)}</span>
    </div>
  );
}

function SiteLinks() {
  return SITE_NAV.map((link) => (
    <a key={link.label} href={link.href} className={'current' in link ? 'is-current' : undefined} aria-current={'current' in link ? 'page' : undefined} {...('external' in link ? { target: '_blank', rel: 'noopener' } : {})}>{link.label}</a>
  ));
}

export const DashboardHeader = memo(function DashboardHeader({
  presetName, presetNames, splitMode, embedMode, themeMode,
  openDashboardUrl, heroSubtitle, nextMeeting, onPresetNameChange,
  onSavePreset, onPrint, onToggleSplit, onToggleTheme, onBack,
}: Props) {
  // Theme is a visual preference: announce it to assistive tech without adding a visible line that moves the page.
  const [themeAnnouncement, setThemeAnnouncement] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleTheme = () => {
    setThemeAnnouncement(themeMode === 'light' ? copy.masthead.themeOnDark : copy.masthead.themeOnLight);
    onToggleTheme();
  };

  // Embeds carry one slim line: wordmark, what is shown, and the way back to the full analysis.
  if (embedMode) {
    return (
      <header className="embed-bar">
        <a href="https://f1stories.gr/" className="brand" aria-label={copy.masthead.homeAria}><span className="brand-wordmark">F1 STORIES<span>.</span></span></a>
        <h1 className="embed-bar-title">{heroSubtitle}</h1>
        <a className="embed-bar-open" href={openDashboardUrl} target="_blank" rel="noreferrer">{copy.embed.open}</a>
      </header>
    );
  }

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="F1 Stories" onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        const menu = event.currentTarget.querySelector<HTMLDetailsElement>('details[open]');
        if (menu) { menu.open = false; menu.querySelector('summary')?.focus(); }
      }}>
        <div className="page-shell site-nav-inner">
          <a href="https://f1stories.gr/" className="brand" aria-label={copy.masthead.homeAria}><img src={`${import.meta.env.BASE_URL}logo-nav.webp`} alt="" width="38" height="38" decoding="async" /><span className="brand-wordmark">F1 STORIES<span>.</span></span></a>
          <div className="site-nav-links"><SiteLinks /></div>
          <div className="site-nav-right">
            <NavCountdown meeting={nextMeeting} />
            <button className="theme-toggle" aria-label={themeMode === 'light' ? copy.masthead.themeToDark : copy.masthead.themeToLight} onClick={toggleTheme}>{themeMode === 'light' ? <MoonStar size={17} /> : <SunMedium size={17} />}</button>
            <span className="sr-only" role="status">{themeAnnouncement}</span>
            <details className="utility-menu" name="site-header-menu">
              <summary><span aria-hidden="true">⋯</span><span className="sr-only">{copy.masthead.tools}</span></summary>
              <div className="utility-content">
                <div className="utility-actions">
                  <ToolbarButton icon={<Undo2 size={15} />} label={copy.masthead.back} onClick={onBack} />
                  <ToolbarButton icon={<Printer size={15} />} label={copy.masthead.print} onClick={onPrint} />
                  <ToolbarButton icon={<Columns2 size={15} />} label={copy.masthead.split} onClick={onToggleSplit} active={splitMode} />
                </div>
                <label className="field-label" htmlFor="preset-name">{copy.masthead.presetLabel}</label>
                <div className="preset-controls">
                  <input id="preset-name" list="dashboard-preset-names" value={presetName} onChange={(event) => onPresetNameChange(event.target.value)} placeholder={copy.masthead.presetPlaceholder} className="dashboard-input" />
                  <datalist id="dashboard-preset-names">{presetNames.map((name) => <option key={name} value={name} />)}</datalist>
                  <ToolbarButton icon={<Save size={15} />} label={copy.masthead.save} onClick={onSavePreset} />
                </div>
              </div>
            </details>
            <details className="nav-mobile" name="site-header-menu" onToggle={(event) => setMobileMenuOpen(event.currentTarget.open)}>
              <summary aria-label={copy.masthead.menu} aria-controls="site-mobile-links" aria-expanded={mobileMenuOpen}><Menu size={20} aria-hidden="true" /></summary>
              <div className="nav-mobile-panel" id="site-mobile-links" onClick={(event) => {
                if ((event.target as HTMLElement).closest('a')) event.currentTarget.closest('details')?.removeAttribute('open');
              }}><SiteLinks /></div>
            </details>
          </div>
        </div>
      </nav>
      <div className="hero">
        <div className="page-shell">
          <div className="kicker-row">
            <span className="kicker">{copy.hero.kicker}</span>
            <nav className="race-desk-nav" aria-label="Race Desk" lang="en">
              {RACE_DESK_NAV.map((link) => <a key={link.label} href={link.href} aria-current={'current' in link ? 'page' : undefined}>{link.label}</a>)}
            </nav>
          </div>
          <div className="hero-grid">
            <div>
              <h1 className="display"><span lang="en">{copy.hero.title}<span className="dot">.</span></span><span className="display-descriptor">{copy.hero.descriptor}</span></h1>
              <h2 className="hero-subtitle">{heroSubtitle}</h2>
            </div>
            <aside className="hero-aside"><strong>{copy.hero.tagline}</strong><p>{copy.hero.taglineBody}</p></aside>
          </div>
        </div>
      </div>
    </header>
  );
});
