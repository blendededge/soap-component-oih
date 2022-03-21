import axios, { AxiosError } from 'axios';
import { newMessage } from './messages';
import { createRequest } from './soap';
import { Config, GenericObject, Message, Self } from './types/global';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processMethod(self: Self, msg: Message, cfg: Config, snapshot?: GenericObject) {
  const { requestData, requestUrl, formattedHeaders } = createRequest(cfg, self, msg);
  try {
    const { data } = await axios.post(requestUrl, requestData, {
      headers: formattedHeaders,
    });

    if (cfg.saveReceivedData) {
      await self.emit('data', newMessage({ data, receivedData: msg.body }));
      await self.emit('end');
    } else {
      await self.emit('data', newMessage(data));
      await self.emit('end');
    }
  } catch (e) {
    self.logger.info('Error while making request to SOAP Client: ', (e as Error).message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (cfg.dontThrowErrorFlag && (e as any).config) {
      const err = (e as AxiosError);
      const msg = newMessage({ errorMessage: err.message, errorName: err.name, originalRequest: err.config.data });
      await self.emit('data', msg);
      await self.emit('end');
    } else if (cfg.dontThrowErrorFlag) {
      const err = (e as Error);
      const msg = newMessage({ errorMessage: err.message, errorName: err.name });
      await self.emit('data', msg);
      await self.emit('end');
    } else {
      await self.emit('error', e);
      await self.emit('end');
    }
  }
}
