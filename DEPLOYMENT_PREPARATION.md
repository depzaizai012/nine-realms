# GitHub / Vercel production preparation

Project root: `C:\Users\hnc2703\Desktop\legend-of-the-nine-realms`. Framework: Vite 8.3.3 with vanilla JavaScript ES modules, HTML and CSS; client-side static SPA. Package manager: npm, lockfile v3. Dependencies remain Vite, Playwright, Prettier and Sharp; no runtime backend or third-party API is required. Existing source, game rules, UI/art and Git history are preserved.

Confirmed destinations:

- GitHub: `https://github.com/depzaizai012/nine-realms`
- Vercel project: `9realms`
- Requested Vercel personal account/team: `depzaizai012` (verify selection when linking/importing)
- Preferred production URL: `https://9realms.vercel.app` (availability/assignment not checked remotely)

Preparation is local only. No repository was created remotely, no push/deploy was run, and no Vercel project was linked. Local `origin` points to the confirmed repository. The local branch is renamed to `main`; existing commits `cbd6479` / `ddc7ba9` and their history are preserved. The deployment preparation commit includes the reviewed current game, assets, tests and deployment configuration.

## Configuration

`vercel.json` selects Vite, output `dist`, build `npm run build`, install `npm ci --include=dev`, and a SPA entry rewrite for extensionless application paths. Vercel checks real files before rewrites. Asset paths and filename-like missing requests are excluded from the fallback. `.nvmrc` and package/lock root metadata specify Node 24.x, a [supported Vercel runtime](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). The rewrite follows [Vercel's Vite SPA configuration](https://vercel.com/docs/frameworks/frontend/vite) and [documented regex exclusions](https://vercel.com/docs/project-configuration/vercel-json).

No application environment variables are required. Optional `PLAYWRIGHT_CHROME_PATH` is only for choosing a local test browser. Git commit identity (`user.name`, `user.email`) must be configured if absent; this is Git configuration, not an app environment variable. No values of authentication credentials are requested or saved.

`.gitignore` and `.vercelignore` exclude dependencies/build outputs, local env/config, credential files and `.vercel`. Existing intentional art and test evidence remain intact. The dependency lockfile is retained; only its root Node engine metadata changes, with no dependency versions upgraded.

## Verification

```powershell
npm.cmd run check:secrets
npm.cmd test
npm.cmd run build
npm.cmd run check:deployment
npm.cmd run test:production
```

The asset audit checks every selected/catalog URL in `public` and `dist` segment-by-segment for exact filename case, relative ES-module/CSS imports, duplicate case-folded filenames, lockfile alignment, SPA routing exclusions and GitHub's per-file size limit. The largest production source image is under 4 MB. No existing unusual sprite filename is renamed.

The secret checker scans current tracked/untracked text, including ignored local text files, excluding dependency/build internals and classifying binary assets separately. Findings include only paths, line numbers and rule names, never matching values. It is a potential-secret pattern scan, not a claim that arbitrary credentials can always be detected. Rerun it after changing files and before committing.

Production browser tests load `dist`, use touch at 390×844 / 360×800 / 412×915, verify Help/x2/Pause/Replay/Town, direct refresh, asset MIME types, absent development debug handles and missing/case-wrong asset 404s. The local preview applies the declared routing policy; an actual Vercel deployment has not been tested or published.

Completed locally: production build passed; 28 unit/interface tests, 31 gameplay browser tests and 2 production smoke tests passed. The deployment audit verified 134 asset URLs and 51 source files without errors. The secret scan checked 108 text files and found no potential secrets or private environment files. Production test server shutdown also completed cleanly.

## Commit and push — only after explicit approval

Run these in PowerShell from the confirmed project root. Origin is already configured; do not replace another remote or force-push. This sandbox-created repository may trigger Git's ownership guard from the Windows user terminal; the commands use a per-command exception for this exact verified directory, without changing global safety settings. If no commit identity is configured, first set your actual identity:

```powershell
$NineRealmsRepo = 'C:/Users/hnc2703/Desktop/legend-of-the-nine-realms'
Set-Location -LiteralPath $NineRealmsRepo
git -c "safe.directory=$NineRealmsRepo" config --local user.name 'depzaizai012'
git -c "safe.directory=$NineRealmsRepo" config --local user.email 'YOUR_GITHUB_COMMIT_EMAIL'
```

Replace the email placeholder with your chosen GitHub commit/noreply address. Do not use a fabricated email or pass a token in the remote URL.

```powershell
npm.cmd run check:secrets
git -c "safe.directory=$NineRealmsRepo" remote -v
git -c "safe.directory=$NineRealmsRepo" diff --check
git -c "safe.directory=$NineRealmsRepo" add .
git -c "safe.directory=$NineRealmsRepo" diff --cached --stat
git -c "safe.directory=$NineRealmsRepo" commit -m 'Prepare nine-realms for Vercel production deployment'
git -c "safe.directory=$NineRealmsRepo" push --set-upstream origin main
```

The repository must exist under the confirmed owner; if it does not, create an empty `nine-realms` repository there first. A conflicting remote history should be reviewed and merged normally; never force-push. Existing working changes include the prior game/UI/asset updates, so review the staged summary as a complete current-game snapshot before committing.

## Vercel import — only after explicit approval

In the Vercel dashboard, choose the confirmed account, import `depzaizai012/nine-realms`, name the project `9realms`, use root `.`, and select production branch `main`. Verify the configuration above and leave application environment variables empty. Deploy only when authorized. If the preferred domain is unavailable, confirm an alternative with the owner rather than silently changing the target.

Once linked, optional CLI commands are `vercel link --project 9realms` and `vercel --prod`; they are intentionally not run during preparation. Verify the actual account/project before running either. Authentication should happen through the CLI/browser flow, never by putting a token in commands or source files.

## Phone testing after deployment

Open the HTTPS production URL in Safari on iOS and Chrome on Android. Check portrait layout, touch swipes, invalid swap-back, cascades, selected targets, HP/mana/statuses, charged ultimates, x2, Help/Pause outside-close, Replay and all three waves. Reload a direct application URL and confirm asset requests remain images/scripts rather than HTML. Local Chromium touch tests are not a substitute for testing actual iOS/Android hardware.
