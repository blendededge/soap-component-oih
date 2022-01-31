import { expect } from 'chai';
import * as nock from 'nock';
import { processMethod } from '../lib/soapRequest';

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