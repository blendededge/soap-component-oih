import { Logger } from './types/global';

export async function sleep(delay: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

export async function rateLimit(logger: Logger, delay: number): Promise<void> {
  if (delay) {
    logger.info(`Delay Between Calls is set to: ${delay} ms`);
    logger.debug('Delay is start', new Date());
    await sleep(delay);
    logger.debug('Delay is done', new Date());
  } else {
    logger.info(
      'Delay Between Calls is not set, process message without delay...',
    );
  }
}
