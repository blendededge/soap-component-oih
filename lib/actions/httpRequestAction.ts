/* eslint-disable @typescript-eslint/no-this-alias */
import { processMethod } from '../soapRequest';
import { Config, GenericObject, Message, Self } from '../types/global';
import { wrapper } from '@blendededge/ferryman-extensions';

async function processAction(this: Self, msg: Message, cfg: Config, snapshot: GenericObject): Promise<void> {
    const self = this;
    const wrapped = wrapper(self, msg, cfg, snapshot);
    self.logger.debug('msg: ', msg);
    self.logger.debug('cfg: ', cfg);
    self.logger.debug('snapshot :', snapshot);

    return await processMethod(wrapped, msg, cfg, snapshot);
}

exports.process = processAction;