import { AxiosRequestHeaders } from 'axios';
import { populateAuthHeaders } from './http';
import { getAuthFromSecretConfig } from './secret';
import { transform } from '@openintegrationhub/ferryman';
import { Config, Self, Headers, Auth, Message, Namespace } from './types/global';
import * as xml2js from 'xml2js';

export function createRequest(cfg: Config, self: Self, msg: Message) {
    const { endpointUrl, soapAction, httpHeaders, soapHeaders } = cfg;
    const xml = process.env.ELASTICIO_PUBLISH_MESSAGES_TO ? msg.body?.xmlString : msg.data?.xmlString;

    const { auth } = getAuthFromSecretConfig(cfg, self);
    const bearerToken = (auth && auth.oauth2 && auth.oauth2.keys && auth.oauth2.keys.access_token ? auth.oauth2.keys.access_token : '');

    const namespaces = addCustomNamespaces(cfg.namespaces);
    const requestHeaders = createRequestHeaders(self, bearerToken, soapAction, auth, httpHeaders);
    const formattedHeaders = formatHeaders(requestHeaders);
    self.logger.info(`Formatted request headers: ${JSON.stringify(formattedHeaders)}`);

    const requestUrl = transform(msg, { customMapping: endpointUrl });
    self.logger.info(`Request URL after transformation: ${requestUrl}`);
    const requestData = createSoapEnvelope((xml as string), soapAction, soapHeaders, namespaces);
    self.logger.info(`Soap Envelope: ${requestData}`);

    return {
        requestData,
        requestUrl,
        formattedHeaders
    }
}

function createRequestHeaders(self: Self, bearerToken: string, soapAction?: string, auth?: Auth, httpHeaders?: Headers[]) {
    let requestHeaders: Headers[] = [];
    if (auth) {
        requestHeaders = populateAuthHeaders(auth, self, bearerToken, httpHeaders);
    }

    if (soapAction) {
        requestHeaders.push({
          key: 'SOAPAction',
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

function addCustomNamespaces(namespaces?: Namespace[]) {
    let namespaceString = '';
    if (namespaces) {
        namespaces.forEach(namespace => {
            namespaceString += `xmlns:${namespace.name}="${namespace.url}" `;
        });
    }
    return namespaceString;
}

export function createSoapEnvelope(input: string, action?: string, headers?: Array<string>, namespaces?: string): string {
    let soapHeaders;
    if (headers) {
        soapHeaders = createSoapHeaders(headers)
    }

    return `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ${namespaces ? namespaces : ''}>
    <soap:Header>
    ${action ? `<SOAPAction>${action}</SOAPAction>` : ''}
    ${soapHeaders ? soapHeaders : ''}
    </soap:Header>
    <soap:Body>${input}</soap:Body>
    </soap:Envelope>`;
}

export function createSoapHeaders(headers: Array<string>): string {
    return headers.reduce((headerString, currentHeader) => {
        return currentHeader + headerString
    }, '');
}

export async function checkForFault(data: string, faultTransform?: string): Promise<boolean> {
    const parserConfig = {
        trim: false,
        normalize: false,
        normalizeTags: false,
        attrkey: '_attr',
        tagNameProcessors: [
          (name: string) => name.replace(':', '-'),
        ],
    };
    const parser = new xml2js.Parser(parserConfig);
    let xml = await parser.parseStringPromise(data);

    if (faultTransform) {
        xml = transform(xml)
    }

    return xml['soap-Envelope'] && xml['soap-Envelope']['soap-Fault'];
}