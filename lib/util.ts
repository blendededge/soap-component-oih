import { Config, GenericObject, Message, Self, Auth, AuthType, ApiKey, Basic, OAuth2 } from './types/oih-types';
import axios from 'axios';
import { transform } from '@openintegrationhub/ferryman';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processMethod(self: Self, msg: Message, cfg: Config, snapshot?: GenericObject) {
    const { endpointUrl, soapAction } = cfg;
    const { xml } = msg.data;

    const METHOD = 'POST';
    const requestHeaders = {
        soapaction: soapAction,
        'content-type': 'text/xml;charset=UTF-8'
    };

    const requestOptions = {
        method: METHOD,
        url: endpointUrl,
        headers: requestHeaders
    };


    try {



        self.emit('data');
        self.emit('end');
    } catch (e) {
        self.logger.info('Error while making request to SOAP Client: ', (e as Error).message);
        self.emit('error', e);
        self.emit('end')
    }
}

function createSoapEnvelope(input: string, action: string, headers: Array<string>): string {
    const soapHeaders = generateSoapHeaders(headers)

    return `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
    <soap:Header><SOAPAction>${action}</SOAPAction>${soapHeaders}</soap:Header>
    <soap:Body>${input}</soap:Body>`;

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

function getAuthFromSecretConfig(cfg: Config, logger: Self) {
    const {
      username, passphrase, key, headerName, accessToken, secretAuthTransform,
    } = cfg;
    const returnConfig = { ...cfg };

    // Use JSONata to populate cfg.auth object, works for all types but especially helpful for the MIXED type
    if (secretAuthTransform) {
      returnConfig.auth = transform(cfg, { customMapping: secretAuthTransform });
      logger.debug(`helpers.getAuthFromSecretConfig: after transforming auth config: ${JSON.stringify(returnConfig)}`);
      return returnConfig;
    }

    let auth: Auth<AuthType> | undefined;

    // Found username and password, authenticate with basic authentication
    if (username && passphrase) {
      auth = {
        type: authTypes.BASIC,
        data: {
          username: username,
          password: passphrase
        }
      } as Auth<Basic>;
    }
    // Found API_KEY type
    if (key && headerName) {
      auth = {
        type: authTypes.API_KEY,
        data: {
          headerName: headerName,
          headerValue: key
        }
      } as Auth<ApiKey>;
    }
    // Found an accessToken from OA1_TWO_LEGGED, OA1_THREE_LEGGED, OA2_AUTHORIZATION_CODE, or SESSION_AUTH types
    if (accessToken) {
      auth = {
        type: authTypes.OAUTH2,
        data: {
          keys: {
            access_token: accessToken
          }
        }
      } as Auth<OAuth2>;
    }

    if (auth === undefined) {
      throw Error('no matching type found');
    }

    returnConfig.auth = auth;
    logger.debug(`helpers.getAuthFromSecretConfig: config object is now: ${JSON.stringify(returnConfig)}`);
    return returnConfig;
  }