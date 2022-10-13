import { expect } from 'chai';
import * as nock from 'nock';
import { processMethod } from '../lib/soapRequest';
import { Config } from '../lib/types/global';

describe('SOAP Web Service Request', () => {
    const endpointUrl = 'http://fake.api/'
    const config: Config = {
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
        nock(endpointUrl).filteringPath(() => '/').post('/').query(true).reply(200, '<soap:Envelope><Response><Data></Data></Response></soap:Envelope>');
        nock(endpointUrl).filteringPath(() => '/test').post('/test').query(true).reply(500, 'Response code 500')
    })
    afterEach(() => {
        nock.restore()
    })

    it('should successfully make a request to a SOAP endpoint', async () => {
        await processMethod(self, msg, config);
        expect(response.data).to.equal('<soap:Envelope><Response><Data></Data></Response></soap:Envelope>')
    })

    it('should fail to make a request and send to next step: dontThrowErrorFlag', async () => {
        config.dontThrowErrorFlag = true;
        config.endpointUrl = `'${config.endpointUrl}/test'`;
        await processMethod(self, msg, config);
        expect(response.data.errorMessage).to.exist;
        expect(response.data.errorName).to.exist;
    })
})