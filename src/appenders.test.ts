import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configure, getLogger, shutdown } from './index.js';
import { getRecordedEvents, clearRecordedEvents } from './appenders/recording.js';

afterEach(() => {
  clearRecordedEvents();
  return new Promise<void>((resolve) => shutdown(() => resolve()));
});

describe('stderr appender', () => {
  it('writes to stderr', () => {
    const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    configure({
      appenders: { err: { type: 'stderr' } },
      categories: { default: { appenders: ['err'], level: 'INFO' } },
    });

    getLogger().error('stderr message');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0] as string).toContain('stderr message');
    spy.mockRestore();
  });
});

describe('console appender', () => {
  it('uses console.log for INFO', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    configure({
      appenders: { con: { type: 'console' } },
      categories: { default: { appenders: ['con'], level: 'INFO' } },
    });

    getLogger().info('console info');

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toContain('console info');
    logSpy.mockRestore();
  });

  it('uses console.error for ERROR', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    configure({
      appenders: { con: { type: 'console' } },
      categories: { default: { appenders: ['con'], level: 'INFO' } },
    });

    getLogger().error('console error');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });
});

describe('recording appender', () => {
  beforeEach(() => {
    configure({
      appenders: { rec: { type: 'recording' } },
      categories: { default: { appenders: ['rec'], level: 'TRACE' } },
    });
  });

  it('captures events with all log methods', () => {
    const logger = getLogger();
    logger.trace('t');
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    logger.fatal('f');
    logger.mark('m');

    const events = getRecordedEvents();
    expect(events).toHaveLength(7);
    expect(events.map((e) => e.level.levelStr)).toEqual([
      'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'MARK',
    ]);
  });

  it('clears recorded events', () => {
    getLogger().info('test');
    expect(getRecordedEvents()).toHaveLength(1);

    clearRecordedEvents();
    expect(getRecordedEvents()).toHaveLength(0);
  });

  it('captures event metadata', () => {
    const logger = getLogger();
    logger.addContext('reqId', '123');
    logger.info('hello', 'world');

    const event = getRecordedEvents()[0];
    expect(event.categoryName).toBe('default');
    expect(event.data).toEqual(['hello', 'world']);
    expect(event.context).toEqual({ reqId: '123' });
    expect(event.pid).toBe(process.pid);
    expect(event.startTime).toBeInstanceOf(Date);
  });
});

describe('logLevelFilter appender', () => {
  it('filters events by level range', () => {
    configure({
      appenders: {
        rec: { type: 'recording' },
        filter: { type: 'logLevelFilter', appender: 'rec', level: 'WARN', maxLevel: 'ERROR' },
      },
      categories: { default: { appenders: ['filter'], level: 'TRACE' } },
    });

    const logger = getLogger();
    logger.debug('no');
    logger.info('no');
    logger.warn('yes');
    logger.error('yes');
    logger.fatal('no');

    const events = getRecordedEvents();
    expect(events).toHaveLength(2);
    expect(events[0].level.levelStr).toBe('WARN');
    expect(events[1].level.levelStr).toBe('ERROR');
  });
});

describe('categoryFilter appender', () => {
  it('excludes specified categories', () => {
    configure({
      appenders: {
        rec: { type: 'recording' },
        filter: { type: 'categoryFilter', appender: 'rec', exclude: ['noisy'] },
      },
      categories: {
        default: { appenders: ['filter'], level: 'INFO' },
        noisy: { appenders: ['filter'], level: 'INFO' },
      },
    });

    getLogger('noisy').info('excluded');
    getLogger().info('included');

    const events = getRecordedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].data).toEqual(['included']);
  });
});

describe('noLogFilter appender', () => {
  it('excludes messages matching patterns', () => {
    configure({
      appenders: {
        rec: { type: 'recording' },
        filter: { type: 'noLogFilter', appender: 'rec', exclude: ['healthcheck'] },
      },
      categories: { default: { appenders: ['filter'], level: 'INFO' } },
    });

    const logger = getLogger();
    logger.info('healthcheck ok');
    logger.info('user logged in');

    const events = getRecordedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].data).toEqual(['user logged in']);
  });
});
