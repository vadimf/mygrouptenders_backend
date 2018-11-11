import { Document, model, Schema, Types } from 'mongoose';

import { NotificationStatus, NotificationType, UserRole } from '../enums';
import { IUserDocument } from '../user/user';
import {
  INotificationDataDocument,
  NotificationDataSchema
} from './notification-data';

export interface INotificationDocument extends Document {
  status: NotificationStatus;
  user: Types.ObjectId | IUserDocument;
  for: UserRole;
  type: NotificationType;
  tokens: string[];
  data?: INotificationDataDocument;
  success?: any;
  error?: any;
  sentByAdministrator?: boolean;
}

export const NotificationSchema = new Schema(
  {
    status: {
      type: Schema.Types.Number,
      default: NotificationStatus.Created
    },
    user: {
      type: Schema.Types.ObjectId
    },
    for: {
      type: Schema.Types.Number,
      required: true
    },
    type: {
      type: Schema.Types.Number,
      required: true
    },
    data: NotificationDataSchema,
    tokens: {
      type: [Schema.Types.String],
      required: true
    },
    success: {
      type: Schema.Types.Mixed,
      default: null
    },
    error: {
      type: Schema.Types.Mixed,
      default: null
    },
    sentByAdministrator: {
      type: Schema.Types.Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.set('toJSON', { versionKey: false });

NotificationSchema.pre<INotificationDocument>('save', function(next) {
  this.status = this.isNew ? NotificationStatus.Created : this.status;

  next();
});

export const Notification = model<INotificationDocument>(
  'Notification',
  NotificationSchema
);
