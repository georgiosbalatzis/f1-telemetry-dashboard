// UI strings live here (Greek; F1 terms stay English, as on f1stories.gr). Components migrate in as each rework phase touches them.
export const copy = {
  locale: 'el-GR',
  tabs: {
    telemetry: 'Τηλεμετρία',
    tires: 'Ελαστικά',
    energy: 'DRS & RPM',
    trackmap: 'Track Map',
    positions: 'Θέσεις',
    intervals: 'Intervals',
    radio: 'Team Radio',
    incidents: 'Race Control',
    weather: 'Καιρός',
    broadcast: 'Broadcast',
  },
  skipToContent: 'Μετάβαση στο περιεχόμενο',
  masthead: {
    homeAria: 'F1 Stories, αρχική σελίδα',
    menu: 'Μενού',
    tools: 'Εργαλεία',
    themeToLight: 'Φωτεινό θέμα',
    themeToDark: 'Σκούρο θέμα',
    themeOnLight: 'Φωτεινό θέμα ενεργό',
    themeOnDark: 'Σκούρο θέμα ενεργό',
    back: 'Πίσω',
    share: 'Κοινοποίηση',
    embed: 'Ενσωμάτωση',
    print: 'Εκτύπωση',
    split: 'Διπλή προβολή',
    presetLabel: 'Αποθήκευση ή φόρτωση σύγκρισης',
    presetPlaceholder: 'Όνομα σύγκρισης',
    save: 'Αποθήκευση',
    nextSession: 'Επόμενο GP',
  },
  hero: {
    kickerLeft: 'F1 Stories / Race Desk',
    kickerRight: 'Τηλεμετρία & ανάλυση γύρου',
    title: 'Telemetry',
    tagline: 'Κάθε γύρος, μια ιστορία.',
    taglineBody: 'Ταχύτητα, φρένα, sectors και στρατηγική για κάθε οδηγό. Σύγκρινε έως τέσσερις.',
    lap: (lap: number, total: number) => (total > 0 ? `Γύρος ${lap} από ${total}` : `Γύρος ${lap}`),
  },
  band: {
    live: 'Live δεδομένα · OpenF1',
    lap: (lap: number, total: number) => (total > 0 ? `Γύρος ${lap} / ${total}` : `Γύρος ${lap}`),
    slogan: 'Every tenth counts.',
    loading: 'Φόρτωση συνεδρίας…',
    partial: (loaded: number, total: number) => `${loaded} / ${total} οδηγοί φορτώθηκαν`,
    retry: (name: string) => `Επανάληψη ${name}`,
  },
  footer: {
    tagline: 'Τεχνική ανάλυση, άποψη και ελληνική F1 κοινότητα.',
    credit: 'Δεδομένα από OpenF1',
    rights: '© 2026 F1 Stories. Με επιφύλαξη παντός δικαιώματος.',
    privacy: 'Πολιτική Απορρήτου',
    terms: 'Όροι Χρήσης',
  },
} as const;

// Mirrors f1StoriesPage/partials/nav.html. If the site nav changes, update this list too.
const SITE = 'https://f1stories.gr';
export const SITE_NAV = [
  { label: 'Αρχική', href: `${SITE}/` },
  { label: 'Άρθρα', href: `${SITE}/blog-module/blog/index.html` },
  { label: 'YouTube', href: 'https://www.youtube.com/@f1_stories_original', external: true },
  { label: 'Βαθμολογία', href: `${SITE}/standings/` },
  { label: 'Δεδομένα', href: `${SITE}/standings/?tab=tyre-pace`, current: true }, // Telemetry is part of the Data Hub
  { label: 'Συντάκτες', href: `${SITE}/authors/` },
  { label: 'BetCast', href: 'https://georgiosbalatzis.github.io/BetCastVisualisation/', external: true },
] as const;

// Footer links from f1StoriesPage/partials/footer.html.
export const SITE_FOOTER_LINKS = [
  { label: 'Άρθρα', href: `${SITE}/blog-module/blog/index.html` },
  { label: 'Βαθμολογία', href: `${SITE}/standings/` },
  { label: 'Συντάκτες', href: `${SITE}/authors/` },
  { label: 'YouTube ↗', href: 'https://www.youtube.com/@f1_stories_original', external: true },
  { label: 'BetCast ↗', href: 'https://georgiosbalatzis.github.io/BetCastVisualisation/', external: true },
] as const;
export const SITE_LEGAL = { home: `${SITE}/`, privacy: `${SITE}/privacy/privacy.html`, terms: `${SITE}/privacy/terms.html` } as const;
