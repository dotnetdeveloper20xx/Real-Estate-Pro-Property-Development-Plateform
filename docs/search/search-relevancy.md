# Search Relevancy Guide

## Overview

Search relevancy determines how well results match user intent. This document defines relevancy standards, testing methodology, and continuous improvement practices for BuildEstate Pro's global search.

---

## Relevancy Principles

1. **The right result must appear in the top 3** — Users should not scroll to find what they need
2. **Partial information must still find results** — Users rarely type complete names
3. **Typos must not prevent finding results** — Fuzzy matching handles human error
4. **Context matters** — A Finance Director searching "budget" expects different results than a Site Manager
5. **Recency matters** — Recently modified items are more likely to be what users want

---

## Relevancy Tiers

### Tier 1: Perfect Match (Score 90-100)

User types the exact name, reference number, or unique identifier.

**Expected behaviour:** Exact entity appears as result #1, immediately.

Examples:
- `"LN-2024-001"` → Exact land opportunity with that reference
- `"Croydon Development Site A"` → Exact opportunity with that name
- `"john.smith@company.com"` → Exact user with that email

### Tier 2: Strong Match (Score 70-89)

User types a significant portion of the name or key identifier.

**Expected behaviour:** Correct entity appears within top 3 results.

Examples:
- `"Croydon"` → All Croydon-related opportunities, with most recent/active first
- `"John Smith"` → User with that name as #1
- `"Planning APP"` → Planning applications matching "APP"

### Tier 3: Reasonable Match (Score 50-69)

User provides partial information, abbreviated terms, or related keywords.

**Expected behaviour:** Correct entity appears within top 5 results.

Examples:
- `"croyd"` → Croydon entities via starts-with matching
- `"plan app"` → Planning applications via token matching
- `"legal doc"` → Legal documents via multi-token matching

### Tier 4: Fuzzy Match (Score 30-49)

User makes typos or uses approximate terms.

**Expected behaviour:** Correct entity appears within top 10 results.

Examples:
- `"Croydun"` → Croydon entities via Levenshtein distance
- `"Jhon"` → John via fuzzy matching
- `"aqusition"` → Acquisition entities via phonetic/fuzzy

### Tier 5: Synonym Match (Score 20-39)

User uses different terminology for the same concept.

**Expected behaviour:** Related entities appear in results.

Examples:
- `"flat"` → Property units (synonym: apartment, unit)
- `"permission"` → Planning applications (synonym: planning, consent)
- `"plot"` → Land opportunities (synonym: land, site, parcel)

---

## Relevancy Test Suite

### Test Format

Each test case follows this structure:

```
Query: "{search term}"
Expected Entity: {entity type} — {entity name/identifier}
Expected Position: Top {N}
Matching Strategy: {which layer should match}
```

### Land Acquisition Tests

| # | Query | Expected Result | Position | Strategy |
|---|-------|----------------|----------|----------|
| 1 | "Croydon Site A" | LandOpportunity: Croydon Site A | #1 | Exact |
| 2 | "Croydon" | All Croydon opportunities | Top 3 | Contains |
| 3 | "croyd" | Croydon opportunities | Top 5 | Starts-with |
| 4 | "Croydun" | Croydon opportunities | Top 10 | Fuzzy |
| 5 | "site plot" | Land opportunities | Top 5 | Synonym + Token |
| 6 | "LN-2024-001" | Specific opportunity by ref | #1 | Exact |
| 7 | "residential croydon" | Residential opportunity in Croydon | Top 3 | Token (out-of-order) |
| 8 | "john mitchell" | Land owner John Mitchell | #1 | Token |
| 9 | "due diligence pending" | DD items with Pending status | Top 5 | Token |
| 10 | "offer accepted" | Accepted offers | Top 5 | Token |

### Planning Tests

| # | Query | Expected Result | Position | Strategy |
|---|-------|----------------|----------|----------|
| 1 | "PA/2024/0001" | Planning application by reference | #1 | Exact |
| 2 | "planning croydon" | Croydon planning applications | Top 3 | Token |
| 3 | "approved" | Approved planning applications | Top 5 | Status match |
| 4 | "condition discharge" | Conditions with discharge status | Top 5 | Token |

### User Tests

| # | Query | Expected Result | Position | Strategy |
|---|-------|----------------|----------|----------|
| 1 | "john.smith@company.com" | User by email | #1 | Exact |
| 2 | "John Smith" | User by name | #1 | Token |
| 3 | "acquisition manager" | Users with that role | Top 3 | Token |
| 4 | "finance" | Finance Director users + finance entities | Top 5 | Contains + Module |

### Document Tests

| # | Query | Expected Result | Position | Strategy |
|---|-------|----------------|----------|----------|
| 1 | "title deed croydon" | Title deed document for Croydon site | Top 3 | Token |
| 2 | "environmental report" | Environmental reports | Top 3 | Token |
| 3 | ".pdf" | PDF documents | Top 10 | Contains |

---

## Scoring Validation

### How to Verify Scoring

For each test query, verify:

1. **Score breakdown is explainable** — Can you explain why result #1 scored higher than #2?
2. **No score inversions** — An exact match must never score lower than a fuzzy match
3. **Field weights respected** — Name matches score higher than description matches
4. **Boosts applied correctly** — Recent items get appropriate boost
5. **Cross-module fairness** — One module's results don't unfairly dominate

### Score Debugging Endpoint (Development Only)

```
GET /api/v1/search/debug?q={query}
```

Returns full scoring breakdown per result:
```json
{
  "results": [
    {
      "entity": "Croydon Site A",
      "finalScore": 14.5,
      "breakdown": {
        "exactMatch": { "field": "Name", "weight": 2.0, "multiplier": 5.0, "contribution": 10.0 },
        "recencyBoost": 1.5,
        "popularityBoost": 0.8,
        "statusBoost": 1.0,
        "userAffinityBoost": 1.2
      }
    }
  ]
}
```

This endpoint is disabled in production.

---

## Continuous Improvement

### Metrics to Track (Future)

| Metric | Description | Target |
|--------|-------------|--------|
| Click-through rate | % of searches that result in a click | > 80% |
| Position of clicked result | Average position of the result user clicks | < 3.0 |
| Zero-result rate | % of searches with no results | < 5% |
| Refinement rate | % of searches followed by another search | < 20% |
| Time to click | Average time from results displayed to click | < 3 seconds |

### Improvement Process

1. **Monitor** — Track search queries and click patterns
2. **Identify** — Find queries with poor relevancy (low CTR, high position)
3. **Diagnose** — Use debug endpoint to understand scoring
4. **Adjust** — Modify weights, add synonyms, or improve matching
5. **Validate** — Re-run relevancy test suite
6. **Deploy** — Ship improvement and continue monitoring

### When to Add Synonyms

Add a synonym pair when:
- Users search for term A but the data uses term B
- Zero-result searches contain common alternative terms
- Domain experts identify equivalent terminology
- Multiple users search for the same unsupported term

### When to Adjust Weights

Adjust field weights when:
- Users click results that scored lower than expected
- Important entities consistently appear too low
- A new field is more useful for finding entities than originally estimated

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Correct Approach |
|--------------|--------------|-----------------|
| SQL LIKE only | No ranking, no fuzzy, no synonyms | Layered matching with scoring |
| Equal weights on all fields | Name and description treated the same | Weight primary identifiers higher |
| No permission filtering | Information leakage | Server-side filtering mandatory |
| Client-side filtering | Loads all data, exposes unauthorized | Server-side filtering and pagination |
| Highlighting in database | Performance cost, XSS risk | Application-layer highlighting with encoding |
| Caching without invalidation | Stale results | Short TTL (30-60s) or event-based invalidation |
| No empty state UX | Confusing when no results | Helpful message with suggestions |
