# Temporary Zolith HTTPS compatibility sample

Public test URL: **https://baicai.dev/zolith-test**.

This is a short-term comparison of the existing V0.5.0 offline HTML attachment
and the same document delivered over HTTPS. Keep the page until the owner asks
to remove it. It is not the full Zolith Review product or a PDF export.

## Integration and source

`public/zolith-test.html` is an exact copy of:

```text
C:\BaiCai\Codex\StoneMatch\prototypes\offline-review\Zolith-Review-Compatibility-Test.html
```

- Size: **527,239 bytes** (514.88 KiB).
- SHA-256: `52cf84f46216848ff2e2914dd4302b260a7583e89e152c3a181814e8cdc55d6a`.
- Embedded images: fictional sample-marble JPEG, 2400×1680, and approved Zolith
  mark PNG. No customer project, CAD, camera BMP, device settings or private data.
- HTML/CSS/JavaScript and all interaction logic remain unchanged. All resources
  are embedded; the sample makes no application network requests.
- `next.config.ts` rewrites only `/zolith-test` to `/zolith-test.html`. Both paths
  receive `X-Robots-Tag: noindex, nofollow, noarchive` and
  `Cache-Control: no-store, no-transform`.
- The response is a standalone static document. It does not use React, the site's
  root layout, styles, navigation, fonts, analytics or client-side routing.
- `public/.gitattributes` keeps this HTML's LF bytes stable on Windows checkouts.

No homepage/nav/content/sitemap changes, dependencies, API, login, database or
subdomain are introduced. The URL is public; noindex is not access control.

The initial custom-domain verification detected the domain's existing Cloudflare
proxy injecting its Web Analytics beacon into this document, while the direct
Vercel Preview preserved the original bytes. The route-specific `no-transform`
directive prevents intermediary payload changes for these two sample paths,
without changing Cloudflare account settings or other site pages. Cloudflare
documents this behavior in its [Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/).
Acceptance checks require exact HTML bytes as well as a working viewer; a
successful Vercel build alone does not detect this custom-domain difference.

The site's existing GitHub/Vercel connection is retained: `BaiCaiMark/baicai.dev`,
production branch `main`, Vercel project `baicai-dev`, team `Mark's projects`
(`team_P1MavxDmzJ330uiPNQIn8Ntt`), project ID
`prj_ZUB65Qk9qhwiuA8ScFK9AIDeQ2B6`. Before this change, production was READY
at commit `3cd9500793792938251a0d1ecf59e63703cd735f`, deployment
`dpl_9qqNH9qd2EPoUQyqMJcSJGBUwWju`. Do not assume those remain current later.

## Validation

Run `npm run lint` and `npm run build`. The development-only browser runner uses
Playwright through the local `NODE_PATH`; it is not a website dependency:

```powershell
node scripts/test-zolith-compatibility.mjs baseline https://baicai.dev <output-directory>
node scripts/test-zolith-compatibility.mjs local http://127.0.0.1:3010 <output-directory>
node scripts/test-zolith-compatibility.mjs preview https://<preview-host> <output-directory>
node scripts/test-zolith-compatibility.mjs production https://baicai.dev <output-directory>
```

Capture the homepage baseline **before** release. The runner opens installed
Windows Chrome and Edge, checks the deployed response's SHA-256 against the
offline HTML, validates MIME/noindex, loaded logo/image/information, +/-/wheel,
drag, Fit, viewport emulation, emulated pinch/touch pan and console/resources.
It also compares the site's homepage visible content/navigation with baseline.
Local/public production runs additionally disable JavaScript to check fallback.
Protected previews use normal temporary Vercel access without disabling protection.
No authentication URLs, cookies or tokens should be published as test artifacts.

Desktop emulation is **not** iPhone/iPad/Android evidence. HTTPS requires network
access to load the page; the original offline attachment remains a separate test.

## Owner's real-device checklist

Send **https://baicai.dev/zolith-test** as a WhatsApp URL. No installation,
account or extra app is required by this web page. Actual app/browser handoff is
an explicit part of the test and remains unverified until tested on hardware.

For each device, record OS/app versions and the actual browser or in-app viewer:

| Device/browser | Opens via WhatsApp URL | Logo/image/info | +/- and pinch | Pan | Fit | Default browser handoff / steps | Extra app needed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone Safari | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| iPhone Chrome | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| iPad Safari | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| Samsung Chrome | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| Samsung Internet | Pending | Pending | Pending | Pending | Pending | Pending | Pending |

1. Tap the WhatsApp URL; distinguish its internal viewer from the default browser.
2. Verify names, logo, stone and detail in portrait/landscape.
3. Test buttons, one-finger drag, two-finger pinch, drag after pinch and Fit.
4. Scroll outside the image; confirm image gestures do not accidentally scroll
   the page. Rotate and refit. Record smoothness and opening steps.
5. If offered, use the existing “Open in browser” option and repeat. Record when
   no convenient default-browser route exists; do not assume Safari was used.
6. Compare the same device/channel's offline HTML attachment result separately.

Do not delete the page automatically after testing. No customer data should be
substituted into this public sample without new authorization.

## Complete removal when authorized

1. Delete `public/zolith-test.html` and its single `public/.gitattributes` rule
   (delete that attributes file only if it still contains just this rule).
2. Remove only this sample's rewrite and two header entries in `next.config.ts`;
   preserve any configuration added later for other routes.
3. Remove `scripts/test-zolith-compatibility.mjs`; archive or remove this report.
4. Lint/build, deploy through the existing Git/Vercel flow, and check both
   `/zolith-test` and `/zolith-test.html` return 404. Recheck the homepage/tools.

There is no navigation entry, database, API, tracking service, dependency or DNS
record to clean up. Historical Git commits/Vercel immutable deployments may
retain the fictional sample; removing a production route does not erase history.
Zolith Studio V0.4.6 and the offline prototype are independent and unchanged.
