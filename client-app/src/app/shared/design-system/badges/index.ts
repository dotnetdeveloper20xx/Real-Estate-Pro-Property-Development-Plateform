/**
 * Badge System — Public API
 *
 * Exports all badge components and shared interfaces for the
 * status badge system (status, priority, stage, risk).
 */
export { BaseBadgeComponent } from './base-badge.component';
export type { IBadgeMapEntry, BadgeSize } from './base-badge.component';
export { StatusBadgeComponent } from './status-badge/status-badge.component';
export { PriorityBadgeComponent } from './priority-badge/priority-badge.component';
export { StageBadgeComponent } from './stage-badge/stage-badge.component';
export { RiskBadgeComponent } from './risk-badge/risk-badge.component';
