// Enums goes here...

export enum UserRole {
  All,
  Client,
  Provider
}

export enum OrderStatus {
  Placed,
  InProgress,
  Completed,
  Removed,
  TerminatedByClient
}

export enum BidStatus {
  Placed,
  Rejected,
  Approved,
  TerminatedByClient,
  TerminatedByProvider,
  Removed
}

export enum NotificationStatus {
  Created,
  Removed
}

export enum NotificationType {
  OrderExpired,
  BidPlaced,
  BidApproved,
  OrderExpiresInOneHour,
  BidDecreased,
  BidIncreased,
  OrderCompleted,
  OrderCanceled
}
