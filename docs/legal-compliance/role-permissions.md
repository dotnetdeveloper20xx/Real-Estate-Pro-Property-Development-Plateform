# Legal & Compliance Module — Role Permissions

## Role Overview

| Role | Primary Responsibility | Access Level |
|------|----------------------|--------------|
| Legal & Compliance Officer | Full module management | Full CRUD on all entities |
| Finance Director | Contract approval, financial oversight | Approve high-value contracts, read access |
| Acquisition Manager | Monitor cases linked to opportunities | Read-only on linked cases/contracts |
| Admin/Support | Data entry, documentation | Create/update cases, upload documents |

---

## Detailed Permission Matrix

### Legal Cases

| Action | Legal Officer | Finance Director | Acquisition Manager | Admin/Support |
|--------|:---:|:---:|:---:|:---:|
| Create case | ✅ | ❌ | ❌ | ✅ |
| Update case | ✅ | ❌ | ❌ | ✅ |
| Transition status | ✅ | ❌ | ❌ | ✅ |
| View case list | ✅ | ✅ | ✅ | ✅ |
| View case detail | ✅ | ✅ | ✅ | ✅ |
| View pipeline | ✅ | ❌ | ❌ | ❌ |
| View summaries | ✅ | ✅ | ✅ | ✅ |

### Contracts

| Action | Legal Officer | Finance Director | Acquisition Manager | Admin/Support |
|--------|:---:|:---:|:---:|:---:|
| Create contract | ✅ | ❌ | ❌ | ❌ |
| Update contract | ✅ | ❌ | ❌ | ❌ |
| Transition status | ✅ | ✅ | ❌ | ❌ |
| Approve high-value (>£50k) | ❌ | ✅ | ❌ | ❌ |
| View contract list | ✅ | ✅ | ✅ | ✅ |
| View contract detail | ✅ | ✅ | ✅ | ✅ |
| View register | ✅ | ✅ | ✅ | ✅ |

### Compliance Requirements

| Action | Legal Officer | Finance Director | Acquisition Manager | Admin/Support |
|--------|:---:|:---:|:---:|:---:|
| Create requirement | ✅ | ❌ | ❌ | ❌ |
| Update requirement | ✅ | ❌ | ❌ | ❌ |
| Retire/supersede | ✅ | ❌ | ❌ | ❌ |
| View checklist | ✅ | ✅ | ✅ | ✅ |
| View summary | ✅ | ❌ | ❌ | ❌ |

### Compliance Checks

| Action | Legal Officer | Finance Director | Acquisition Manager | Admin/Support |
|--------|:---:|:---:|:---:|:---:|
| Record check | ✅ | ❌ | ❌ | ✅ |
| View check history | ✅ | ✅ | ✅ | ✅ |

### Insurance Records

| Action | Legal Officer | Finance Director | Acquisition Manager | Admin/Support |
|--------|:---:|:---:|:---:|:---:|
| Create record | ✅ | ❌ | ❌ | ✅ |
| Update record | ✅ | ❌ | ❌ | ✅ |
| Transition status | ✅ | ❌ | ❌ | ❌ |
| Renew policy | ✅ | ❌ | ❌ | ❌ |
| View list | ✅ | ✅ | ✅ | ✅ |
| View detail | ✅ | ✅ | ✅ | ✅ |

### Audit Records

| Action | Legal Officer | Finance Director | Acquisition Manager | Admin/Support |
|--------|:---:|:---:|:---:|:---:|
| Create audit | ✅ | ❌ | ❌ | ❌ |
| Transition status | ✅ | ❌ | ❌ | ❌ |
| View list | ✅ | ✅ | ✅ | ✅ |
| View detail | ✅ | ✅ | ✅ | ✅ |

### Legal Documents

| Action | Legal Officer | Finance Director | Acquisition Manager | Admin/Support |
|--------|:---:|:---:|:---:|:---:|
| Upload document | ✅ | ✅ | ✅ | ✅ |
| Upload new version | ✅ | ✅ | ✅ | ✅ |
| Delete document | ✅ | ❌ | ❌ | ❌ |
| View documents | ✅ | ✅ | ✅ | ✅ |
| View Restricted docs | ✅ | ❌ | ❌ | ❌ |

### Dashboard & Audit Trail

| Action | Legal Officer | Finance Director | Acquisition Manager | Admin/Support |
|--------|:---:|:---:|:---:|:---:|
| View dashboard | ✅ | ❌ | ❌ | ❌ |
| Query audit trail | ✅ | ❌ | ❌ | ❌ |
| Export audit trail (CSV) | ✅ | ❌ | ❌ | ❌ |

---

## Access Denied Behaviour

- **Unauthenticated users** → HTTP 401 Unauthorized (redirected to login)
- **Authenticated users without required role** → HTTP 403 Forbidden (access denied page shown)
- **Acquisition Managers** can only see cases/contracts linked to their assigned opportunities
