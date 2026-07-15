#!/usr/bin/env node
/**
 * sifa-academicpages build script.
 *
 * Fetches a public Sifa profile (the .md export) and emits a multi-page,
 * academicpages-style personal website: one page per populated section, a
 * shared top nav, a minimal Sifa wordmark, and a Sifa-branded footer CTA.
 *
 * No login, no auth. The .md export is the public visitor view, so the site
 * shows exactly what a non-owner sees on sifa.id (hidden items already
 * dropped, opted-out profiles return 404).
 *
 * Config: set SIFA_HANDLE (or SIFA_DID) in the environment. Defaults to the
 * demo handle below.
 */

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { marked } from 'marked';

const HANDLE = process.env.SIFA_HANDLE ?? process.env.SIFA_DID ?? 'ronentk.me';
const SIFA_BASE = process.env.SIFA_BASE ?? 'https://sifa.id';
const OUT = 'dist';

// --- fetch + parse ----------------------------------------------------------

async function fetchProfileMd(handle) {
  const url = `${SIFA_BASE}/p/${handle}.md`;
  const res = await fetch(url, { redirect: 'follow' });
  if (res.status === 404) {
    throw new Error(`No public profile for "${handle}" at ${url} (404 — wrong handle, or profile opted out).`);
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  return { md: await res.text(), url };
}

/**
 * Split the .md export into a header block + one entry per `##` section.
 * The .md shape is stable (driven by the shared section model in sifa-web):
 *
 *   # Name (@handle)
 *
 *   Profile: <url>
 *   Headline: ...
 *   Location: ...
 *   Website: ...
 *
 *   ## About
 *   ...
 *   ## Career
 *   ...
 */
function parseProfile(md) {
  const lines = md.split('\n');

  const titleMatch = lines[0]?.match(/^# (.+)$/);
  const titleLine = titleMatch ? titleMatch[1] : HANDLE;
  // .md header is "Display Name (@handle)" (handle in parens). Handle either form.
  const m = titleLine.match(/^(.*?)\s*\(?@([\w.:-]+)\)?\s*$/);
  const name = (m ? m[1] : titleLine).trim();
  const handle = m ? m[2].trim() : '';

  const meta = {};
  const sections = [];
  let current = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const sec = line.match(/^## (.+)$/);
    if (sec) {
      current = { title: sec[1].trim(), body: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      const kv = line.match(/^([A-Za-z]+):\s(.*)$/);
      if (kv) meta[kv[1]] = kv[2];
      continue;
    }
    current.body.push(line);
  }

  return {
    name,
    handle,
    profileUrl: meta.Profile,
    headline: meta.Headline,
    location: meta.Location,
    website: meta.Website,
    sections: sections
      .map((s) => ({ ...s, body: s.body.join('\n').trim() }))
      .filter((s) => s.body.length > 0),
  };
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// --- render -----------------------------------------------------------------

function navHtml(sections, activeSlug) {
  const item = (label, href, active) =>
    `<a href="${href}"${active ? ' aria-current="page" class="active"' : ''}>${label}</a>`;
  const hasAbout = sections.some((s) => s.title.toLowerCase() === 'about');
  const links = [
    // If there is no About section, keep a Home entry so the landing is reachable.
    ...(hasAbout ? [] : [item('Home', 'index.html', activeSlug === 'index')]),
    ...sections.map((s) => {
      const isAbout = s.title.toLowerCase() === 'about';
      const href = isAbout ? 'index.html' : `${slugify(s.title)}.html`;
      const active = isAbout ? activeSlug === 'index' : slugify(s.title) === activeSlug;
      return item(s.title, href, active);
    }),
  ];
  return `<nav class="site-nav">${links.join('\n')}</nav>`;
}

function layout({ title, nav, main, name }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="site-header">
    <a href="index.html" class="site-title">${name}</a>
    <a href="https://sifa.id" class="sifa-mark" title="Built with Sifa">Sifa</a>
  </header>
  ${nav}
  <main class="site-main">
${main}
  </main>
  <footer class="site-footer">
    <p>This page is generated from <a href="https://sifa.id">Sifa</a> profile data. Want an academic page like this one? <a href="https://sifa.id">Claim yours on Sifa</a>.</p>
  </footer>
</body>
</html>
`;
}

function renderHome(profile, sections) {
  const meta = [
    profile.handle ? `@${profile.handle}` : null,
    profile.headline,
    profile.location,
    profile.website ? `<a href="${profile.website}">${profile.website}</a>` : null,
  ]
    .filter(Boolean)
    .map((v) => `<p class="meta-line">${v}</p>`)
    .join('\n');

  const about = sections.find((s) => s.title.toLowerCase() === 'about');
  const aboutHtml = about ? marked.parse(about.body) : '<p>No bio yet.</p>';

  const cards = sections
    .filter((s) => s.title.toLowerCase() !== 'about')
    .map((s) => {
      const slug = slugify(s.title);
      return `<a class="card" href="${slug}.html"><span>${s.title}</span></a>`;
    })
    .join('\n');

  const main = `
    <h1>${profile.name}</h1>
    ${meta}
    <section class="bio">
      ${aboutHtml}
    </section>
    ${cards ? `<section class="cards">${cards}</section>` : ''}
  `;
  return layout({
    title: profile.name,
    nav: navHtml(sections, 'index'),
    main,
    name: profile.name,
  });
}

function renderSectionPage(profile, section, sections) {
  const slug = slugify(section.title);
  const main = `
    <h1>${section.title}</h1>
    ${marked.parse(section.body)}
    <p class="back"><a href="index.html">&larr; Back to ${profile.name}</a></p>
  `;
  return layout({
    title: `${section.title} — ${profile.name}`,
    nav: navHtml(sections, slug),
    main,
    name: profile.name,
  });
}

// --- main -------------------------------------------------------------------

async function main() {
  console.log(`Fetching Sifa profile for "${HANDLE}"...`);
  const { md, url } = await fetchProfileMd(HANDLE);
  console.log(`  fetched ${md.length} bytes from ${url}`);
  const profile = parseProfile(md);
  console.log(`  ${profile.name} — ${profile.sections.length} sections: ${profile.sections.map((s) => s.title).join(', ')}`);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  await writeFile(`${OUT}/index.html`, renderHome(profile, profile.sections));
  let pageCount = 1;
  for (const section of profile.sections) {
    if (section.title.toLowerCase() === 'about') continue; // shown on home
    await writeFile(`${OUT}/${slugify(section.title)}.html`, renderSectionPage(profile, section, profile.sections));
    pageCount++;
  }
  await writeFile(`${OUT}/style.css`, CSS);

  console.log(`\nDone. ${pageCount} page(s) written to ${OUT}/`);
  console.log('Preview with:  npx serve dist');
}

main().catch((err) => {
  console.error(`\nBuild failed: ${err.message}`);
  process.exit(1);
});

// --- stylesheet -------------------------------------------------------------

const CSS = `
:root {
  --fg: #1c1b1a;
  --muted: #6b6862;
  --link: #2a5db0;
  --border: #e4e0d6;
  --maxw: 720px;
  --sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif;
  --serif: Georgia, 'Times New Roman', serif;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  color: var(--fg);
  font-family: var(--serif);
  font-size: 17px;
  line-height: 1.6;
  background: #fffcf0;
}
.site-header {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 1.5rem 1.25rem 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px solid var(--border);
}
.site-title { font-family: var(--sans); font-weight: 600; text-decoration: none; color: var(--fg); font-size: 1.05rem; }
.sifa-mark { font-family: var(--sans); font-size: 0.8rem; color: var(--muted); text-decoration: none; letter-spacing: 0.02em; }
.sifa-mark:hover { color: var(--link); }
.site-nav {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 0.5rem 1.25rem;
  font-family: var(--sans);
  font-size: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.1rem;
}
.site-nav a { color: var(--muted); text-decoration: none; }
.site-nav a:hover, .site-nav a.active { color: var(--fg); }
.site-nav a.active { font-weight: 600; }
.site-main {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
}
.site-main h1 { font-family: var(--sans); font-size: 1.8rem; margin: 0 0 0.5rem; }
.site-main h2 { font-family: var(--sans); font-size: 1.2rem; margin: 1.5rem 0 0.5rem; }
.site-main h3 { font-family: var(--sans); font-size: 1.05rem; margin: 1.25rem 0 0.4rem; }
.site-main ul { padding-left: 1.25rem; }
.site-main li { margin-bottom: 0.4rem; }
.site-main a { color: var(--link); }
.meta-line { color: var(--muted); margin: 0.2rem 0; font-family: var(--sans); font-size: 0.95rem; }
.bio { margin-top: 1rem; }
.cards { margin-top: 2rem; display: flex; flex-wrap: wrap; gap: 0.6rem; }
.card {
  font-family: var(--sans);
  font-size: 0.9rem;
  text-decoration: none;
  color: var(--fg);
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fff;
}
.card:hover { border-color: var(--muted); }
.back { margin-top: 2.5rem; font-family: var(--sans); font-size: 0.9rem; }
.site-footer {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
  border-top: 1px solid var(--border);
  font-family: var(--sans);
  font-size: 0.85rem;
  color: var(--muted);
}
.site-footer a { color: var(--link); }
@media print {
  .site-nav, .site-header .sifa-mark, .site-footer, .back { display: none; }
  body { background: #fff; }
}
`;
