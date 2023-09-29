/* eslint-disable @typescript-eslint/no-this-alias */
import { wrapper } from '@blendededge/ferryman-extensions';
import { Config, IncomingHeaders, Message, Snapshot, TokenData } from '@blendededge/ferryman-extensions/lib/ferryman-types';
import { processMethod } from '../soapRequest';
import { Self } from '../types/global';

async function processTrigger(this: Self, msg: Message, cfg: Config, snapshot: Snapshot, headers: IncomingHeaders, tokenData: TokenData): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = await wrapper(this, msg, cfg, snapshot, headers, tokenData);
    self.logger.debug('msg: ', JSON.stringify(msg));
    self.logger.debug('cfg: ', JSON.stringify(cfg));
    self.logger.debug('snapshot :', JSON.stringify(snapshot));

    return await processMethod(self, msg, cfg, snapshot);
}

exports.process = processTrigger;