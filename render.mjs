/**
 * Pure renderer for sifa-academicpages. No fs, no fetch -> importable by both
 * this Node build harness and the sifa-web `/academic` route (one codebase).
 *
 * Layout matches academicpages.github.io: a top masthead with horizontal nav
 * (no site title, to leave room for menu items), a left sidebar with avatar /
 * identity / links shown as content, main content, and a Sifa-branded footer.
 *
 * `profile` is the SDK `Profile` (structured identity). `sections` come from the
 * `.md` export. `ctx` carries build/request metadata (year, last-updated date).
 */

import { marked } from 'marked';

// --- .md parsing ------------------------------------------------------------

export function parseSections(md) {
  const lines = md.split('\n');
  const sections = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(/^## (.+)$/);
    if (m) {
      current = { title: m[1].trim(), body: [] };
      sections.push(current);
    } else if (current) {
      current.body.push(line);
    }
  }
  return sections.map((s) => ({ ...s, body: s.body.join('\n').trim() })).filter((s) => s.body);
}

export function sectionSlug(title) {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The "Links" section is rendered in the sidebar, not as its own page. */
export function isSidebarOnly(title) {
  return title.toLowerCase() === 'links';
}

// --- identity helpers -------------------------------------------------------

function locationLine(profile) {
  const loc = profile?.location;
  const flat = [
    profile?.locationLocality ?? profile?.locationCity ?? loc?.locality ?? loc?.city,
    profile?.locationRegion ?? loc?.region,
    profile?.locationCountry ?? loc?.country,
  ].filter(Boolean);
  return flat.length ? flat.join(', ') : null;
}

function navItems(sections, activeSlug) {
  return sections
    .filter((s) => !isSidebarOnly(s.title))
    .map((s) => {
      const isAbout = s.title.toLowerCase() === 'about';
      const href = isAbout ? 'index.html' : `${sectionSlug(s.title)}.html`;
      const active = isAbout ? activeSlug === 'index' : sectionSlug(s.title) === activeSlug;
      return `<a href="${href}"${active ? ' aria-current="page" class="active"' : ''}>${escapeHtml(s.title)}</a>`;
    })
    .join('\n');
}

// --- render: masthead (top nav) --------------------------------------------

function masthead(sections, activeSlug) {
  return `<header class="masthead">
  <div class="masthead-inner">
    <nav class="top-nav">${navItems(sections, activeSlug)}\n    </nav>
    <div class="masthead-actions">
      <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode" type="button">${svgSun()}${svgMoon()}</button>
      <a class="sifa-logo" href="https://sifa.id" title="Built with Sifa" target="_blank" rel="noopener">
        <img class="brand-logo brand-logo-light" src="assets/sifa-logo.svg" alt="Sifa" height="22">
        <img class="brand-logo brand-logo-dark" src="assets/sifa-logo-dark.svg" alt="Sifa" height="22">
      </a>
    </div>
  </div>
</header>`;
}

// --- render: sidebar (identity + links) ------------------------------------

function sidebar(profile) {
  const handle = profile?.handle ?? '';
  const name = profile?.displayName ?? handle ?? 'Profile';

  const avatar = profile?.avatar
    ? `<img src="${profile.avatar}" alt="" class="avatar">`
    : `<div class="avatar avatar-placeholder">${escapeHtml(name).slice(0, 1)}</div>`;

  const headline = profile?.headline ? `<p class="meta-line">${escapeHtml(profile.headline)}</p>` : '';
  const loc = locationLine(profile);
  const locHtml = loc ? `<p class="meta-line">${escapeHtml(loc)}</p>` : '';

  // Links shown as content (label + host), not as icon buttons.
  const linkEntries = [
    profile?.website ? { label: 'Website', url: profile.website } : null,
    ...(profile?.externalAccounts ?? []).map((a) => ({
      label: a.label ?? a.platform ?? 'Link',
      url: a.url ?? '',
    })),
  ]
    .filter((e) => e && e.url)
    .map((e) => {
      const host = e.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      return `<a class="side-link" href="${e.url}" rel="me noopener" target="_blank"><span class="side-link-label">${escapeHtml(e.label)}</span><span class="side-link-host">${escapeHtml(host)}</span></a>`;
    })
    .join('');
  const linksHtml = linkEntries ? `<div class="side-links">${linkEntries}</div>` : '';

  return `<aside class="sidebar">
  ${avatar}
  <h1 class="sidebar-name">${escapeHtml(name)}</h1>
  ${handle ? `<p class="sidebar-handle">@${escapeHtml(handle)}</p>` : ''}
  ${headline}
  ${locHtml}
  ${linksHtml}
</aside>`;
}

// --- render: layout ---------------------------------------------------------

function layout({ title, profile, sections, activeSlug, main, ctx }) {
  const handle = profile?.handle ?? '';
  const name = profile?.displayName ?? handle ?? 'Profile';
  const year = ctx?.year ?? '';
  const updated = ctx?.updated ?? '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://cdn.bsky.app">
  <link rel="stylesheet" href="style.css">
  <script>(function(){try{var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();</script>
</head>
<body>
  ${masthead(sections, activeSlug)}
  <div class="shell">
    ${sidebar(profile)}
    <main class="main">
${main}
    </main>
  </div>
  <footer class="site-footer">
    <div class="footer-left">
      <div class="footer-brand">
        <img class="brand-logo brand-logo-light" src="assets/sifa-logo.svg" alt="Sifa" height="20">
        <img class="brand-logo brand-logo-dark" src="assets/sifa-logo-dark.svg" alt="Sifa" height="20">
      </div>
      <div class="footer-meta">
        ${year ? `<span>&copy; ${year} ${escapeHtml(name)}</span>` : ''}
        ${updated ? `<span class="footer-updated">Site last updated ${escapeHtml(updated)}</span>` : ''}
      </div>
    </div>
    <div class="footer-links">
      <a href="https://sifa.id/p/${encodeURIComponent(handle)}">View ${escapeHtml(name)}'s full Sifa ID</a>
      <a href="https://sifa.id">Claim your own profile</a>
      <a href="https://github.com/singi-labs/sifa-academicpages">Self-host your own Sifa ID-driven page like this</a>
    </div>
  </footer>
  <script>document.getElementById('theme-toggle').addEventListener('click',function(){var t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('theme',t);}catch(e){}});</script>
</body>
</html>
`;
}

// --- render: pages ----------------------------------------------------------

export function renderHome(profile, sections, ctx) {
  const about = sections.find((s) => s.title.toLowerCase() === 'about');
  const aboutHtml = about ? marked.parse(about.body) : '<p>No bio yet.</p>';
  const main = `
    <h2 class="page-title">About</h2>
    <div class="prose">${aboutHtml}</div>
  `;
  return layout({
    title: profile?.displayName ?? profile?.handle ?? 'Profile',
    profile,
    sections,
    activeSlug: 'index',
    main,
    ctx,
  });
}

export function renderSectionPage(profile, section, sections, ctx) {
  const main = `
    <h2 class="page-title">${escapeHtml(section.title)}</h2>
    <div class="prose">${marked.parse(section.body)}</div>
  `;
  return layout({
    title: `${section.title} - ${profile?.displayName ?? profile?.handle ?? 'Profile'}`,
    profile,
    sections,
    activeSlug: sectionSlug(section.title),
    main,
    ctx,
  });
}

// --- utils ------------------------------------------------------------------

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function svgSun() { return '<svg class="icon-sun" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.7"/><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4"/></g></svg>'; }
function svgMoon() { return '<svg class="icon-moon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z"/></svg>'; }
