# Deployment

## Local Preview

From the project root:

```bash
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173/digest/<week-slug>/
```

## Production Deploy

The current prototype deploys to Netlify.

Deploy command:

```bash
npx -y netlify-cli@latest deploy --prod --dir .
```

Production site:

```text
https://summit-house-digest-prototype.netlify.app
```

Issue URL format:

```text
https://summit-house-digest-prototype.netlify.app/digest/<week-slug>/
```

## Access Audrey Needs

To publish on her own, Audrey needs:

- the repo or project folder
- Node available on her machine
- Netlify access for the site
- Chrome or browser access if gathering LinkedIn posts
- the sheet export files or direct issue notes

No secrets should be stored in `issue.json`.

## Recommended Approval Flow

1. Agent builds the issue locally.
2. Audrey reviews local preview or preview deploy.
3. Audrey approves final publish.
4. Agent runs production deploy.
5. Agent confirms the production issue URL.

