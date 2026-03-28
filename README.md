# gstack-review-mcp

MCP server for the 4 gstack review skills.

## License

MIT. See `LICENSE`.

## What it exposes

- `list-available-reviews`
- `plan-ceo-review`
- `design-consultation`
- `plan-design-review`
- `plan-eng-review`

## Local setup

```bash
bun install
bun test
bun build
```

## Run locally

```bash
bun run src/index.ts
```

Defaults to port `10000`. Override with `PORT` or `--port`.

## Render deploy

1. Push the repo to GitHub.
2. Create a new Render Web Service from the repo.
3. Use `render.yaml`.
4. Keep the free tier, it serves on port `10000`.

## ChatGPT Developer Mode connector

1. Open ChatGPT Developer Mode connectors.
2. Add a new MCP server.
3. Use the deployed URL, ending in `/mcp`.
4. Save and refresh connectors.
5. Call `list-available-reviews` first to confirm the bridge is live.

## Health check

- `GET /` returns `{ "status": "ok", "skills": 4 }`

## Tool reference

### `list-available-reviews`

No input.

### `plan-ceo-review`

- `planContent` string, required
- `scopeMode` one of `expansion | selective | hold | reduction`, optional
- `additionalContext` string, optional

### `design-consultation`

- `productDescription` string, optional
- `projectType` string, optional
- `existingDesignMd` string, optional

### `plan-design-review`

- `planContent` string, required
- `designMd` string, optional

### `plan-eng-review`

- `planContent` string, required
- `testFramework` string, optional
- `additionalContext` string, optional
