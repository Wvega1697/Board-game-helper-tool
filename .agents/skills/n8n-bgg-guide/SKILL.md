---
name: n8n-bgg-guide
description: >
  Reads the BGG XML API2 reference (BGG_API_Postman_Manual.md) and generates
  a step-by-step n8n workflow setup guide for one or more BGG API endpoints.
  Each guide covers: n8n Webhook → HTTP Request (Bearer auth) → XML node →
  Code reshape → Respond to Webhook, plus a Cloudflare Worker route and a
  PWA bggApi.js fetch call. The Collection endpoint guide always includes a
  202 async-retry loop (Wait + IF + loop-back).
when-to-use: >
  When the user says "generate an n8n guide", "add an n8n workflow for BGG",
  "set up n8n for the BGG [endpoint] endpoint", "how do I connect n8n to BGG
  [search/thing/collection/etc.]", or asks for an n8n setup guide for any
  BGG API operation.
user-invocable: true
paths:
  - "resources/BGG/BGG_API_Postman_Manual.md"
  - "resources/BGG/n8n-workflows/**/*.md"
effort: medium
---

# n8n BGG API Guide Generator

You generate **n8n workflow setup guides** for BGG XML API2 endpoints by
translating the API reference in `resources/BGG/BGG_API_Postman_Manual.md`
into step-by-step n8n configuration guides.

Apply Ponytail throughout: reuse patterns, don't invent abstractions. Every
guide follows the same node chain — don't vary it without a reason.

---

## Step 0 — Read before writing

1. Read `resources/BGG/BGG_API_Postman_Manual.md` fully if you haven't in
   this session.
2. Read `resources/BGG/n8n-workflows/00-credential-setup.md` (the shared
   credential reference all guides point to).
3. Read `.agents/skills/n8n-bgg-guide/references/template.md` — this is the
   exact structure every guide must follow.
4. For follow-up guides (not the first), skim existing guides in
   `resources/BGG/n8n-workflows/` so webhook paths don't collide.

---

## Step 1 — Identify endpoint(s)

From the user's request, identify which BGG endpoint(s) to generate guides for.
Map user intent to endpoint names:

| User says | Endpoint section in manual |
|---|---|
| "game details", "look up a game", "thing" | § 4 Thing |
| "family", "series" | § 5 Family |
| "forums for a game", "forum list" | § 6 Forum List |
| "threads in a forum", "forum" | § 7 Forum |
| "thread", "posts", "articles" | § 8 Thread |
| "user profile", "user info" | § 9 User |
| "guild", "guild members" | § 10 Guild |
| "plays", "logged plays", "play history" | § 11 Plays |
| "collection", "user collection", "games owned" | § 12 Collection |
| "hot", "hot list", "trending" | § 13 Hot Items |
| "search", "find a game", "search games" | § 14 Search |

If the user says "all" or doesn't specify, generate guides for all 11 endpoints.

---

## Step 2 — For each endpoint, fill the template

Use the template at `.agents/skills/n8n-bgg-guide/references/template.md`.
Replace every `{{PLACEHOLDER}}` with endpoint-specific values derived from
the BGG API manual. Rules for each section:

### Webhook node
- HTTP Method: always `GET` (all BGG XML API2 data endpoints are GET).
- Path: `bgg-` + a kebab-case slug of the endpoint name.
  - Existing reserved paths: `bgg-login`, `bgg-log-play`, `bgg-buddies`.
  - Never reuse these.

### HTTP Request node
- Method: `GET`.
- URL: the exact base URI from the manual (`https://boardgamegeek.com/xmlapi2/<endpoint>`).
- Authentication: `Predefined Credential Type` → `Header Auth` → credential
  named `BGG Bearer Token` (described in `00-credential-setup.md`).
- Query parameters: forward each accepted param from `$json.query.<param>`.
  Only include params that actually exist for this endpoint per the manual.

### XML node
- Operation: `XML to JSON`.
- Property Name: `data` (n8n default — matches the HTTP Request output field).

### Code node — reshape
Write minimal JS that:
1. Grabs the top-level items array from the parsed XML structure.
2. Maps each item to a flat object with the key fields for this endpoint.
3. Returns `[{ json: { items: [...] } }]` or `[{ json: { item: {...} } }]`
   for single-item endpoints.
4. Keep it simple — don't over-map. Only include fields the PWA would realistically use.

**XML-to-JSON shape note**: n8n's XML node wraps attributes under `$` and text
content under `_`. For example, `<name value="Catan"/>` becomes
`{ "$": { "value": "Catan" } }`. Account for this in reshape code.

### Collection endpoint — 202 retry loop
The Collection endpoint is the only BGG endpoint that may return HTTP `202`
(export queued). Insert these extra nodes between HTTP Request and XML:

```
HTTP Request → IF (statusCode === 202) → TRUE: Wait (3s) → loop back to HTTP Request
                                        → FALSE: continue to XML node
```

In n8n, implement this with:
- **IF node**: condition `{{ $json.statusCode }}` equals `202`
- **Wait node**: Resume `After time interval`, 3 seconds
- Connect Wait output back to HTTP Request input (creates the loop)
- FALSE branch continues to XML node

Document this explicitly in the guide with a "Retry Loop" subsection.

### Cloudflare Worker route
Follow the exact pattern from the Buddies section in `n8n-setup-guide.md`:

```javascript
if (request.method === 'GET' && pathname === '/bgg/<slug>') {
  const params = new URL(request.url).search;
  const n8nResponse = await fetch(`${N8N_BASE_URL}/webhook/bgg-<slug>${params}`);
  const data = await n8nResponse.text();
  return new Response(data, {
    status: n8nResponse.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
```

The Worker URL is `https://bgg-proxy.williamsv1697.workers.dev` (from `bggConfig.js`).

### PWA bggApi.js fetch call
Follow the `getBggBuddies` / `searchGames` pattern from `bggApi.js`:

```javascript
export async function <camelCaseName>(<params>) {
  const url = new URL(`${BGG_WORKER_URL}/bgg/<slug>`);
  // append params
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('<endpoint> fetch failed');
  return res.json();
}
```

Import `BGG_WORKER_URL` from `./bggConfig.js`.

### Postman / cURL Tests section

Every guide must include **three** curl commands under `## Postman / cURL Tests`:

1. **BGG direct** — calls `https://boardgamegeek.com/xmlapi2/<endpoint>?<example_params>` with `Authorization: Bearer {{bgg_token}}`. Returns raw XML. Lets the user verify the token + endpoint independently of n8n.

2. **n8n webhook — test mode** — calls `https://<your-n8n-host>/webhook-test/bgg-<slug>?<example_params>`. Remind the user to set the Webhook node to **Listen for Test Event** and use the `/webhook-test/` path.

3. **Cloudflare Worker** — calls `https://bgg-proxy.williamsv1697.workers.dev/bgg/<slug>?<example_params>`. Note that the n8n workflow must be **activated** (production mode) first.

Use realistic example params (e.g. `id=13` for Thing, `username=dakarp` for User, `query=catan` for Search) — not abstract placeholders. Each curl should be copy-pasteable and return a real result.

---

## Step 3 — Output

Write each guide to:
```
resources/BGG/n8n-workflows/<NN>-<slug>.md
```

Use the numbering sequence from the existing files (01 through 11, with 00
reserved for credential setup).

If `00-credential-setup.md` doesn't exist yet, generate it first — it's a
dependency all other guides reference.

---

## Step 4 — Verify

After writing all files:
1. Check that no two guides share the same webhook path.
2. Check that no webhook path collides with `bgg-login`, `bgg-log-play`, or `bgg-buddies`.
3. Confirm the Collection guide contains the words "Wait" and "202" in its content.
