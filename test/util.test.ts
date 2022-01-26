import 'mocha';
import { expect } from 'chai';
import * as nock from 'nock';
import { processMethod, createSoapEnvelope, generateSoapHeaders, getAuthFromSecretConfig, populateAuthHeaders } from '../lib/util';
declare const Buffer;

// create soap envelope
describe('createSoapEnvelope', () => {
    const input = '<xmlInput><Input></Input></xmlInput>';
    const headers = ['<SOAPHeaderInput></SOAPHeaderInput>'];
    const action = 'getAllOrders';

    it('should generate soap envelope only when input is provided', () => {
        const envelope = createSoapEnvelope(input);
        expect(envelope).to.contain('<?xml version="1.0" encoding="utf-8"?>')
        expect(envelope).to.contain('<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >')
        expect(envelope).to.contain(`<soap:Body>${input}</soap:Body>`);
        expect(envelope).to.not.contain('<SOAPAction>')
    })

    it('should generate soap envelope when only input and action is provided', () => {
        const envelope = createSoapEnvelope(input, action)
        expect(envelope).to.contain('<?xml version="1.0" encoding="utf-8"?>')
        expect(envelope).to.contain('<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >')
        expect(envelope).to.contain(`<soap:Body>${input}</soap:Body>`);
        expect(envelope).to.contain(`<SOAPAction>${action}</SOAPAction>`);
    })

    it('should generate soap envelope when headers and actions are provided', () => {
        const envelope = createSoapEnvelope(input, action, headers);
        expect(envelope).to.contain('<?xml version="1.0" encoding="utf-8"?>')
        expect(envelope).to.contain('<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >')
        expect(envelope).to.contain(`<soap:Body>${input}</soap:Body>`);
        expect(envelope).to.contain(`<SOAPAction>${action}</SOAPAction>`);
        expect(envelope).to.contain(headers[0])
    })
});

describe('generateSoapHeaders', () => {
    const headers = ['<SOAPHeaderInput></SOAPHeaderInput>', '<SOAPHeaderInput2></SOAPHeaderInput2>'];

    it('should generate single header string when provided array', () => {
        const generatedHeaders = generateSoapHeaders(headers);
        expect(generatedHeaders).to.equal('<SOAPHeaderInput2></SOAPHeaderInput2><SOAPHeaderInput></SOAPHeaderInput>')
    })

    it('should return empty string if no headers provided', () => {
        const generatedHeaders = generateSoapHeaders([]);
        expect(generatedHeaders).to.equal('')
    })
});

describe('getAuthFromSecretConfig', () => {
    const self = {
        logger: {
            debug: () => {
                return true;
            }
        }
    }

    it('should populate the username and passphrase from secret config', () => {
        const config = {
            username: 'dragon',
            passphrase: 'nighthawk',
            endpointUrl: 'http://tester'
        }
        const { auth } = getAuthFromSecretConfig(config, self);
        expect(auth.basic.password).to.equal('nighthawk')
        expect(auth.basic.username).to.equal('dragon')
        expect(auth.type).to.equal('Basic Auth')
    })

    it('should populate api Key from secret config', () => {
        const config = {
            key: 'one',
            headerName: 'two',
            endpointUrl: 'http://test'
        }
        const { auth } = getAuthFromSecretConfig(config, self);
        expect(auth.type).to.equal('API Key Auth')
        expect(auth.apiKey.headerName).to.equal('two')
        expect(auth.apiKey.headerValue).to.equal('one')
    })

    it('should populate access token from secret config', () => {
        const config = {
            accessToken: '54321',
            endpointUrl: 'http://test'
        }
        const { auth } = getAuthFromSecretConfig(config, self);
        expect(auth.type).to.equal('OAuth2');
        expect(auth.oauth2.keys.access_token).to.equal('54321')
    })
})


describe('populateAuthHeaders', () => {
    const bearerToken = '12345';

    it('should populate headers for basic', () => {
        const auth = {
            type: 'Basic Auth',
            basic: {
                username: 'dragon',
                password: 'nighthawk'
            }
        }
        const headers = populateAuthHeaders(auth, this, bearerToken);
        expect(headers[0].key).to.equal('Authorization')
        expect(headers[0].value).to.equal(`"Basic ${Buffer.from(
            `${auth.basic.username}:${auth.basic.password}`,
            'utf8',
          ).toString('base64')}"`)
    })

    it('should populate headers for api key', () => {
        const auth = {
            type: 'API Key Auth',
            apiKey: {
                headerName: 'dragon',
                headerValue: 'nighthawk'
            }
        }
        const headers = populateAuthHeaders(auth, this, bearerToken);
        expect(headers[0].key).to.equal('dragon')
        expect(headers[0].value).to.equal('"nighthawk"')
    })

    it('should populate headers for oauth', () => {
        const auth = {
            type: 'OAuth2'
        };
        const self = {
            logger: {
                trace: () => {
                    return true;
                }
            }
        }
        const headers = populateAuthHeaders(auth, self, bearerToken);
        expect(headers[0].key).to.equal('Authorization')
        expect(headers[0].value).to.equal(`"Bearer ${bearerToken}"`);
    })
})

describe('SOAP Web Service Request', () => {
    const endpointUrl = 'http://fake.api/'
    const config = {
        endpointUrl: `"${endpointUrl}"`,
        soapAction: 'getAllOrders'
    }
    const msg = {
        data: {
            xml: '<myXmlInput></myXmlInput>'
        },
        id: '',
        attachments: {},
        headers: {},
        metadata: {}
    }
    const self = {
        logger: {
            trace: () => true,
            debug: () => true,
            info: () => true
        },
        emit: (type, data) => {
            if (type === 'data') {
                response = data
            }
        }
    }

    let response;

    beforeEach(() => {
        nock(endpointUrl).filteringPath(() => '/').post('/').query(true).reply(200, '<soap:Envelope><Response><Data></Data></Response></soap:Envelope>')
    })
    afterEach(() => {
        nock.restore()
    })

    it('should successfully make a request to a SOAP endpoint', async () => {
        await processMethod(self, msg, config);
        expect(nock.isDone()).to.equal(true)
        expect(response.data).to.equal('<soap:Envelope><Response><Data></Data></Response></soap:Envelope>')
    })
})