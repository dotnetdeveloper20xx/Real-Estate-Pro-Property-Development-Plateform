---
inclusion: auto
---

# Fake Feature Detection

## What Is A Fake Feature?

Anything that gives the illusion of working but does not actually perform the intended business action.

## Detection Checklist

Before declaring any feature complete, search for:

- [ ] Buttons that show a toast but call no API
- [ ] Export buttons that don't generate files
- [ ] Delete buttons that don't delete
- [ ] Bulk actions that only clear selection
- [ ] Charts with hardcoded data
- [ ] Counts that are computed client-side from partial data
- [ ] Notifications that are never sent
- [ ] Tabs that render empty content
- [ ] Links that go nowhere
- [ ] Routes that 404
- [ ] Forms that swallow errors silently (`error: () => {}`)
- [ ] setTimeout used instead of proper event subscription
- [ ] window.prompt() or window.confirm() instead of proper modals
- [ ] localStorage used for data that should come from a service
- [ ] Raw HttpClient calls bypassing typed services
- [ ] NgRx store that exists but is never connected to components
- [ ] Services that exist but are never called
- [ ] Endpoints that exist but frontend never reaches

## If Found

STOP. This is a critical defect. Fix immediately before any other work.
