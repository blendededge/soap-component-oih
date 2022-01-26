import axios from 'axios';
import { newMessage } from './messages';
import { AxiosRequestHeaders } from 'axios';
import { transform } from '@openintegrationhub/ferryman';
import { Config, GenericObject, Message, Self, Auth, Headers } from './types/global';

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

function createSoapEnvelope(input: string, action?: string, headers?: Array<string>): string {
  let soapHeaders;
  if (headers) {
    soapHeaders = generateSoapHeaders(headers)
  }

  return `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
  <soap:Header>
  ${action ? `<SOAPAction>${action}</SOAPAction>` : ''}
  ${soapHeaders ? soapHeaders : ''}
  </soap:Header>
  <soap:Body>${input}</soap:Body>
  </soap:Envelope>`;
}

function generateSoapHeaders(headers: Array<string>): string {
  return headers.reduce((headerString, currentHeader) => {
      return currentHeader + headerString
  }, '');
}

const authTypes = {
  NO_AUTH: 'No Auth',
  BASIC: 'Basic Auth',
  API_KEY: 'API Key Auth',
  OAUTH2: 'OAuth2',
  };

function getAuthFromSecretConfig(cfg: Config, self: Self) {
  const {
    username, passphrase, key, headerName, accessToken, secretAuthTransform,
  } = cfg;
  const returnConfig = { ...cfg };
  const auth: Auth = returnConfig.auth || {}

  // Use JSONata to populate cfg.auth object, works for all types but especially helpful for the MIXED type
  if (secretAuthTransform) {
    returnConfig.auth = transform(cfg, { customMapping: secretAuthTransform });
    self.logger.debug(`helpers.getAuthFromSecretConfig: after transforming auth config: ${JSON.stringify(returnConfig)}`);
    return returnConfig;
  }
  // Found username and password, authenticate with basic authentication
  if (username && passphrase) {
    auth.basic = auth.basic ? auth.basic : { username: '', password: '' };
    auth.type = authTypes.BASIC;
    auth.basic.username = username;
    auth.basic.password = passphrase;
  }
  // Found API_KEY type
  if (key && headerName) {
    auth.type = authTypes.API_KEY;
    auth.apiKey = auth.apiKey ? auth.apiKey : { headerName: '', headerValue: '' };
    auth.apiKey.headerName = headerName;
    auth.apiKey.headerValue = key;
  }
  // Found an accessToken from OA1_TWO_LEGGED, OA1_THREE_LEGGED, OA2_AUTHORIZATION_CODE, or SESSION_AUTH types
  if (accessToken) {
    auth.type = authTypes.OAUTH2;
    auth.oauth2 = auth.oauth2 ? auth.oauth2 : { keys: { access_token: '' } };
    auth.oauth2.keys = auth.oauth2.keys ? auth.oauth2.keys : { access_token: '' };
    auth.oauth2.keys.access_token = accessToken;
  }
  returnConfig.auth = auth;
  self.logger.debug(`helpers.getAuthFromSecretConfig: config object is now: ${JSON.stringify(returnConfig)}`);
  return returnConfig;
  }

  function populateAuthHeaders(auth: Auth, self: Self, bearerToken: string, headers?: Array<Headers>,): Array<Headers> {
      const newHeaders = [];
      if (headers) {
        newHeaders.push(...headers)
      }

      switch (auth.type) {
        case authTypes.BASIC:
            newHeaders.push({
            key: 'Authorization',
            value: `"Basic ${Buffer.from(
              `${auth.basic?.username}:${auth.basic?.password}`,
              'utf8',
            ).toString('base64')}"`,
          });
          break;

        case authTypes.API_KEY:
            newHeaders.push({
            key: auth.apiKey?.headerName,
            value: `"${auth.apiKey?.headerValue}"`,
          });
          break;

        case authTypes.OAUTH2:
          self.logger.trace('auth = %j', auth);
          newHeaders.push({
            key: 'Authorization',
            value: `"Bearer ${bearerToken}"`,
          });
          break;

        default:
      }

      return newHeaders
  }
