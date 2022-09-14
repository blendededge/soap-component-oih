import * as td from 'testdouble';
import * as nock from 'nock';
import { processMethod } from '../lib/soapRequest';
import { Config, Message, Self } from '../lib/types/global';

const ANY_PARAM = td.matchers.anything();
const self = td.object<Self>();

describe('rebound functionality', () => {

    it('should not rebound by default on 500 status code', async () => {
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


})