import { AxiosRequestHeaders } from 'axios';
import { populateAuthHeaders } from './http';
import { getAuthFromSecretConfig } from './secret';
import { transform } from '@openintegrationhub/ferryman';
import { Config, Self, Headers, Auth, Message } from './types/global';

export function generateRequest(cfg: Config, self: Self, msg: Message) {
    const { endpointUrl, soapAction, httpHeaders, soapHeaders } = cfg;
    const xml = msg.data.xml;

    const { auth } = getAuthFromSecretConfig(cfg, self);
    const bearerToken = (auth && auth.oauth2 && auth.oauth2.keys && auth.oauth2.keys.access_token ? auth.oauth2.keys.access_token : '');

    const requestHeaders = generateRequestHeaders(bearerToken, soapAction, auth, httpHeaders);
    const formattedHeaders = formatHeaders(requestHeaders);
    self.logger.info(`Formatted request headers: ${formattedHeaders}`);

    const requestUrl = transform(msg, { customMapping: endpointUrl });
    self.logger.info(`Request URL after transformation: ${requestUrl}`);
    const requestData = createSoapEnvelope((xml as string), soapAction, soapHeaders);
    self.logger.info(`Soap Envelope: ${requestData}`);

    return {
        requestData,
        requestUrl,
        formattedHeaders
    }
}

function generateRequestHeaders(bearerToken: string, soapAction?: string, auth?: Auth, httpHeaders?: Headers[]) {
    let requestHeaders: Headers[] = [];
    if (auth) {
        requestHeaders = populateAuthHeaders(auth, self, bearerToken, httpHeaders);
    }

    if (soapAction) {
        requestHeaders.push({
          key: 'soapaction',
          value: soapAction
        });
    }

    requestHeaders.push(
        {
            key: 'content-type',
            value: 'text/xml;charset=UTF-8'
        }
    );

    return requestHeaders;
}

function formatHeaders(requestHeaders: Headers[]) {
    const formattedHeaders: AxiosRequestHeaders = {};
    if (requestHeaders && requestHeaders.length) {
      requestHeaders.forEach(header => {
        if (!header.key || !header.value) {
          return;
        }
        formattedHeaders[header.key.toLowerCase()] = header.value;
      })
    }
    return formattedHeaders
}

export function createSoapEnvelope(input: string, action?: string, headers?: Array<string>): string {
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

export function generateSoapHeaders(headers: Array<string>): string {
    return headers.reduce((headerString, currentHeader) => {
        return currentHeader + headerString
    }, '');
}
