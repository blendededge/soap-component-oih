import axios, { AxiosError } from 'axios';
import { newMessage } from './messages';
import { createRequest } from './soap';
import { Config, GenericObject, Message, Self } from './types/global';

const DEFAULT_HTTP_ERROR_CODE_REBOUND = new Set([408, 423, 429, 500, 502, 503, 504]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processMethod(self: Self, msg: Message, cfg: Config, snapshot?: GenericObject) {
  const { requestData, requestUrl, formattedHeaders } = createRequest(cfg, self, msg);
  try {
    const { data } = await axios.post(requestUrl, requestData, {
      headers: formattedHeaders,
    });

    if (cfg.saveReceivedData) {
      const response = process.env.ELASTICIO_PUBLISH_MESSAGES_TO ? { data, receivedData: msg.body } : { data, receivedData: msg.data }
      await self.emit('data', newMessage(response));
      await self.emit('end');
    } else {
      await self.emit('data', newMessage(data));
      await self.emit('end');
    }
  } catch (e) {
    self.logger.info('Error while making request to SOAP Client: ', (e as Error).message);
    const reboundErrorCodes = cfg.httpReboundErrorCodes ? new Set(cfg.httpReboundErrorCodes) : DEFAULT_HTTP_ERROR_CODE_REBOUND;
    const err = e as AxiosError & { message?: string };
    const { response, message = '', config } = err;
    if (!response) {
      return;
    }
    if (response && cfg.enableRebound && (reboundErrorCodes.has(response.status)) || message.includes('DNS lookup timeout') ) {
      self.logger.info('Component error: %o', e);
      self.logger.info('Starting rebound');
      await self.emit('rebound', message);
      await self.emit('end');
      return;
    }

    if (cfg.dontThrowErrorFlag && config) {
      const msg = newMessage({ errorMessage: err.message, errorName: err.name, originalRequest: err.config.data });
      await self.emit('data', msg);
      await self.emit('end');
      return;
    }

    if (cfg.dontThrowErrorFlag) {
      const msg = newMessage({ errorMessage: err.message, errorName: err.name });
      await self.emit('data', msg);
      await self.emit('end');
      return;
    }

    await self.emit('error', e);
    await self.emit('end');
  }
}
