import * as uuid from 'uuid';
import { GenericObject, Message } from './types/global';

export function newMessage(data: GenericObject, attachments?: GenericObject): Message {
  const msg: Message = {
    id: uuid.v4(),
    attachments: attachments || {},
    headers: {},
    metadata: {},
  };

  if (process.env.ELASTICIO_PUBLISH_MESSAGES_TO) {
    msg.body = data;
  } else {
    msg.data = data;
  }

  return msg;
}

module.exports = {
  newMessage,
};
