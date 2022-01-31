import { expect } from 'chai';
import { populateAuthHeaders } from '../lib/http';
declare const Buffer;

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