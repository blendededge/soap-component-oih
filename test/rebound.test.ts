import * as td from 'testdouble';
import * as nock from 'nock';
import { processMethod } from '../lib/soapRequest';
import { Config, Message, Self } from '../lib/types/global';

const ANY_PARAM = td.matchers.anything();
let self;

describe('rebound functionality', () => {

    beforeEach(() => {
      td.reset();
      self = td.object<Self>();
    });

    it('should not rebound by default', async () => {
      const endpoint = nock('https://example.com');
      endpoint.post('/').reply(500);
      const msg: Message = {
        id: '123',
        attachments: {},
        data: {},
        headers: {},
        metadata: {},
      };
      const cfg: Config = {
        endpointUrl: '\'https://example.com/\'',
        enableRebound: false
      };
      td.when(self.emit('rebound', ANY_PARAM))
        .thenThrow(new Error('rebound should not be called'));
      await processMethod(self, msg, cfg);
    });

    it('should rebound on default codes when enabled', async () => {
      const endpoint = nock('https://example.com');
      endpoint.post('/').reply(500);
      const msg: Message = {
        id: '123',
        attachments: {},
        data: {},
        headers: {},
        metadata: {},
      };
      const cfg: Config = {
        endpointUrl: '\'https://example.com/\'',
        enableRebound: true
      };
      await processMethod(self, msg, cfg);
      td.verify(self.emit('rebound', ANY_PARAM));
    });

    it('should not rebound on non default codes when enabled', async () => {
      const endpoint = nock('https://example.com');
      endpoint.post('/').reply(401);
      const msg: Message = {
        id: '123',
        attachments: {},
        data: {},
        headers: {},
        metadata: {},
      };
      const cfg: Config = {
        endpointUrl: '\'https://example.com/\'',
        enableRebound: true
      };
      td.when(self.emit('rebound', ANY_PARAM))
        .thenThrow(new Error('rebound should not be called'));
      await processMethod(self, msg, cfg);
    });

    it('should rebound on configured status codes', async () => {
      const endpoint = nock('https://example.com');
      endpoint.post('/').reply(401);
      const msg: Message = {
        id: '123',
        attachments: {},
        data: {},
        headers: {},
        metadata: {},
      };
      const cfg: Config = {
        endpointUrl: '\'https://example.com/\'',
        enableRebound: true,
        httpReboundErrorCodes: [401],
      };
      await processMethod(self, msg, cfg);
      td.verify(self.emit('rebound', ANY_PARAM));
    });
})