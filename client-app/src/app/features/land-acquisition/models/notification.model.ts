/**
 * Notification event types mirroring the backend NotificationEventType enum.
 * Used to drive notification icon rendering and categorization.
 */
export enum NotificationEventType {
  StatusChange = 'StatusChange',
  ApprovalRequest = 'ApprovalRequest',
  OfferExpiry = 'OfferExpiry',
  DueDiligenceFailure = 'DueDiligenceFailure',
  ContractSigned = 'ContractSigned'
}

/**
 * Notification entity returned from the notifications API.
 * Represents an in-app notification for key acquisition events.
 */
export interface INotification {
  readonly id: string;
  readonly eventType: NotificationEventType;
  readonly title: string;
  readonly description: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly isRead: boolean;
  readonly createdAt: string;
}
