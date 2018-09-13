import uuid = require('uuid/v4');

export const uuidv4 = (): string => {
  return uuid();
};
