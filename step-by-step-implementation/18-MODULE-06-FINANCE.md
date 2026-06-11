# Phase 18: Module 6 — Finance & Budget Control

## Business Context

The Finance Director needs to know: "Are we making money?" Every project has a budget. Costs are tracked against it. Cash flow is monitored. This module touches every other module because money flows through everything.

---

## Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `BudgetLine` | Budget item | ProjectId, Category, Description, PlannedAmount, ActualAmount, Status |
| `FinancialTransaction` | Money movement | ProjectId, Type, Category, Amount, Date, Description, Reference |
| `Investor` | External funding source | Name, Type, CommittedAmount, DrawnAmount, KycStatus |

---

## Transaction Types

```csharp
public enum TransactionType
{
    LandPurchase = 0,       // Buying land
    ProfessionalFees = 1,   // Architects, surveyors, legal
    ConstructionCost = 2,   // Materials, labour
    SalesRevenue = 3,       // Unit sales income
    RentalIncome = 4,       // Rental income
    FinanceCost = 5,        // Interest, fees
    Marketing = 6,          // Sales & marketing spend
    Overheads = 7,          // General admin
    InvestorDrawdown = 8,   // Money from investors
    InvestorRepayment = 9   // Money back to investors
}
```

---

## API Endpoints

```
├── /api/v1/finance                    → List transactions (paginated, filterable)
├── /api/v1/finance/{id}               → Transaction detail
├── /api/v1/finance                    → Create transaction
├── /api/v1/finance/{id}               → Update transaction
├── /api/v1/finance/budget/{projectId} → Budget lines for a project
├── /api/v1/finance/summary/{projectId}→ Financial summary (budget vs actual)
├── /api/v1/investors                  → CRUD for investors
└── /api/v1/investors/{id}             → Investor detail with transactions
```

---

## Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| Finance List | `/finance` | All transactions with category filter |
| Transaction Form | `/finance/new` | Record new transaction |
| Finance Detail | `/finance/:id` | Transaction details |
| Finance Edit | `/finance/:id/edit` | Edit transaction |
| Investor List | `/investors` | All investors |
| Investor Form | `/investors/new` | Register new investor |
| Investor Detail | `/investors/:id` | Investor profile + transactions |

---

## Business Rules

1. Transaction amount must be positive
2. Revenue types increase project value, cost types decrease it
3. Budget variance > 10% → automatic warning flag
4. Investor drawdown cannot exceed committed amount
5. All transactions must reference a project
6. Financial data is read-only for most roles (only FinanceDirector can create/edit)

---

## Dashboard Widgets

- **Budget vs Actual** — Bar chart per category
- **Cash Flow** — Line chart (money in vs money out over time)
- **Profitability** — Revenue minus costs = profit (per project)
- **Variance Alerts** — Categories over budget highlighted red
- **Investor Summary** — Total committed, drawn, remaining

---

## Calculated Fields (Query-Time)

```
Total Budget = SUM(BudgetLine.PlannedAmount)
Total Spent = SUM(FinancialTransaction WHERE Type = Cost)
Total Revenue = SUM(FinancialTransaction WHERE Type = Revenue)
Variance = Total Budget - Total Spent
Profit = Total Revenue - Total Spent
ROI = (Profit / Total Spent) × 100
```

These are calculated in query handlers, not stored in the database.
