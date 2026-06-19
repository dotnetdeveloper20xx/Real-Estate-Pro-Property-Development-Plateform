---
inclusion: auto
---

# Reusable Components Review

## Before Creating ANY Component

1. Search the entire project for existing components
2. Check `shared/components/` directory
3. Check feature-specific `components/` directories
4. Ask: Does it already exist? Can it become shared? Will future modules need it?

## Duplicate UI Is Forbidden

If you find the same pattern implemented in multiple places, consolidate into a shared component.

## Components That Should Be Shared

Check whether these exist and are properly reused across features:

- Page header (title + breadcrumb + actions)
- Summary/KPI cards (icon + metric + label + trend)
- Data table (sortable, filterable, paginated)
- Search bar (with debounce)
- Filter panel (with reset + saved views)
- Sort controls
- Pagination (first/prev/pages/next/last + page size)
- Form fields (text, number, email, password, textarea)
- Date picker
- Currency input (with £ prefix and formatting)
- File upload (drag-drop + progress + validation)
- Modal/dialog (confirm, form, info)
- Confirmation dialog (via ConfirmDialogService)
- Stepper (multi-step wizard progress)
- Status badge (colour-coded by status)
- Timeline (chronological activity list)
- Notification bell (with unread count + dropdown)
- Permission directive (show/hide based on role)
- Empty state (icon + message + action button)
- Loading skeleton (table rows, cards, charts)
- Toast notifications (success, error, warning, info)

## Rule

Future modules (Planning, Legal, Construction, Finance, Sales, etc.) MUST benefit from this shared component work. Every component built for Land Acquisition should be generic enough for reuse.
