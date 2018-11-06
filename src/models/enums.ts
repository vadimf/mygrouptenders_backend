// Enums goes here...

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
