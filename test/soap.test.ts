import 'mocha';
import { expect } from 'chai';
import { createSoapEnvelope, generateSoapHeaders } from '../lib/soap';

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