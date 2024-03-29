import { createHash } from 'crypto';
import axios, { AxiosError } from 'axios';
import { rateLimit } from './helper';
import { newMessage } from './messages';
import { createRequest } from './soap';
import { GenericObject, Message, Self } from './types/global';
import { Config } from '@blendededge/ferryman-extensions/lib/ferryman-types';

const DEFAULT_HTTP_ERROR_CODE_REBOUND = new Set([408, 423, 429, 500, 502, 503, 504]);

async function emitEnd(self: Self, delay: number): Promise<void> {
  await rateLimit(self.logger, delay);
  self.emit('end');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processMethod(self: Self, msg: Message, cfg: Config, snapshot?: GenericObject) {
  let rateLimitDelay;
  try {
    self.logger.info('Starting SOAP request');
    const { requestData, requestUrl, formattedHeaders } = createRequest(cfg, self, msg);
    rateLimitDelay = cfg.rateLimitInMs ?? 0;
      const { data } = await axios.post(requestUrl, requestData, {
      headers: formattedHeaders,
    });
    self.logger.debug(`Response: ${data}`);
    self.logger.info(`SOAP response length: ${data.length}`);
    if (cfg.logResponseHash) {
      try {
        const hash = createHash('md5').update(data).digest('hex');
        self.logger.info(`SOAP response hash: ${hash}`)
      } catch (e) {
        self.logger.error(`Unable to hash SOAP response data: ${e}`);
      }
    }
    if (cfg.saveReceivedData) {
      const response = process.env.ELASTICIO_PUBLISH_MESSAGES_TO ? { data, receivedData: msg.body } : { data, receivedData: msg.data }
      await self.emit('data', newMessage(response));
      await emitEnd(self, rateLimitDelay);
      return;
    }

    await self.emit('data', newMessage(data));
    await emitEnd(self, rateLimitDelay);
    self.logger.info('SOAP request finished');
    return;
  } catch (e) {
    self.logger.info('Error while making request to SOAP Client: ', (e as Error).message);
    const reboundErrorCodes = cfg.httpReboundErrorCodes ? new Set(cfg.httpReboundErrorCodes) : DEFAULT_HTTP_ERROR_CODE_REBOUND;
    const err = e as AxiosError & { message?: string };
    const { response, message = '', config } = err;
    if (response && cfg.enableRebound && (reboundErrorCodes.has(response.status)) || message.includes('DNS lookup timeout') ) {
      self.logger.info('Component error: %o', e);
      self.logger.info('Starting rebound');
      await self.emit('rebound', message);
      await emitEnd(self, rateLimitDelay);
      return;
    }

    if (cfg.dontThrowErrorFlag && config) {
      self.logger.info('Component error: %o', e);
      self.logger.info('dontThrowErrorFlag set, sending to next step')
      const msg = newMessage({ errorMessage: err.message, errorName: err.name, originalRequest: err?.config?.data });
      await self.emit('data', msg);
      await emitEnd(self, rateLimitDelay);
      return;
    }

    if (cfg.dontThrowErrorFlag) {
      self.logger.info('Component error: %o', e);
      self.logger.info('dontThrowErrorFlag set, sending to next step')
      const msg = newMessage({ errorMessage: err.message, errorName: err.name });
      await self.emit('data', msg);
      await emitEnd(self, rateLimitDelay);
      return;
    }

    await self.emit('error', e);
    await emitEnd(self, rateLimitDelay);
  }
}
