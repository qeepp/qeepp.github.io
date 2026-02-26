# QEEPP Website

This repository contains the QEEPP public website (static HTML/CSS/JS) and its CI/CD workflow.

---

## Environments

### Staging / UAT (Preview)
- Cloudflare Pages **Preview Deployments** act as staging/UAT.
- Every Pull Request (PR) gets a **Preview URL** (unique per PR) created by Cloudflare.
- Use the Preview URL to review content/layout before merging.

### Production
- Cloudflare Pages **Production** deploys from the `main` branch.
- Merging a PR into `main` triggers an automatic production deployment.

---

## CI/CD Pipeline

### Flow
```text
Edit in GitHub (web / VS Code Web)
        ↓
Create branch + Pull Request
        ↓
GitHub Actions CI (required)
        ↓
Cloudflare Pages Preview Deploy (Staging/UAT)
        ↓
Manual review / approval
        ↓
Squash & Merge to main
        ↓
Cloudflare Pages Production Deploy
        ↓
Live site
```

## Continuous Integration (GitHub Actions)

The CI workflow runs automatically on:

- Pull requests targeting `main`
- Pushes to `main`
- Manual trigger (`workflow_dispatch`)

CI checks may include:

- Prettier formatting check (if enabled)
- HTML validation
- JavaScript syntax check
- Link checking (Lychee)
- GitHub Actions workflow linting (actionlint)

## How to Make Changes

1. Edit files in GitHub or VS Code Web.
2. Commit to a branch (GitHub may create one automatically).
3. Open a Pull Request to `main`.
4. Wait for required checks to pass:
   - ✅ **QEEPP Site CI**
   - ✅ **Cloudflare Pages** (Preview deployed)
5. Open the Cloudflare Preview URL and verify changes.
6. Click **Squash and merge**.

## Finding the Cloudflare Preview URL (Staging/UAT)

On the Pull Request page:

1. Scroll to **Checks**
2. Open **Cloudflare Pages — Deployed successfully**
3. Click **Details**
4. Copy the Preview URL (staging/UAT)

## Branch Protection Rules

`main` is protected to ensure quality:

- Pull Requests required before merge
- Required status checks must pass before merge
- Head branches may be auto-deleted after merge

## Link Checking Notes (Lychee)

Some external services block automated link checkers (expected behavior).  
Known false positives are excluded via `.lycheeignore` (e.g., Formspree endpoints and LinkedIn profile URLs).

## Slack Notifications (Optional)

The CI/CD workflow can post preview/staging notifications to Slack via an incoming webhook.  
When a Cloudflare Pages preview deployment is ready, it can send the Preview URL to a Slack channel for UAT and review.

### Setup

1. Create an Incoming Webhook URL in Slack.
2. Add it as a GitHub Actions secret:
   - `SLACK_WEBHOOK_URL`
3. Add (or update) the Slack notification workflow:
   - `.github/workflows/slack-preview-url.yml`

## Security

- **Never commit secrets** to this repository (API keys, tokens, passwords, webhook URLs, private endpoints).
- Store secrets only in:
  - **GitHub Actions Secrets** (e.g., `SLACK_WEBHOOK_URL`)
  - **Cloudflare Secrets / Environment Variables** (Workers/Pages)
- If a secret is ever exposed **Regenerate/rotate it immediately**
- Treat webhook URLs like passwords: anyone with the URL can post messages

