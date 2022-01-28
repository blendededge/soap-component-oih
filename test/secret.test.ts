import { expect } from 'chai';
import { getAuthFromSecretConfig } from '../lib/secret';

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