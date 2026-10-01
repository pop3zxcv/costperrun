# costperrun.com

A calculator that estimates what one multi-step AI agent run actually costs.

**[costperrun.com](https://costperrun.com)**

## The problem it solves

Every other LLM cost calculator prices a single API request: input tokens times rate, plus output tokens times rate. That is correct for a chatbot.

An agent is not a chatbot. It makes dozens of calls in a loop, and because language models hold no state between calls, every step re-sends the entire conversation so far. Step 10 pays for steps 1 through 9 all over again.

Total input tokens across `N` steps:

```
N × (system + user) + (output + tool_result) × N × (N−1) / 2
```

The second term is quadratic. Double the step count and the input cost roughly quadruples.

## A worked example

A 12-step agent with a 2,000-token system prompt, a 500-token task, and 400 output plus 1,200 tool-result tokens per step:

| | |
|---|---|
| Raw conversation length | 21,700 tokens |
| Billed input, 0% retries | 135,600 tokens (6.2×) |
| Billed input, 10% retries | 149,160 tokens (6.9×) |

Both figures are correct and they measure different things. 6.2× is the context effect on its own. 6.9× is what the live tool shows, because it defaults to a realistic 10% retry rate and retries re-send context too.

## What it models

- Quadratic context accumulation across steps
- Tool-result size, which is re-sent by every subsequent step
- Retry and failure rate
- Prompt cache hit rate
- 26 models across OpenAI, Anthropic, Google, Meta, xAI, Moonshot and DeepSeek
- Per-step cost accumulation and cost attribution by component

## What it does not model

Stated plainly, because a cost tool that hides its limits is not worth using:

- **Retries are a flat multiplier** on total cost. Real retries happen at a specific context depth, so failures late in a run are under-counted.
- **Cache hit rate is one number**, not per-prefix.
- **Cache writes are not modelled.** OpenAI's GPT-5.6 charges 1.25× uncached input to write to cache. Only reads are priced here.
- **Batch API and long-context pricing tiers** are not included.
- **Tokenizers differ by provider**, so cross-vendor token counts are approximate. They also differ inside Anthropic: Claude 4.7 and later (every Claude model here except Haiku 4.5) use a newer tokenizer producing about 30% more tokens for the same text than Haiku 4.5.

Treat the output as a planning estimate, not a billing forecast.

## Pricing data

`models.json` is the canonical source. Every rate carries the provider's own pricing URL and the date it was verified. If a price cannot be checked against a primary provider page, it does not ship.

**Found a stale price?** Open an issue with the provider's pricing URL. That is the most useful contribution you can make here.

Note: Claude Sonnet 5's $2 / $10 was announced as introductory through 31 August 2026. Anthropic cancelled the scheduled increase to $3 / $15, so $2 / $10 is now the standard rate.

## Privacy

Everything runs in your browser. No account, no analytics script, no request carries your numbers anywhere. Shareable links encode the configuration in the URL itself, so the link is the only thing that travels.

This is enforced, not just promised: the `Content-Security-Policy` in `_headers` sets `default-src 'none'`, which means the browser blocks any outbound request the page might try to make.

## Running it locally

There is no build step and there are no dependencies.

```bash
open index.html
```

## Verifying the math after a change

```bash
node -e '
const fs=require("fs"), h=fs.readFileSync("index.html","utf8");
const models=eval(h.match(/const MODELS=(\[[\s\S]*?\]);/)[1]);
eval(h.match(/function calc\(m,p\)\{[\s\S]*?\n\}/)[0]);
const s=models.find(m=>m.id==="sonnet-5-5");
const base={S:2000,U:500,N:12,O:400,T:1200};
const b=calc(s,{...base,R:0.10,C:0});
console.log(Math.round(b.tokTotalIn)===149160 ? "PASS" : "FAIL");
'
```

## Deploying

The site is hosted on Cloudflare Pages, connected to this repository. Pushing
to `main` triggers a build and deploy automatically. There is no build step:
Cloudflare serves the repository root as-is, so the framework preset is
`None` and both the build command and output directory are empty.

`_headers` must stay at the repository root. It is what sets the Content
Security Policy and the font cache headers, and Cloudflare only reads it from
the root of the deployed directory.

**If this repository is ever deleted and recreated, pushes will stop deploying.**
The Cloudflare Workers and Pages GitHub App grants access per repository *ID*,
not per name, so a recreated repository is a different repository as far as the
App is concerned. The Cloudflare dashboard shows "This project is disconnected
from your Git account" and keeps reporting automatic deployments as enabled,
which makes it look configured when it is not. Fix it at
github.com/settings/installations by re-granting access to this repository.

## Licence

MIT for the code. Pricing data is compiled from public provider pages and is provided as-is.
