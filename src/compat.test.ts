import { describe, it, expect, afterEach } from 'vitest';
import log4js from './compat/log4js.js';
import {
  configure,
  getLogger,
  shutdown,
  levels,
  Level,
  addLayout,
  connectLogger,
  Logger,
} from './compat/log4js.js';
import { getRecordedEvents, clearRecordedEvents } from './appenders/recording.js';

afterEach(() => {
  clearRecordedEvents();
  return new Promise<void>((resolve) => shutdown(() => resolve()));
});

describe('compat/log4js', () => {
  it('exports configure, getLogger, shutdown as named exports', () => {
    expect(typeof configure).toBe('function');
    expect(typeof getLogger).toBe('function');
    expect(typeof shutdown).toBe('function');
  });

  it('exports levels and Level', () => {
    expect(levels).toBeDefined();
    expect(levels.INFO).toBeInstanceOf(Level);
    expect(levels.ERROR).toBeInstanceOf(Level);
  });

  it('exports addLayout and connectLogger', () => {
    expect(typeof addLayout).toBe('function');
    expect(typeof connectLogger).toBe('function');
  });

  it('exports Logger class', () => {
    expect(typeof Logger).toBe('function');
  });

  it('has default export with full API', () => {
    expect(log4js.configure).toBe(configure);
    expect(log4js.getLogger).toBe(getLogger);
    expect(log4js.shutdown).toBe(shutdown);
    expect(log4js.levels).toBe(levels);
    expect(log4js.addLayout).toBe(addLayout);
    expect(log4js.connectLogger).toBe(connectLogger);
  });

  it('works end-to-end via default export', () => {
    log4js.configure({
      appenders: { rec: { type: 'recording' } },
      categories: { default: { appenders: ['rec'], level: 'INFO' } },
    });

    const logger = log4js.getLogger('myCategory');
    logger.info('compat test');

    const events = getRecordedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].categoryName).toBe('myCategory');
    expect(events[0].data).toEqual(['compat test']);
  });

  it('works end-to-end via named exports', () => {
    configure({
      appenders: { rec: { type: 'recording' } },
      categories: { default: { appenders: ['rec'], level: 'DEBUG' } },
    });

    const logger = getLogger();
    logger.debug('named export test');

    const events = getRecordedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].level.levelStr).toBe('DEBUG');
  });
});
