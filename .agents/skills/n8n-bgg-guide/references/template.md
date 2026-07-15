# n8n Workflow Guide Template — BGG XML API2 Endpoint

> Copy this template once per endpoint. Replace every `{{PLACEHOLDER}}` with endpoint-specific values.

---

# 🎲 n8n: BGG {{ENDPOINT_NAME}} Endpoint

**BGG API base URI:** `https://boardgamegeek.com/xmlapi2/{{ENDPOINT_PATH}}`  
**Webhook path:** `GET /webhook/bgg-{{WEBHOOK_SLUG}}`  
**Purpose:** {{PURPOSE}}

> See [00-credential-setup.md](./00-credential-setup.md) for the one-time BGG Bearer token credential setup — all workflows share it.

---

## n8n Workflow: `BGG — {{ENDPOINT_NAME}}`

### Node 1 — Webhook

| Setting | Value |
|---|---|
| HTTP Method | `GET` |
| Path | `bgg-{{WEBHOOK_SLUG}}` |
| Respond | `Using 'Respond to Webhook' Node` |

Query parameters accepted:

| Param | Description |
|---|---|
| {{QUERY_PARAMS_TABLE}} |

---

### Node 2 — HTTP Request (BGG XML API)

| Setting | Value |
|---|---|
| Method | `GET` |
| URL | `https://boardgamegeek.com/xmlapi2/{{ENDPOINT_PATH}}` |
| Authentication | `Predefined Credential Type` → `Header Auth` → select `BGG Bearer Token` |
| Query Parameters | Add each param below using **Add Parameter** |

Query parameters to forward from the webhook (use n8n expressions):

```
{{QUERY_PARAMS_MAPPING}}
```

> ⚠️ **Rate limit**: BGG recommends ~5 seconds between requests. This matters for chained/batch calls from your Worker — not for individual user requests through this webhook.

---

### Node 3 — XML (parse BGG response)

| Setting | Value |
|---|---|
| Operation | `XML to JSON` |
| Property Name | `data` |

This converts the raw XML string into a JSON object that downstream nodes can reference normally.

---

### Node 4 — Code (reshape response)

```javascript
// Reshape the parsed XML → clean JSON for the PWA
{{RESHAPE_CODE}}
```

---

### Node 5 — Respond to Webhook

| Setting | Value |
|---|---|
| Respond With | `JSON` |
| Response Body | `={{ $json }}` |

---

## Error Handling

Add a second output path on the HTTP Request node (`Continue on Fail`):

```javascript
// In a Code node on the error path:
return [{ json: { success: false, error: `BGG API error: ${$input.first().json.statusCode}` } }];
```

Wire this to a **Respond to Webhook** node that returns the error JSON.

---

## Cloudflare Worker Route

In `bgg-worker/src/index.js` (or equivalent):

```javascript
{{WORKER_ROUTE}}
```

---

## PWA — `bggApi.js` Fetch Call

```javascript
{{PWA_FETCH}}
```

---

## Postman / cURL Tests

Three curl commands so you can verify each layer independently.

### 1 — BGG direct (raw XML, confirms your token works)

```bash
curl --location 'https://boardgamegeek.com/xmlapi2/{{ENDPOINT_PATH}}?{{EXAMPLE_QUERY}}' \
  --header 'Authorization: Bearer {{bgg_token}}'
```

> Returns raw XML. Use this to confirm the BGG endpoint + token work before touching n8n.

### 2 — n8n webhook — test mode (during development)

```bash
curl --location 'https://<your-n8n-host>/webhook-test/bgg-{{WEBHOOK_SLUG}}?{{EXAMPLE_QUERY}}'
```

> Set the Webhook node to **Listen for Test Event** first. Use `/webhook-test/`, not `/webhook/`. Returns shaped JSON from your Code node.

### 3 — Cloudflare Worker (end-to-end production)

```bash
curl --location 'https://bgg-proxy.williamsv1697.workers.dev/bgg/{{WEBHOOK_SLUG}}?{{EXAMPLE_QUERY}}'
```

> The n8n workflow must be **activated** (production mode) for this to respond. Tests the full Browser → Worker → n8n → BGG chain.
