# Measurement — the monthly loop

Rankings are a vanity number. They change by device, by location and by the hour, and two people
standing in the same room can see different results. Measure things that connect to covers instead.

---

## What to track

| Metric | Where | How often | What good looks like |
|---|---|---|---|
| Direction requests | Google profile | Monthly | Trending up — the strongest intent-to-visit signal you get |
| Calls from the profile | Google profile | Monthly | Up, and actually answered |
| Website clicks from profile | Google profile | Monthly | Up alongside views |
| Discovery vs direct searches | Google profile | Monthly | Discovery growing means new people are finding you |
| New reviews per month | Google profile | Weekly | Steady, never zero |
| Average rating | Google profile | Monthly | 4.3–4.8, stable or rising |
| Review response rate | Google profile | Weekly | 100% |
| Clicks and impressions | Search Console | Monthly | Up, especially on non-brand queries |
| Queries in positions 8–20 | Search Console | Monthly | Your cheapest wins list |
| AI mention rate | Manual test | Monthly | A rising share of your 15 test questions |
| AI fact accuracy | Manual test | Monthly | Zero errors — chase every one to its source |
| Online orders and bookings | Your own system | Weekly | The number that actually pays wages |

**Brand vs non-brand matters.** People searching your restaurant by name were already coming. Growth
in *non-brand* queries — "neapolitan pizza downtown", "restaurants near the arena" — is new demand.

---

## The 30-minute monthly review

Same day every month. Put it in the calendar as a recurring task; consistency beats intensity here.

| Minutes | Task |
|---|---|
| 5 | Google profile performance: views, calls, directions, website clicks, discovery vs direct |
| 5 | Reply to every unanswered review; note any recurring complaint |
| 5 | Verify hours for the coming month, including holidays and private-event closures |
| 5 | Run your 15 AI test questions; log mentions and any wrong facts |
| 5 | Search Console: pull the position 8–20 list and pick one to fix |
| 5 | Upload new photos and schedule the month's Google Posts |

There is a [prompt](04-ai-prompt-library.md#run-your-monthly-30-minute-review) that takes this
month's numbers and tells you what to do next.

---

## Measuring AEO

There is no Search Console for AI answers. You measure it by asking, on a schedule.

### Build a fixed question set

Write 10 to 15 questions a real diner might type into a chat window, covering a spread of intent:

- **Direct:** "best neapolitan pizza in Asheville"
- **Occasion:** "where should I take a client to dinner downtown Asheville"
- **Constraint:** "gluten free pizza Asheville", "somewhere open late near the arena"
- **Dish:** "who does wood fired pizza in Asheville"
- **Comparison:** "is X or Y better for a birthday dinner"

Phrase them the way a person types, not the way an SEO writes a keyword. Then **never change them** —
the whole point is comparing the same questions month over month. There is a
[prompt](04-ai-prompt-library.md#build-your-ai-visibility-test-set) that drafts the set for you.

### Run them the same way each month

Ask each question in ChatGPT, Gemini, Perplexity, Copilot and Google AI Overviews. Use a fresh chat
or an incognito window each time so previous conversation does not colour the answer.

### Log four things

| Date | Question asked | Assistant | Mentioned? | Position | Facts correct? | Sources cited | Action |
|---|---|---|---|---|---|---|---|
| 2026-01-05 | best neapolitan pizza in asheville | ChatGPT | No | — | n/a | eater.com, local blog | Pitch that blog |
| 2026-01-05 | where to eat near the arena | Perplexity | Yes | 2nd | Hours wrong | our site, Yelp | Fix Yelp hours |
| 2026-01-05 | gluten free pizza asheville | Gemini | No | — | n/a | tripadvisor | Add GF to menu page + attributes |

Copy that into a spreadsheet. It is unglamorous and it is the only reliable way to know whether your
AEO work is landing.

### What the columns tell you

- **Mentioned** — your headline number. Track it as a percentage of questions.
- **Position** — being named first matters more in an answer of three than in a list of ten.
- **Facts correct** — every wrong fact is a task. Trace it to the source that produced it (usually a
  stale directory listing) and fix it there, not by arguing with the assistant.
- **Sources cited** — this is your outreach target list. If the same three local publications keep
  getting cited and you are not on any of them, that is your next month's work.

---

## Setting expectations honestly

| Change | When you should expect to see something |
|---|---|
| Google Business Profile edits | Days to about two weeks |
| Website content and schema | Four to twelve weeks |
| Reviews and local authority | Months, compounding |
| AI assistant answers | Weeks to months — some assistants work from indexes refreshed on their own schedule |

Do the work, keep the monthly loop, and judge it on a quarter — not on a Tuesday.

---

## A caution about tools

There is a growing market of paid "AI visibility" and "AEO rank tracking" tools. Some are useful at
scale. For a single restaurant, a spreadsheet and thirty minutes a month gives you the same signal,
and you learn far more from reading the actual answers than from watching a number in a dashboard.

Start manual. Buy a tool only when you can name the specific decision it would help you make.
