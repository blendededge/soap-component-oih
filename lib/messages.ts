import * as uuid from 'uuid';
import { GenericObject, Message } from './types/oih-types';

function newMessage(data: GenericObject, attachments: GenericObject): Message {
  const msg = {
    id: uuid.v4(),
    attachments: attachments || {},
    data,
    headers: {},
    metadata: {},
  };

  return msg;
}

module.exports = {
  newMessage,
};
