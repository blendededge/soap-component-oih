/* eslint-disable @typescript-eslint/no-this-alias */
import { wrapper } from '@blendededge/ferryman-extensions';
import { processMethod } from '../soapRequest';
import { Config, GenericObject, Message, Self } from '../types/global';

async function processAction(this: Self, msg: Message, cfg: Config, snapshot: GenericObject): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = wrapper(this, msg as any, cfg);
    self.logger.debug('msg: ', msg);
    self.logger.debug('cfg: ', cfg);
    self.logger.debug('snapshot :', snapshot);

    return await processMethod(self, msg, cfg, snapshot);
}

exports.process = processAction;