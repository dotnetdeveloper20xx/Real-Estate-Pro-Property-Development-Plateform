# 01 — The Big Picture

## What Does This Module Actually Do?

Right, so imagine you're running a property development company. Before you can build anything — houses, flats, commercial units — you first need to buy the land. That's what this module manages.

It tracks the entire journey of a land opportunity from the moment someone says "hey, there's a piece of land in Manchester we should look at" all the way through to "we now own that land, here's the title deed, let's start planning what to build on it."

## The Lifecycle in Plain English

Here's the journey every land opportunity goes through. Think of it like a pipeline — a funnel that land opportunities move through:

1. **Identified** — Someone spots a piece of land. Could be from an estate agent, a direct approach, a planning portal. We capture the basics: where is it, how big is it, who told us about it.

2. **Initial Review** — The team takes a first look. Is it worth pursuing? Is the location right? Is the size right for what we want to build?

3. **Due Diligence** — This is the serious checking phase. The legal team checks for legal issues, environmental problems, planning constraints, utility access. Think of it as the "is there anything wrong with this land that would stop us or cost us money?" phase.

4. **Offer Made** — We've done our homework, we're happy, and we make a formal offer to the landowner. We might go back and forth with counter-offers.

5. **Under Contract** — The offer's been accepted. Solicitors get involved, contracts are drafted, reviewed, signed, and exchanged.

6. **Acquired** — We own it. The land is registered at the land registry under our name.

Or at any point, it can move to **Withdrawn** — meaning we've decided not to pursue it, and we record why.

## Why This Matters for the Business

- **No more spreadsheets** — Everything's in one place, tracked, searchable
- **Nothing falls through the cracks** — The system enforces the right steps in the right order
- **Compliance** — Every action is logged, every decision is auditable
- **Approvals** — Big financial decisions can't happen without sign-off from the Finance Director
- **Visibility** — Everyone can see where every opportunity sits in the pipeline at a glance

## What Was Actually Built (The 16 Task Groups)

We split the work into 16 major chunks, done in order so each builds on the previous:

1. **Domain Layer** — The core data structures (what a "land opportunity" IS, what a "due diligence check" IS)
2. **Infrastructure Layer** — The database configuration, state machines, storage services
3. **Checkpoint** — Made sure 1 and 2 work together
4. **Opportunity Operations** — Creating, updating, deleting, searching, transitioning opportunities
5. **Supporting Operations** — Managing land owners, due diligence, and offers
6. **More Operations** — Contracts, documents, feasibility analysis, acquisitions, approvals
7. **Dashboard & Notifications** — KPI reporting and automatic notifications
8. **Checkpoint** — Made sure all backend logic works
9. **API Controllers** — The HTTP endpoints that the frontend calls
10. **Checkpoint** — Made sure the entire backend is solid
11. **Frontend Foundation** — TypeScript models, HTTP services, state management
12. **Frontend Components** — The reusable UI building blocks
13. **Frontend Pages** — The actual screens users interact with
14. **Checkpoint** — Made sure the frontend works end-to-end
15. **Integration Wiring** — Background jobs, interceptors, threshold triggers
16. **Final Checkpoint** — Full integration verified

## Questions to Ask the Developer

- "Show me an opportunity moving from Identified all the way to Acquired in the system"
- "What happens if someone tries to skip a step — say, go straight from Identified to Offer Made?"
- "Show me what the Acquisition Manager sees when they log in"
- "Where does the audit trail live? Can you show me an entry?"
