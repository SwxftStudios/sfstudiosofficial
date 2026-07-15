import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("root redirects visitors to the login page", async () => {
  const response = await render();
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "http://localhost/login.html");
});

test("ships the requested S&F Studios frontend assets", async () => {
  const [html, css, js, studioHtml, studioCss, studioJs, page, layout] = await Promise.all([
    readFile(new URL("../public/login.html", import.meta.url), "utf8"),
    readFile(new URL("../public/login.css", import.meta.url), "utf8"),
    readFile(new URL("../public/login.js", import.meta.url), "utf8"),
    readFile(new URL("../public/studio.html", import.meta.url), "utf8"),
    readFile(new URL("../public/studio.css", import.meta.url), "utf8"),
    readFile(new URL("../public/studio.js", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<title>S&amp;F Studios Access<\/title>/);
  assert.match(html, /Login/);
  assert.match(html, /Email/);
  assert.match(html, /Password/);
  assert.match(html, /Forgot Password/);
  assert.match(html, /Continue As Guest/);
  assert.match(html, /First Name/);
  assert.match(html, /Last Name <em>\(Optional\)<\/em>/);
  assert.match(html, /Confirm Password/);
  assert.match(html, /Phone Number <em>\(Optional\)<\/em>/);
  assert.match(html, /Country <em>\(Optional\)<\/em>/);
  assert.doesNotMatch(html, /scanline|frame-one|class="meter"/);
  assert.match(css, /--signal:\s*#ff6a00/i);
  assert.match(css, /\.stage-logo/);
  assert.match(css, /aspect-ratio:\s*1;/);
  assert.match(css, /object-fit:\s*contain/);
  assert.match(js, /setMode\("login"\)/);
  assert.match(js, /sfstudiosofficial_access/);
  assert.match(js, /sfstudiosofficial_logs/);
  assert.match(js, /Visited login page/);
  assert.match(js, /window\.location\.assign\("\/studio\.html"\)/);
  assert.match(studioHtml, /<title>S&amp;F Studios<\/title>/);
  assert.match(studioHtml, /Home/);
  assert.match(studioHtml, /Showcase/);
  assert.match(studioHtml, /Services &amp; Contact/);
  assert.match(studioHtml, /Talent Hub/);
  assert.match(studioHtml, /Announcements &amp; Updates/);
  assert.match(studioHtml, /Socials/);
  assert.match(studioHtml, /Profile/);
  assert.match(studioHtml, /Staff Panel/);
  assert.match(studioHtml, /UGC Creator/);
  assert.match(studioHtml, /Game Designer/);
  assert.match(studioHtml, /3D Modeller/);
  assert.match(studioHtml, /Photo Editor/);
  assert.match(studioHtml, /Post a Job/);
  assert.match(studioHtml, /Search Jobs/);
  assert.match(studioHtml, /Pay Type/);
  assert.match(studioHtml, /Account Information/);
  assert.match(studioHtml, /Security/);
  assert.match(studioHtml, /Founder Login/);
  assert.match(studioHtml, /Executives Department/);
  assert.match(studioHtml, /Role permissions/);
  assert.match(studioHtml, /Activity Log/);
  assert.match(studioHtml, /sf-studios-logo\.png/);
  assert.match(studioCss, /--ember:\s*#ff6a00/i);
  assert.match(studioCss, /\.clean-logo-card/);
  assert.match(studioCss, /\.staff-dashboard/);
  assert.match(studioCss, /\.talent-stats/);
  assert.match(studioCss, /object-fit:\s*contain/);
  assert.match(studioJs, /sfstudiosofficial_access/);
  assert.match(studioJs, /sfstudiosofficial_profile/);
  assert.match(studioJs, /sfstudiosofficial_jobs/);
  assert.match(studioJs, /sfstudiosofficial_staff/);
  assert.match(studioJs, /sfstudiosofficial_logs/);
  assert.match(studioJs, /Creator Profiles/);
  assert.match(studioJs, /za01302025@gmail\.com/);
  assert.match(studioJs, /data-apply-job/);
  assert.match(page, /redirect\("\/login\.html"\)/);
  assert.match(layout, /title:\s*"S&F Studios"/);
  assert.match(layout, /services, talent, updates, socials, and profiles/i);
});
