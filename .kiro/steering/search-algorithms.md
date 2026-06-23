# Search Algorithms

## Purpose

This document defines the search algorithms, scoring strategies, and relevancy rules that power BuildEstate Pro's global search. Every search implementation must follow these standards to ensure consistent, high-quality results across all modules.

---

## Core Principle

Never rely solely on SQL `LIKE '%term%'` queries.

Search quality matters more than simplicity. Implement layered matching with weighted scoring to produce relevant, ranked results.

---

## Matching Strategies (Layered)

Search queries are processed through multiple matching layers. Each layer contributes a score. The final relevancy score is the weighted sum of all matching layers.

### Layer 1: Exact Match (Score Multiplier: 5.0x)

The search term matches a field value exactly (case-insensitive).

```
Query: "Croydon Site A"
Field: "Croydon Site A"
→ Exact match = 5.0 × field weight
```

### Layer 2: Starts With (Score Multiplier: 3.0x)

The field value begins with the search term.

```
Query: "Croyd"
Field: "Croydon Development"
→ Starts with = 3.0 × field weight
```

### Layer 3: Contains (Score Multiplier: 1.5x)

The search term appears anywhere within the field value.

```
Query: "develop"
Field: "Croydon Development Site"
→ Contains = 1.5 × field weight
```

### Layer 4: Token Matching (Score Multiplier: 2.0x per token)

The query is split into tokens (words). Each token is matched independently against the field. All tokens must match somewhere in the entity for a result to qualify.

```
Query: "croydon residential"
Field Name: "Croydon Site"
Field Type: "Residential"
→ Both tokens match across fields = 2.0 × count of matched tokens
```

### Layer 5: Fuzzy Matching (Score Multiplier: 0.8x)

Levenshtein distance ≤ 2 for short words (≤ 6 chars) or ≤ 3 for longer words.

```
Query: "croyd"
Field: "Croydon"
→ Levenshtein distance = 2, within threshold = 0.8 × field weight
```

### Layer 6: Phonetic Matching (Score Multiplier: 0.5x)

Soundex or Double Metaphone comparison for words that sound similar.

```
Query: "smithe"
Field: "Smith"
→ Same Soundex = 0.5 × field weight
```

### Layer 7: Synonym Matching (Score Multiplier: 0.7x)

Predefined synonym dictionary matches.

```
Query: "flat"
Synonym: "apartment", "unit"
Field: "2 Bedroom Apartment"
→ Synonym match = 0.7 × field weight
```

---

## Scoring Formula

```
FinalScore = Σ (MatchScore × FieldWeight × LayerMultiplier) + BoostScore
```

Where:
- **MatchScore**: 1.0 if matched, 0.0 if not (per layer)
- **FieldWeight**: As defined in module registration (e.g., Name = 2.0, Status = 1.0)
- **LayerMultiplier**: As defined above (5.0 for exact, 3.0 for starts-with, etc.)
- **BoostScore**: Additional points from boosting rules

---

## Boosting Rules

| Condition | Boost Points |
|-----------|-------------|
| Entity was recently viewed by this user | +2.0 |
| Entity was recently modified (< 7 days) | +1.5 |
| Entity is "active" status | +1.0 |
| Entity was created by this user | +0.5 |
| Entity matches user's department/module | +1.0 |
| Entity is popular (frequently accessed) | +0.8 |

---

## Field Weight Guidelines

| Field Type | Recommended Weight | Rationale |
|------------|-------------------|-----------|
| Unique identifiers (reference numbers, registry refs) | 2.5 - 3.0 | Users often search by exact reference |
| Names / Titles | 2.0 - 2.5 | Primary human identifier |
| Locations / Addresses | 1.5 - 2.0 | Common search criterion in real estate |
| Status values | 1.0 - 1.5 | Useful for filtering but not primary search |
| Descriptions / Notes | 0.8 - 1.0 | Supporting context, not primary |
| Tags / Categories | 1.0 - 1.5 | Useful for categorical search |
| Monetary values | 0.5 - 0.8 | Rarely searched by exact value |
| Dates | 0.3 - 0.5 | Usually filtered, not text-searched |

---

## String Normalization

Before matching, normalize both the query and field values:

1. Convert to lowercase
2. Remove leading/trailing whitespace
3. Collapse multiple spaces to single space
4. Remove diacritical marks (é → e, ñ → n)
5. Expand common abbreviations (configurable dictionary)

---

## Synonym Dictionary (Initial)

```json
{
  "flat": ["apartment", "unit"],
  "house": ["dwelling", "property", "home"],
  "land": ["site", "plot", "parcel"],
  "planning": ["permission", "consent", "approval"],
  "legal": ["compliance", "regulatory", "statutory"],
  "finance": ["budget", "cost", "financial"],
  "construction": ["build", "development", "works"],
  "owner": ["proprietor", "landlord"],
  "tenant": ["lessee", "occupier", "renter"],
  "contract": ["agreement", "deed"],
  "purchase": ["acquisition", "buy"],
  "sale": ["disposal", "sell"],
  "risk": ["issue", "concern", "threat"],
  "document": ["file", "attachment", "record"],
  "project": ["scheme", "development"],
  "inspection": ["survey", "assessment", "review"]
}
```

This dictionary must be extended as new modules are added.

---

## Query Parsing Rules

### Single Word Query
- Apply all layers against all searchable fields
- Return results sorted by score descending

### Multi-Word Query
- Split by whitespace
- Each token must match at least one field in the entity (AND logic)
- Score = sum of individual token scores
- Bonus: +1.0 if all tokens match within the same field

### Quoted Query ("exact phrase")
- Treat as single token (do not split)
- Apply exact and contains matching only
- Higher precision, lower recall

### Prefix Query (word*)
- Apply starts-with matching on the prefix
- Useful for autocomplete suggestions

---

## Performance Requirements

| Metric | Target | Maximum |
|--------|--------|---------|
| Quick search (< 3 chars) | 100ms | 200ms |
| Standard search (3+ chars) | 200ms | 300ms |
| Advanced search (with filters) | 250ms | 400ms |
| Count per category | 100ms | 200ms |
| Autocomplete suggestions | 50ms | 150ms |

### Optimization Strategies

1. **Database indexes** on all searchable fields
2. **Full-text indexes** for description/notes fields (SQL Server FTS)
3. **Precomputed search vectors** for complex scoring (denormalized)
4. **Caching** recent/popular search results (short TTL: 30-60 seconds)
5. **Parallel provider execution** — query all module providers concurrently
6. **Early termination** — stop searching once maxResults reached per category
7. **Pagination** — never load all results at once

---

## Relevancy Testing Requirements

For every searchable entity, verify these test cases pass:

| Test Case | Expected Behavior |
|-----------|-------------------|
| Exact name search | Returns as #1 result |
| Partial name (first 3 chars) | Returns within top 3 |
| Misspelled name (1 char off) | Returns within top 5 |
| Status search ("active") | Returns all matching entities |
| Multi-word across fields | Returns correct entity |
| Out-of-order words | Returns correct entity |
| Reference number search | Returns exact match as #1 |
| Similar sounding name | Returns within top 10 |

---

## Algorithm Evolution

As the platform grows, evaluate:

1. **Trigram indexing** — for better partial matching at scale
2. **TF-IDF scoring** — for description/document content
3. **Elasticsearch/Meilisearch** — when SQL FTS reaches limits
4. **ML-based ranking** — learn from user click-through behavior
5. **Vector embeddings** — semantic search for documents

These are future enhancements. The initial implementation must use SQL Server capabilities (FTS + application-layer scoring) to avoid infrastructure complexity.
