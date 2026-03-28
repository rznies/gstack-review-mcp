# PRD: gstack-review-mcp — MCP Server for gstack Review Skills

## Problem Statement

I use gstack which provides powerful review skills as Claude Code skill files: `/plan-ceo-review`, `/design-consultation`, `/plan-design-review`, and `/plan-eng-review`. These skills work great inside Claude Code but are locked to that single tool. I want to use these same review capabilities inside ChatGPT (Developer Mode). Currently there is no way to bridge gstack skills into ChatGPT's MCP connector system.

## Solution

Build a standalone MCP server (`gstack-review-mcp`) that exposes the 4 gstack review skills as MCP tools. The server runs as a deployed web service on Render's free tier, accessible via HTTPS from ChatGPT's Developer Mode connector system. Each tool embeds the full SKILL.md instructions (with gstack preamble scripts stripped) so ChatGPT's LLM can execute the review methodology directly.

## User Stories

1. As a ChatGPT user, I want to connect to the gstack-review-mcp server via Developer Mode connectors, so that I can access gstack review tools without leaving ChatGPT.
2. As a ChatGPT user, I want to invoke the `plan-ceo-review` tool by pasting my plan content, so that I get a CEO/founder-level strategic review of my plan.
3. As a ChatGPT user, I want to specify a scope mode (expansion, selective, hold, reduction) when invoking the CEO review, so that the review matches my current strategic needs.
4. As a ChatGPT user, I want to invoke the `design-consultation` tool with my product description, so that I get a complete design system proposal (aesthetic, typography, color, layout, spacing, motion).
5. As a ChatGPT user, I want to invoke the `plan-design-review` tool, so that I get a designer's review of my plan covering information architecture, interaction states, user journey, AI slop risk, and responsive accessibility.
6. As a ChatGPT user, I want to invoke the `plan-eng-review` tool, so that I get an engineering manager review covering architecture, code quality, test coverage, and performance.
7. As a ChatGPT user, I want to invoke the `list-available-reviews` tool, so that I can discover what review types are available and understand what each one does.
8. As a ChatGPT user, I want each review tool to return structured instructions with voice guidelines and methodology steps, so that ChatGPT can execute the review consistently.
9. As a deployer, I want the server to deploy on Render's free tier with a `render.yaml` config, so that I can deploy with a single click from GitHub.
10. As a deployer, I want the server to handle cold starts gracefully (Render free tier spins down after 15 min), so that the first request after inactivity still works.
11. As a deployer, I want the server to serve on port 10000 (Render default) with a health check endpoint at `/`, so that Render can monitor the service.
12. As a deployer, I want the SKILL.md content embedded as string literals at build time, so that the server works in Render's ephemeral filesystem environment.
13. As a deployer, I want the embed step to strip bash preamble scripts (telemetry, update checks, session tracking) from SKILL.md files, so that the embedded content is clean instructions-only.
14. As a deployer, I want the MCP endpoint at `/mcp` to support Streamable HTTP transport, so that ChatGPT's connector system can communicate with it.
15. As a deployer, I want the server to include CORS headers, so that browser-based MCP clients can reach it.
16. As a deployer, I want the server built with Bun and Hono, so that it compiles to a fast, lightweight binary under 512MB RAM.
17. As a deployer, I want the compiled binary under 50MB, so that it deploys quickly on Render's free tier.
18. As a deployer, I want environment variables for configuration (PORT, NODE_ENV), so that I can adjust settings without code changes.
19. As a user, I want tool responses to include GStack voice/style rules, so that ChatGPT's review output follows gstack's quality standards.
20. As a user, I want tool responses to include ETHOS.md principles (Boil the Lake, Search Before Building), so that reviews follow gstack's core philosophy.
21. As a user, I want tool responses to include a structured methodology list, so that ChatGPT can follow the review process step by step.
22. As a user, I want each tool to accept optional context parameters, so that the review has richer context to work with.
23. As a deployer, I want a `scripts/embed-skills.sh` script that copies and strips SKILL.md files from a local gstack install, so that updating to newer gstack versions is one command.
24. As a deployer, I want the embed script to also copy ETHOS.md, so that voice and philosophy content stays in sync.
25. As a deployer, I want a README with ChatGPT connector setup instructions, so that setup is quick.

## Implementation Decisions

### Modules

| Module | Purpose |
|---|---|
| `src/index.ts` | Entry point. CLI args (`--http`, `--port`). Hono HTTP server. Mounts MCP at `/mcp`. Health check at `/`. |
| `src/server.ts` | `McpServer` instance. Registers 5 tools with `registerTool()`. Imports embedded skill content. |
| `src/skills/loader.ts` | Imports embedded markdown strings. Exports `getSkillContent(skillName)` and skill metadata. |
| `src/skills/types.ts` | TypeScript types: `SkillContent`, `ToolResponse`, `ScopeMode`. |
| `src/tools/registry.ts` | 5 tool registrations with Zod input schemas. Each handler returns structured JSON with SKILL.md content. |
| `src/utils/voice.ts` | GStack voice rules and ETHOS.md principles as constants. |
| `src/embedded/*.ts` | Stripped SKILL.md content as TS string exports: `ceo-review.ts`, `design-consult.ts`, `design-review.ts`, `eng-review.ts`, `ethos.ts`. |
| `scripts/embed-skills.sh` | Copies SKILL.md from gstack install, strips preambles, wraps as TS exports. |

### Technical Decisions

- **Transport**: Streamable HTTP only. Single endpoint at `/mcp`.
- **Framework**: Hono (< 50KB, Bun-native).
- **MCP SDK**: `@modelcontextprotocol/sdk` (official TypeScript SDK).
- **Validation**: Zod for tool input schemas.
- **Build**: `bun build` targeting Bun runtime.
- **Embedding**: SKILL.md as TS string constants. No runtime file reads.
- **Preamble stripping**: Remove bash/telemetry sections from SKILL.md during embed.
- **No Playwright**: No browser deps. Keeps binary small.
- **CORS**: Enabled for all origins.
- **Health check**: `GET /` returns `{"status": "ok", "skills": 4}`.

### Tool Input Schemas

```
plan-ceo-review:
  planContent: string (required)
  scopeMode: "expansion" | "selective" | "hold" | "reduction" (optional)
  additionalContext: string (optional)

design-consultation:
  productDescription: string (optional)
  projectType: string (optional)
  existingDesignMd: string (optional)

plan-design-review:
  planContent: string (required)
  designMd: string (optional)

plan-eng-review:
  planContent: string (required)
  testFramework: string (optional)
  additionalContext: string (optional)

list-available-reviews:
  (no arguments)
```

### Tool Response Format

```json
{
  "content": [{
    "type": "text",
    "text": "<skill name, voice rules, ethos, full SKILL.md instructions, methodology steps, output format>"
  }]
}
```

### File Structure

```
gstack-review-mcp/
├── package.json
├── tsconfig.json
├── render.yaml
├── README.md
├── PRD.md
├── ISSUES.md
├── scripts/
│   └── embed-skills.sh
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── skills/
│   │   ├── loader.ts
│   │   └── types.ts
│   ├── tools/
│   │   └── registry.ts
│   ├── utils/
│   │   └── voice.ts
│   └── embedded/
│       ├── ceo-review.ts
│       ├── design-consult.ts
│       ├── design-review.ts
│       ├── eng-review.ts
│       └── ethos.ts
└── dist/
    └── index.js
```

### Build & Deploy Pipeline

1. `bash scripts/embed-skills.sh` — strip + embed
2. `bun install` — deps
3. `bun build src/index.ts --outdir dist --target bun` — compile
4. `bun run dist/index.js` — run
5. Render auto-deploys on git push

### render.yaml

```yaml
services:
  - type: web
    name: gstack-review-mcp
    runtime: node
    buildCommand: bash scripts/embed-skills.sh && bun install && bun build src/index.ts --outdir dist --target bun
    startCommand: bun run dist/index.js
    plan: free
    envVars:
      - key: PORT
        value: 10000
    healthCheckPath: /
    autoDeploy: true
```

## Testing Decisions

- Server starts on configured port without errors
- `GET /` returns health check JSON with skill count
- `POST /mcp` with `tools/list` returns all 5 tools
- `POST /mcp` with `tools/call` for each tool returns valid content
- Embedded content has no preamble bash scripts
- Input validation rejects missing required fields
- CORS headers present on responses
- Manual: connect from ChatGPT Developer Mode, invoke each tool

## Out of Scope

- stdio transport (ChatGPT can't use local processes)
- MCP prompts (ChatGPT doesn't support them)
- Browser automation / Playwright (too heavy for Render free tier)
- Git context / file system tools (can't access user's local machine)
- Design mockup generation (requires Playwright)
- User authentication / multi-tenancy
- Persistent storage / database
- Other gstack skills (only 4 review skills + list)
- Claude Desktop / Cursor support (would need stdio — future)
- Versioned skill updates (redeploy to update)

## Further Notes

- SKILL.md files reference optional binaries (`browse`, `design`, `codex`). ChatGPT LLM will read these as context and adapt (skip unavailable steps).
- Render free tier spins down after 15 min. First request takes 30-60s. Acceptable for personal use. Upgrade to $7/mo for always-on.
- 4 SKILL.md files total ~285KB. Bun tree-shaking should produce a binary under 30MB.
- To update skills: pull latest gstack, re-run `embed-skills.sh`, commit, push (triggers Render redeploy).
