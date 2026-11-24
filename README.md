# dsh-token-bill

**English** | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

Version **0.1.0** (2026-11-24) · package `dsh-token-bill`.

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) bundle that turns the local cost ledger and session logs into a readable token bill. It adds a **Bill (账单)** view to the conversation page.

## What you see

- **Four top pills**: `This session` / `Summary bill` / `Collaboration fit` / `Action tuning`. Collapsed by default with a one-line summary; click a pill or **Expand** to open it, and collapse it again at any time. *This session* shows the current session's cost, token composition / top tools (pill switch), turns, and a collapsed cost timeline. *Summary bill* holds KPIs, a one-line conclusion and the top 3 costliest tasks (red / gold / blue markers); details stay below.
- **Time distribution**: month / week / day / hour. The daily bar chart has a cost axis and a 3-day trend curve; the hourly view is a weekday × hour heatmap. Bars and heat cells reveal amounts on hover and details on click.
- **Task bill**: attribution by session, in card or table view. Cards show a token-composition ring, cost per turn, median first response, tool error rate and top tools. Search, sort by cost or tokens, filter by task type; table rows expand full details.
- **Tools & execution**: top 12 tools by calls, median / P90 duration, error rate and how many tasks used them.
- **Task relationship graph**: only evidenced links — shared memory topics, reused deliverable files, explicit references, parent/child sessions. Same workspace, same day or same task type no longer creates an edge. Tasks without evidence stay isolated. Curved edges, force layout, neighbour focus on hover, draggable nodes, edge reasons on hover.
- **Model distribution**: list by default; switch to **Chart** for a channel → model sunburst of cost share. Click a list row for per-million-token and per-call cost.
- **Task types**: list by default; switch to **Chart** for a type → task sunburst. Click a type to filter tasks.
- **Collaboration fit**: six axes (goal clarity, information density, exploration, iteration, context supply, verification) and four archetypes, overlaid with the AI's response style (accuracy, latency, proactivity, explanation, memory, self-check). Gives a fit score, complement/same-frequency judgement, per-axis gaps and tags for both sides. AI-side numbers are behavioural proxies, not semantic accuracy.
- **Action tuning**: off-peak scheduling, cache use, context slimming, model routing, task focus and tool-loop suggestions, each with evidence and a rough saving estimate.

## Visual design

The palette follows the Zhiyu VI: indigo `#2A4A78`, stone green `#159A99`, moon blue `#84A5D2`, ivory `#E8EEF7`, warm paper `#F2ECDE`, gold `#F9E87F`, palace red `#9E2B25`. Warm paper background, paper-white cards and thin indigo rules; in dark mode the warm ratio drops automatically. No external chart library: sunbursts, rings, curves and the graph are hand-drawn SVG/CSS. Serif title, line icons, and light motion for pill switches, collapse, bars and heat cells, respecting `prefers-reduced-motion`.

## Where the data comes from

- Cost and tokens: the local `dsh-cost-meter` ledger at `~/.dsh/storages/cost-meter/ledger.json`.
- Hourly distribution, turns, tool calls and user prompts: local session logs under `~/.dsh/sessions/`.
- Nothing is uploaded and no network request is made. Disabling the bundle removes the view; the ledger is untouched.

## Boundaries

- The ledger only keeps records after the cost plugin was installed; earlier dates are empty. The retained range is shown in the page.
- Hourly amounts are allocated, not per-call billing; peak/off-peak weights follow the cost plugin's configuration and the total still matches the daily ledger.
- The style profile needs at least one user message in the selected range. AI-side metrics come from tool results, turn completion, first-response latency, tool variety and correction phrases; they are behavioural proxies, not semantic accuracy.
- Saving estimates are conservative and may overlap; the sum is not additive.
