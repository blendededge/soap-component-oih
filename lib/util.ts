import axios from 'axios';
import { newMessage } from './messages';
import { AxiosRequestHeaders } from 'axios';
import { transform } from '@openintegrationhub/ferryman';
import { createSoapEnvelope } from './soap';
import { getAuthFromSecretConfig } from './secret';
import { populateAuthHeaders } from './http';
import { Config, GenericObject, Message, Self, Headers } from './types/global';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processMethod(self: Self, msg: Message, cfg: Config, snapshot?: GenericObject) {
    const { endpointUrl, soapAction, httpHeaders, soapHeaders } = cfg;
    const xml = msg.data.xml;

    const { auth } = getAuthFromSecretConfig(cfg, self);
    const bearerToken = (auth && auth.oauth2 && auth.oauth2.keys && auth.oauth2.keys.access_token ? auth.oauth2.keys.access_token : '');

    let requestHeaders: Array<Headers> = [];
    if (auth) {
      requestHeaders = populateAuthHeaders(auth, self, bearerToken, httpHeaders);
    }
    requestHeaders.push(
      {
          key: 'content-type',
          value: 'text/xml;charset=UTF-8'
      }
    )

    if (soapAction) {
      requestHeaders.push({
        key: 'soapaction',
        value: soapAction
      })
    }

    const formattedHeaders: AxiosRequestHeaders = {};
    if (requestHeaders && requestHeaders.length) {
      requestHeaders.forEach(header => {
        if (!header.key || !header.value) {
          return;
        }
        formattedHeaders[header.key.toLowerCase()] = header.value;
      })
    }

    const requestUrl = transform(msg, { customMapping: endpointUrl });

    const requestData = createSoapEnvelope((xml as string), soapAction, soapHeaders);
    console.log(JSON.stringify(requestUrl))

    try {
      const { data } = await axios.post(requestUrl, requestData, {
        headers: formattedHeaders,
      });

      const msg = newMessage(data);

      await self.emit('data', msg);
      await self.emit('end');
    } catch (e) {
      self.logger.info('Error while making request to SOAP Client: ', (e as Error).message);
      await self.emit('error', e);
      await self.emit('end')
    }
}
