/**
 * Notification event types - now supports dynamic event types from the notification engine.
 * The enum is kept for backward compatibility but the panel handles any string gracefully.
 */
export enum NotificationEventType {
  StatusChange = 'StatusChange',
  ApprovalRequest = 'ApprovalRequest',
  OfferExpiry = 'OfferExpiry',
  DueDiligenceFailure = 'DueDiligenceFailure',
  ContractSigned = 'ContractSigned',
  OpportunityCreated = 'OpportunityCreated',
  OpportunityStatusChanged = 'OpportunityStatusChanged',
  OpportunityAcquired = 'OpportunityAcquired',
  OpportunityWithdrawn = 'OpportunityWithdrawn',
  OfferSubmitted = 'OfferSubmitted',
  OfferAccepted = 'OfferAccepted',
  OfferExpired = 'OfferExpired',
  DueDiligenceCompleted = 'DueDiligenceCompleted',
  DueDiligenceFailed = 'DueDiligenceFailed',
  ApprovalRequested = 'ApprovalRequested',
  ApprovalDecided = 'ApprovalDecided',
  ContractExchanged = 'ContractExchanged',
  DocumentUploaded = 'DocumentUploaded'
}

/**
 * Notification entity returned from the notifications API.
 * Represents an in-app notification for key business events.
 */
export interface INotification {
  readonly id: string;
  readonly eventType: string;
  readonly title: string;
  readonly description: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly isRead: boolean;
  readonly createdAt: string;
}
