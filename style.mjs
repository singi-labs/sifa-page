// Shared stylesheet, exported so both the Node harness and a future sifa-web
// `/academic` route can serve the exact same CSS (one codebase).

export const CSS = `
@font-face { font-family:'Quattro'; src:url('fonts/quattro-regular.woff2') format('woff2'); font-weight:400; font-style:normal; font-display:swap; }
@font-face { font-family:'Quattro'; src:url('fonts/quattro-italic.woff2') format('woff2'); font-weight:400; font-style:italic; font-display:swap; }
@font-face { font-family:'Quattro'; src:url('fonts/quattro-bold.woff2') format('woff2'); font-weight:700; font-style:normal; font-display:swap; }
@font-face { font-family:'Quattro'; src:url('fonts/quattro-bold-italic.woff2') format('woff2'); font-weight:700; font-style:italic; font-display:swap; }
@font-face { font-family:'Space Grotesk'; src:url('fonts/space-grotesk-bold.woff2') format('woff2'); font-weight:700; font-style:normal; font-display:swap; }

:root, [data-theme="light"] {
  --bg:#fffcf0; --fg:#1c1b1a; --muted:#6b6862; --border:#e4e0d6; --card:#fff; --link:#2a5db0;
}
[data-theme="dark"] {
  --bg:#181714; --fg:#f0ede2; --muted:#a59f93; --border:#34322b; --card:#232118; --link:#9db8f8;
}
* { box-sizing:border-box; }
html { color-scheme: light dark; }
body {
  margin:0; color:var(--fg); background:var(--bg);
  font-family:'Quattro', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size:17px; line-height:1.6;
}
h1,h2,h3,h4,.sidebar-name,.page-title { font-family:'Space Grotesk','Quattro',sans-serif; }
a { color:var(--link); }

/* Sifa logo: one variant visible per theme. Both .sifa-logo and .footer-brand
   use .brand-logo, so these rules fix the masthead AND the footer. Specificity
   is kept equal-and-ordered so the dark-variant hide is not overridden. */
.brand-logo { display:block; }
.brand-logo-dark { display:none; }
[data-theme="dark"] .brand-logo-light { display:none; }
[data-theme="dark"] .brand-logo-dark { display:block; }

/* masthead + horizontal top nav (academicpages-style) */
.masthead { border-bottom:1px solid var(--border); position:sticky; top:0; z-index:10; background:var(--bg); }
.masthead-inner {
  max-width:1100px; margin:0 auto; padding:0.7rem 1.5rem;
  display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem 1.25rem;
}
.top-nav { display:flex; flex-wrap:wrap; gap:1rem; font-size:0.92rem; }
.top-nav a { color:var(--muted); text-decoration:none; padding:0.2rem 0; }
.top-nav a:hover, .top-nav a.active { color:var(--fg); }
.top-nav a.active { font-weight:700; }
.masthead-actions { margin-left:auto; display:flex; align-items:center; gap:0.6rem; }
.sifa-logo { display:inline-flex; align-items:center; line-height:0; }

.theme-toggle {
  background:none; border:1px solid var(--border); color:var(--muted);
  border-radius:8px; padding:0.3rem 0.45rem; cursor:pointer; display:inline-flex; align-items:center; gap:0.4rem;
}
.theme-toggle:hover { color:var(--fg); border-color:var(--muted); }
.icon-moon { display:none; }
[data-theme="dark"] .icon-sun { display:none; }
[data-theme="dark"] .icon-moon { display:block; }

.shell { display:grid; grid-template-columns:260px 1fr; max-width:1100px; margin:0 auto; }

.sidebar { padding:2rem 1.5rem; border-right:1px solid var(--border); position:sticky; top:54px; align-self:start; height:calc(100vh - 54px); overflow-y:auto; }
.avatar { width:96px; height:96px; border-radius:50%; object-fit:cover; border:1px solid var(--border); display:block; }
.avatar-placeholder { background:var(--card); color:var(--muted); font-family:'Space Grotesk',sans-serif; font-size:2.4rem; display:grid; place-items:center; }
.sidebar-name { font-size:1.25rem; margin:1rem 0 0; }
.sidebar-handle { color:var(--muted); margin:0.1rem 0 0.4rem; font-size:0.9rem; }
.meta-line { color:var(--muted); margin:0.15rem 0; font-size:0.92rem; }

/* links shown as content in the sidebar */
.side-links { display:flex; flex-direction:column; gap:0.15rem; margin-top:1rem; }
.side-link { display:flex; flex-direction:column; text-decoration:none; padding:0.25rem 0; border-top:1px solid var(--border); }
.side-link:first-child { border-top:none; }
.side-link-label { color:var(--fg); font-size:0.92rem; }
.side-link-host { color:var(--muted); font-size:0.8rem; word-break:break-all; }
.side-link:hover .side-link-label { color:var(--link); }

.main { padding:2rem 2.5rem 3rem; min-width:0; }
.page-title { font-size:1.6rem; margin:0 0 1rem; padding-bottom:0.4rem; border-bottom:1px solid var(--border); }
.prose h2 { font-size:1.15rem; margin:1.6rem 0 0.5rem; }
.prose h3 { font-size:1rem; margin:1.3rem 0 0.4rem; }
.prose ul { padding-left:1.2rem; }
.prose li { margin-bottom:0.4rem; }
.prose a { word-break:break-word; }

.site-footer {
  max-width:1100px; margin:0 auto; padding:1.4rem 2.5rem 3rem; border-top:1px solid var(--border);
  display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem 1.5rem;
}
.footer-left { display:flex; align-items:center; gap:0.8rem; }
.footer-brand { display:flex; align-items:center; line-height:0; }
.footer-meta { display:flex; flex-direction:column; font-size:0.82rem; color:var(--muted); line-height:1.4; }
.footer-updated { opacity:0.85; }
.footer-links { display:flex; flex-wrap:wrap; gap:0.4rem 1.25rem; font-size:0.85rem; }
.footer-links a { color:var(--muted); text-decoration:underline; text-underline-offset:2px; }
.footer-links a:hover { color:var(--link); }

@media (max-width:760px) {
  .masthead-inner { padding:0.6rem 1.25rem; }
  .top-nav { width:100%; }
  .masthead-actions { margin-left:0; }
  .shell { grid-template-columns:1fr; }
  .sidebar { position:static; height:auto; border-right:none; border-bottom:1px solid var(--border); }
  .main { padding:1.5rem 1.25rem 2.5rem; }
  .site-footer { padding:1.4rem 1.25rem 2.5rem; }
  .footer-links { margin-left:0; }
}
@media print {
  .masthead, .sidebar, .site-footer { display:none; }
  .shell { display:block; }
  .main { max-width:none; }
}
`;
