import { useEffect, useState } from 'react';
import { Columns2, Loader2, Menu, MoonStar, Printer, Save, SunMedium, Undo2 } from 'lucide-react';
import { copy, SITE_NAV } from '../../copy';
import { formatCountdown, pickNextMeeting } from './nextMeeting';
import { ToolbarButton } from './shared';

type EmbedContextChip = {
  label: string;
  value: string;
};

type Props = {
  loading: boolean;
  presetName: string;
  presetNames: string[];
  feedback: string | null;
  splitMode: boolean;
  embedMode: boolean;
  themeMode: 'dark' | 'light';
  embedTitle: string;
  embedSubtitle: string;
  embedContext: EmbedContextChip[];
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
    <a key={link.label} href={link.href} className={'current' in link ? 'is-current' : undefined} {...('external' in link ? { target: '_blank', rel: 'noopener' } : {})}>{link.label}</a>
  ));
}

export function DashboardHeader({
  loading, presetName, presetNames, feedback, splitMode, embedMode, themeMode,
  embedTitle, embedSubtitle, embedContext, openDashboardUrl, heroSubtitle, nextMeeting, onPresetNameChange,
  onSavePreset, onPrint, onToggleSplit, onToggleTheme, onBack,
}: Props) {
  // Theme is a visual preference: announce it to assistive tech without adding a visible line that moves the page.
  const [themeAnnouncement, setThemeAnnouncement] = useState('');
  const toggleTheme = () => {
    setThemeAnnouncement(themeMode === 'light' ? copy.masthead.themeOnDark : copy.masthead.themeOnLight);
    onToggleTheme();
  };

  // Embeds keep the compact lockup until the embed rework (Phase 7).
  if (embedMode) {
    return (
      <header className="masthead">
        <div className="masthead-row">
          <a href="https://f1stories.gr/" className="brand" aria-label="F1 Stories home"><img src={`${import.meta.env.BASE_URL}logo192.png`} alt="" /><span className="brand-wordmark">F1 STORIES<span>.</span></span></a>
          <span className="product-name">TELEMETRY</span>
          <a className="text-action masthead-tools" href={openDashboardUrl} target="_blank" rel="noreferrer">Open analysis ↗</a>
        </div>
        <div className="session-heading">
          <div>
            <p className="section-label">Data hub / Race analysis</p>
            <h1>{embedTitle}</h1>
            <p className="session-edition">{embedSubtitle.replace(' view', '')} · {embedContext.filter((item) => item.label !== 'View').map((item) => `${item.label} ${item.value}`).join(' · ')}</p>
          </div>
          <p className="session-status" role="status">{feedback || (loading ? <><Loader2 size={12} className="animate-spin" /> Loading session…</> : null)}</p>
        </div>
      </header>
    );
  }

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="F1 Stories">
        <div className="page-shell site-nav-inner">
          <a href="https://f1stories.gr/" className="brand" aria-label={copy.masthead.homeAria}><img src={`${import.meta.env.BASE_URL}logo192.png`} alt="" /><span className="brand-wordmark">F1 STORIES<span>.</span></span></a>
          <div className="site-nav-links"><SiteLinks /></div>
          <div className="site-nav-right">
            <NavCountdown meeting={nextMeeting} />
            <button className="theme-toggle" aria-label={themeMode === 'light' ? copy.masthead.themeToDark : copy.masthead.themeToLight} onClick={toggleTheme}>{themeMode === 'light' ? <MoonStar size={17} /> : <SunMedium size={17} />}</button>
            <span className="sr-only" role="status">{themeAnnouncement}</span>
            <details className="utility-menu">
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
            <details className="nav-mobile">
              <summary aria-label={copy.masthead.menu}><Menu size={20} aria-hidden="true" /></summary>
              <div className="nav-mobile-panel"><SiteLinks /></div>
            </details>
          </div>
        </div>
      </nav>
      <div className="hero">
        <div className="page-shell">
          <div className="kicker-row"><span className="kicker">{copy.hero.kickerLeft}</span><span className="kicker">{copy.hero.kickerRight}</span></div>
          <div className="hero-grid">
            <div>
              <h1 className="display">{copy.hero.title}<span className="dot">.</span></h1>
              <h2 className="hero-subtitle">{heroSubtitle}</h2>
            </div>
            <aside className="hero-aside"><strong>{copy.hero.tagline}</strong><p>{copy.hero.taglineBody}</p></aside>
          </div>
        </div>
      </div>
    </header>
  );
}
