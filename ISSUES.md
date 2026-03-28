# Issues: gstack-review-mcp

Breakdown of PRD into independently-grabbable vertical slices using tracer bullets.

## Dependency Graph

```
Issue 1 (deploy skeleton)
    │
    ▼
Issue 2 (MCP protocol proof)
    │
    ├──────────────┐
    ▼              │
Issue 3 (embed)    │
    │              │
    ▼              │
Issue 4 (first tool, end-to-end) ◄── first real value
    │
    ├──────────────┬──────────────┐
    ▼              ▼              ▼
Issue 5          Issue 6        Issue 7
(eng review)   (design consult) (design review)
    │              │              │
    └──────────────┴──────────────┘
                   │
                   ▼
            Issue 8 (polish + ship)
```

---

## Issue 1: Project scaffold + health check deploy

**Type**: AFK
**Blocked by**: None — can start immediately
**User stories addressed**: 11, 16, 17

### What to build

Initialize the `gstack-review-mcp` project with Bun + Hono. Create a minimal HTTP server that serves a health check at `GET /` returning `{"status": "ok", "skills": 0}`. Include `package.json`, `tsconfig.json`, and a `render.yaml` for Render deployment. The server should listen on a configurable port (default 10000) and compile with `bun build` targeting the Bun runtime. Deploy to Render free tier and verify the health endpoint is reachable via HTTPS.

### Acceptance criteria

- [ ] `bun install` completes without errors
- [ ] `bun build src/index.ts --outdir dist --target bun` compiles successfully
- [ ] `bun run dist/index.js` starts the server on port 10000
- [ ] `curl https://your-app.onrender.com/` returns `{"status": "ok", "skills": 0}`
- [ ] Render auto-deploys on git push to main
- [ ] Compiled binary is under 50MB

---

## Issue 2: MCP tools/list + ChatGPT connector proof

**Type**: AFK
**Blocked by**: Issue 1
**User stories addressed**: 1, 7

### What to build

Wire `@modelcontextprotocol/sdk` Streamable HTTP transport at `/mcp` on the Hono server. Register a single `list-available-reviews` tool that returns hardcoded metadata about the 4 planned review skills (name, description, input parameters). No embedded SKILL.md content yet — just metadata. Verify that ChatGPT Developer Mode can discover and call this tool via the connector.

### Acceptance criteria

- [ ] `POST /mcp` with `tools/list` JSON-RPC request returns 1 tool: `list-available-reviews`
- [ ] Calling `list-available-reviews` returns descriptions of all 4 review skills
- [ ] ChatGPT Developer Mode can connect to the deployed server URL
- [ ] ChatGPT can discover and invoke `list-available-reviews` and see the 4 skill names
- [ ] Streamable HTTP transport works end-to-end (not legacy SSE)

---

## Issue 3: Embed script + preamble stripping

**Type**: AFK
**Blocked by**: Issue 1
**User stories addressed**: 12, 13, 23, 24

### What to build

Create `scripts/embed-skills.sh` that:
1. Copies SKILL.md from `~/.claude/skills/gstack/{skill}/SKILL.md` for the 4 review skills
2. Copies ETHOS.md from `~/.claude/skills/gstack/ETHOS.md`
3. Strips bash preamble sections (telemetry, update checks, session tracking) from each SKILL.md
4. Wraps each file's content as a TypeScript string export in `src/embedded/*.ts`

The preamble stripping should remove content between preamble bash code blocks (the ```bash sections in the preamble) while preserving all review instructions, voice rules, and methodology content.

### Acceptance criteria

- [ ] `bash scripts/embed-skills.sh` runs without errors
- [ ] `src/embedded/ceo-review.ts` exports `CEO_REVIEW_MD` string constant
- [ ] `src/embedded/design-consult.ts` exports `DESIGN_CONSULT_MD` string constant
- [ ] `src/embedded/design-review.ts` exports `DESIGN_REVIEW_MD` string constant
- [ ] `src/embedded/eng-review.ts` exports `ENG_REVIEW_MD` string constant
- [ ] `src/embedded/ethos.ts` exports `ETHOS_MD` string constant
- [ ] Grep for `gstack-telemetry-log`, `gstack-update-check`, `gstack-config` returns no matches in embedded files
- [ ] Embedded files are smaller than originals (preamble stripped)
- [ ] Re-running the script is idempotent (same output)

---

## Issue 4: Plan CEO Review tool (end-to-end)

**Type**: AFK
**Blocked by**: Issue 2, Issue 3
**User stories addressed**: 2, 3, 8, 19, 20, 21, 22

### What to build

Implement the first full review tool: `plan-ceo-review`. This is the template that Issues 5-7 will follow. The tool:

- Accepts `planContent` (required string), `scopeMode` (optional enum: expansion/selective/hold/reduction), `additionalContext` (optional string)
- Returns structured text containing: skill name, GStack voice rules, ETHOS.md principles, full SKILL.md instructions (embedded), methodology steps (ordered list), expected output format
- Uses Zod for input validation
- Registers with `McpServer.registerTool()`

Update `src/skills/loader.ts` to provide `getSkillContent("ceo-review")` and skill metadata. Update `src/utils/voice.ts` with extracted voice rules from ETHOS.md.

### Acceptance criteria

- [ ] `POST /mcp` with `tools/list` now returns 2 tools: `list-available-reviews` and `plan-ceo-review`
- [ ] Calling `plan-ceo-review` with a sample plan returns content > 1000 characters
- [ ] Response includes GStack voice rules section
- [ ] Response includes ETHOS.md principles section
- [ ] Response includes full SKILL.md content (no preamble bash blocks)
- [ ] Response includes ordered methodology steps
- [ ] Calling with invalid input (missing `planContent`) returns validation error
- [ ] `scopeMode` parameter is accepted and included in response context
- [ ] ChatGPT can invoke the tool and receive structured review instructions

---

## Issue 5: Engineering Plan Review tool

**Type**: AFK
**Blocked by**: Issue 4
**User stories addressed**: 6, 8, 22

### What to build

Implement `plan-eng-review` following the same pattern as Issue 4. The tool accepts `planContent` (required), `testFramework` (optional string), and `additionalContext` (optional string). Registers with `McpServer.registerTool()` using the embedded `ENG_REVIEW_MD` content.

### Acceptance criteria

- [ ] `POST /mcp` with `tools/list` now returns 3 tools
- [ ] Calling `plan-eng-review` with a sample plan returns content with engineering review methodology
- [ ] Response includes architecture review, code quality review, test review, performance review sections
- [ ] `testFramework` parameter is accepted and included in response context
- [ ] Input validation works (missing `planContent` returns error)
- [ ] ChatGPT can invoke the tool and receive structured engineering review instructions

---

## Issue 6: Design Consultation tool

**Type**: AFK
**Blocked by**: Issue 4
**User stories addressed**: 4, 8, 22

### What to build

Implement `design-consultation` following the same pattern as Issue 4. The tool accepts `productDescription` (optional string), `projectType` (optional string), and `existingDesignMd` (optional string). Registers with `McpServer.registerTool()` using the embedded `DESIGN_CONSULT_MD` content.

### Acceptance criteria

- [ ] `POST /mcp` with `tools/list` now returns 4 tools
- [ ] Calling `design-consultation` returns content with design consultation methodology
- [ ] Response includes design system proposal framework (aesthetic, typography, color, layout, spacing, motion)
- [ ] All 3 optional parameters are accepted and included in response context
- [ ] ChatGPT can invoke the tool and receive structured design consultation instructions

---

## Issue 7: Design Plan Review tool

**Type**: AFK
**Blocked by**: Issue 4
**User stories addressed**: 5, 8, 22

### What to build

Implement `plan-design-review` following the same pattern as Issue 4. The tool accepts `planContent` (required) and `designMd` (optional string). Registers with `McpServer.registerTool()` using the embedded `DESIGN_REVIEW_MD` content.

### Acceptance criteria

- [ ] `POST /mcp` with `tools/list` now returns 5 tools (all planned tools)
- [ ] Calling `plan-design-review` returns content with 7-pass design review methodology
- [ ] Response covers information architecture, interaction states, user journey, AI slop risk, design system alignment, responsive accessibility
- [ ] `designMd` parameter is accepted and included in response context
- [ ] Input validation works (missing `planContent` returns error)
- [ ] ChatGPT can invoke the tool and receive structured design review instructions

---

## Issue 8: CORS, env vars, render.yaml, README, final polish

**Type**: AFK
**Blocked by**: Issue 4, Issue 5, Issue 6, Issue 7
**User stories addressed**: 9, 14, 15, 18, 25

### What to build

Final production readiness:
1. Add CORS headers to all responses (allow all origins)
2. Support `PORT` env var for port configuration
3. Finalize `render.yaml` with correct build/start commands referencing embed script
4. Write `README.md` with:
   - Project description
   - Local development setup
   - Deploy to Render instructions
   - ChatGPT Developer Mode connector setup steps (with screenshots/description)
   - Tool reference (all 5 tools with input schemas)
5. Verify `list-available-reviews` tool metadata is accurate for all 5 tools
6. End-to-end test: deploy, connect from ChatGPT, invoke all 5 tools

### Acceptance criteria

- [ ] CORS headers present on `GET /` and `POST /mcp` responses
- [ ] `PORT` env var overrides default port 10000
- [ ] `render.yaml` build command includes `embed-skills.sh`
- [ ] `render.yaml` build command includes `bun build`
- [ ] `README.md` exists with setup and deploy instructions
- [ ] `README.md` includes ChatGPT connector configuration steps
- [ ] `README.md` lists all 5 tools with input schemas
- [ ] Deployed server passes health check
- [ ] All 5 tools callable from ChatGPT Developer Mode
- [ ] `list-available-reviews` returns accurate metadata for all 5 tools
