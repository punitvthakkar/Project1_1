### Scope and goals
- Integrate Gemini 2.5 Flash into web apps using vanilla JavaScript (browser), Node.js (server), and Python (server).  
- Cover model selection, REST and SDK usage, streaming, structured JSON output, function calling, RAG grounding, safety, observability, and deployment controls.  

### Model IDs and versions
- Stable default: gemini-2.5-flash.  
- Efficiency variant: gemini-2.5-flash-lite for minimal latency/cost at scale.  
- Preview gating: use preview IDs (for example, gemini-2.5-flash-preview-09-2025) behind feature flags and canary traffic.  

### Authentication and environment
- Never expose API keys in browsers; route all model calls through a server endpoint.  
- Standardize on an environment variable GEMINI_API_KEY and rotate via secret manager; deny logging of secrets.  
- Enforce request timeouts (15–30 s for non-streaming, connection-level heartbeat for streaming).  

### REST API shape (reference)
- Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent  
- Headers: x-goog-api-key: <GEMINI_API_KEY>, Content-Type: application/json  
- Body (minimal):  
```json
{
  "contents": [
    { "role": "user", "parts": [{ "text": "Explain RAG in 3 bullets." }] }
  ],
  "generationConfig": {
    "temperature": 0.3,
    "topP": 0.9,
    "maxOutputTokens": 512,
    "stopSequences": ["</END>"]
  }
}
```

### Vanilla JavaScript (browser) client
- Pattern: call a backend endpoint; never send API keys from the browser.  
- Simple non-streaming call to a custom server route:  
```html
<script>
async function generate() {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "Summarize WebRTC in 3 bullets" })
  });
  const data = await res.json();
  document.querySelector("#out").textContent = data.text;
}
</script>
<button onclick="generate()">Run</button>
<pre id="out"></pre>
```
- Streaming via Server-Sent Events (SSE):  
```js
function stream(prompt) {
  const es = new EventSource("/api/stream?q=" + encodeURIComponent(prompt));
  let text = "";
  es.onmessage = (e) => {
    const { delta } = JSON.parse(e.data);
    text += delta;
    document.querySelector("#out").textContent = text;
  };
  es.addEventListener("done", () => es.close());
}
```

### Node.js server (Express) — SDK
- Install: npm i @google/generative-ai  
- Minimal non-streaming endpoint:  
```js
import express from "express";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }]}],
    generationConfig: { temperature: 0.3, topP: 0.9, maxOutputTokens: 512 }
  });
  res.json({ text: result.response.text() });
});

app.listen(3000);
```
- Streaming via SSE:  
```js
app.get("/api/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  const stream = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: req.query.q || "" }]}],
    generationConfig: { temperature: 0.3, maxOutputTokens: 512 }
  });

  for await (const chunk of stream.stream) {
    res.write(`data: ${JSON.stringify({ delta: chunk.text() })}\n\n`);
  }
  res.write("event: done\ndata: {}\n\n");
  res.end();
});
```
- REST (no SDK) alternative:  
```js
import fetch from "node-fetch";

app.post("/api/generate", async (req, res) => {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": process.env.GEMINI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: req.body.prompt }]}],
      generationConfig: { temperature: 0.3, maxOutputTokens: 512 }
    })
  });
  const data = await r.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
  res.json({ text });
});
```

### Python server (Flask) — SDK
- Install: pip install google-generativeai flask  
- Minimal non-streaming endpoint:  
```python
import os
from flask import Flask, request, jsonify
import google.generativeai as genai

app = Flask(__name__)
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.5-flash")

@app.post("/api/generate")
def generate():
    payload = request.get_json()
    resp = model.generate_content(
        contents=[{"role": "user", "parts": [{"text": payload.get("prompt","")}]}],
        generation_config={"temperature": 0.3, "top_p": 0.9, "max_output_tokens": 512}
    )
    return jsonify({"text": resp.text})

if __name__ == "__main__":
    app.run(port=3000)
```
- REST (requests) alternative:  
```python
import os, requests
from flask import Flask, request, jsonify

app = Flask(__name__)
API_KEY = os.environ["GEMINI_API_KEY"]

@app.post("/api/generate")
def generate():
    body = {
        "contents": [{"role":"user","parts":[{"text": request.json.get("prompt","")}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512}
    }
    r = requests.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        headers={"x-goog-api-key": API_KEY, "Content-Type": "application/json"},
        json=body, timeout=30
    )
    data = r.json()
    text = "".join([p.get("text","") for p in data.get("candidates",[{}])[0].get("content",{}).get("parts",[])])
    return jsonify({"text": text})
```

### Structured JSON output (all stacks)
- Enforce JSON-only output with a schema instruction, stop sequences, and server-side validation.  
```json
{
  "type": "object",
  "properties": {
    "title": { "type":"string" },
    "summary": { "type":"string" },
    "tags": { "type":"array", "items": { "type":"string" } }
  },
  "required": ["title","summary","tags"],
  "additionalProperties": false
}
```
- Prompt template:  
```txt
Return ONLY valid JSON that matches this JSON Schema. Do not include any commentary.
Schema:
<JSON_SCHEMA>
Task: Summarize the input into this schema.
Input:
<CONTENT>
```
- SDK call (Node example):  
```js
const schema = {/* as above */};
const prompt = `Return ONLY valid JSON... Schema:\n${JSON.stringify(schema)}\nTask: ...`;

const r = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }]}],
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 256,
    stopSequences: ["```
  }
});
const out = JSON.parse(r.response.text());
```

### Function calling / tools (agent actions)
- Declare functions with typed parameters, keep descriptions concise, and validate inputs before execution.  
- Node (SDK pattern):  
```
const tools = [{
  functionDeclarations: [{
    name: "searchArticles",
    description: "Search KB articles.",
    parameters: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "integer" } },
      required: ["query"]
    }
  }]
}];

const chat = model.startChat({ tools });

const r1 = await chat.sendMessage("Find 3 articles about streaming UX.");
for (const call of r1.response.functionCalls() || []) {
  if (call.name === "searchArticles") {
    const { query, limit = 3 } = call.args;
    const data = await kbSearch(query, limit);
    await chat.sendMessage({
      role: "tool",
      parts: [{ functionResponse: { name: "searchArticles", response: data } }]
    });
  }
}
const r2 = await chat.sendMessage("Summarize the results as bullets.");
```
- Python (SDK pattern):  
```
chat = model.start_chat(tools=[{
  "function_declarations": [{
    "name": "searchArticles",
    "description": "Search KB articles.",
    "parameters": {
      "type": "object",
      "properties": {"query": {"type":"string"}, "limit": {"type":"integer"}},
      "required": ["query"]
    }
  }]
}])

r1 = chat.send_message("Find 3 articles about streaming UX.")
for call in (r1.function_calls or []):
    if call.name == "searchArticles":
        data = kb_search(call.args.get("query"), call.args.get("limit",3))
        chat.send_message({
          "role":"tool",
          "parts":[{"function_response":{"name":"searchArticles","response":data}}]
        })
r2 = chat.send_message("Summarize the results as bullets.")
```

### Retrieval augmentation (RAG)
- Shorten and chunk domain texts (512–1500 tokens each), embed/index separately, and retrieve top-k passages for each request.  
- Inline retrieved snippets as context with explicit instructions to cite only provided materials; prefer IDs or URLs for traceability.  
- Cache retrieval results per session to reduce latency and cost.  

### Prompting patterns
- Keep instructions explicit: task, constraints, format, tone, failure behavior.  
- Prefer compact few-shot exemplars that mirror desired output layout; place the best example first.  
- Use low temperature for classification/extraction/tool routing; moderate temperature for ideation/copy; cap maxOutputTokens to control tail latency.  

### Safety, privacy, and injection resistance
- Pre-validate and sanitize inputs; reject HTML/script payloads in prompts; strip or escape user-provided markup.  
- Instruct the model to only use supplied context; never execute arbitrary URLs/commands; keep tools allowlisted with strict schemas.  
- Scrub PII and secrets from logs/telemetry; encrypt at rest; apply RBAC and per-IP/user rate limits.  

### Observability and quality
- Log model ID, decoding params, prompt version, latency, token counts, and safety blocks; avoid logging raw PII.  
- Maintain golden prompts with expected outputs; run on deploy to detect regressions.  
- Add counters for fallback hits, tool-call accuracy, JSON-parse failures, and streaming aborts.  

### Performance and cost controls
- Choose gemini-2.5-flash as the default; use flash-lite when throughput and cost dominate and task complexity is low.  
- Stream partial tokens to improve perceived latency; keep chunks small; update UI incrementally.  
- Limit context size, dedupe retrieved passages, and right-size maxOutputTokens per endpoint.  

### Error handling and retries
- Implement exponential backoff (e.g., 250 ms, 500 ms, 1 s, jitter) on transient errors and quota responses.  
- Provide safe fallback responses on safety/validation failures; surface actionable errors to the client without internal details.  
- Time out upstream calls and cancel streams if the client disconnects.  

### File and multimodal inputs
- Accept files server-side, validate type/size, and pass as parts in the request (images/audio/video/documents) when supported by the selected model variant.  
- For audio-first experiences, prefer server-mediated real-time APIs; gate with authentication and per-connection budgets.  

### Deployment checklist
- Model ID pinned (e.g., gemini-2.5-flash); preview models behind feature flags and canaries.  
- Server-only API usage; browser calls go through authenticated endpoints with rate limits and quotas.  
- Streaming supported for interactive paths; JSON-only contracts validated server-side for structured endpoints.  
- Golden tests, telemetry, and alerts in place; retries with backoff; circuit breakers for upstream failures.  
- Secrets managed via environment/secret manager; CORS restricted to trusted origins; TLS enforced.  

### Example prompts (copy/paste)
- JSON-only:  
```
Return ONLY valid JSON matching this schema, no commentary.
Schema:
{ "type":"object","properties":{"title":{"type":"string"},"summary":{"type":"string"},"tags":{"type":"array","items":{"type":"string"}}},"required":["title","summary","tags"],"additionalProperties":false }
Task: Summarize the following release notes into the schema.
Input:
<text>
```
- Tool-first intent:  
```
Task: If a search is needed, call tool "searchArticles" with { query, limit }. Otherwise, answer directly in 3 bullets.
Constraints: Be concise. Do not invent sources. If context is missing, request the tool.
User query:
<query>
```
- RAG-bounded answer:  
```
Answer ONLY from the provided snippets. If a fact is missing, say "insufficient context".
Format: 3 bullets; include source IDs in parentheses.
Snippets:
[ID=KB-12] <text>
[ID=KB-98] <text>
