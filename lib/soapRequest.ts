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

    const msg = newMessage(data);
    await self.emit('data', msg);
    await self.emit('end');
  } catch (e) {
    self.logger.info('Error while making request to SOAP Client: ', (e as AxiosError).message);
    if (cfg.dontThrowErrorFlag) {
      const msg = newMessage({ errorMessage: (e as AxiosError).message, errorName: (e as AxiosError).name, originalRequest: (e as AxiosError).config.data });
      await self.emit('data', msg);
      await self.emit('end');
    } else {
      await self.emit('error', e);
      await self.emit('end');
    }
  }
}
