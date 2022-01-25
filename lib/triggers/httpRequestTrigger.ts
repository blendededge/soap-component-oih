/* eslint-disable @typescript-eslint/no-this-alias */
import { processMethod } from '../util';
import { Config, GenericObject, Message, Self } from '../types/oih-types';

const processTrigger = async (msg: Message, cfg: Config, snapshot: GenericObject): Promise<void> => {
    const self: Self = this;
    self.logger.debug('msg: ', msg);
    self.logger.debug('cfg: ', cfg);
    self.logger.debug('snapshot :', snapshot);

    return await processMethod(self, msg, cfg, snapshot);
}

exports.process = processTrigger;