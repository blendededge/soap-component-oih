import * as uuid from 'uuid';
import { GenericObject, Message } from './types/global';

export function newMessage(data: GenericObject, attachments?: GenericObject): Message {
  const msg: Message = {
    id: uuid.v4(),
    data: data,
    attachments: attachments || {},
    headers: {},
    metadata: {},
  };

  return msg;
}

module.exports = {
  newMessage,
};
