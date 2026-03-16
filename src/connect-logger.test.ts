import { describe, it, expect, afterEach, vi } from 'vitest';
import { configure, getLogger, shutdown } from './index.js';
import { connectLogger } from './connect-logger.js';
import { getRecordedEvents, clearRecordedEvents } from './appenders/recording.js';

afterEach(() => {
  clearRecordedEvents();
  return new Promise<void>((resolve) => shutdown(() => resolve()));
});

function makeReq(overrides = {}) {
  return {
    method: 'GET',
    url: '/api/users',
    originalUrl: '/api/users',
    httpVersion: '1.1',
    headers: {} as Record<string, string>,
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  };
}

function makeRes(statusCode = 200) {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  return {
    statusCode,
    on(event: string, listener: (...args: unknown[]) => void) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(listener);
    },
    emit(event: string) {
      for (const fn of listeners[event] ?? []) fn();
    },
    getHeader: () => undefined,
  };
}

describe('connectLogger', () => {
  it('logs HTTP requests on finish', () => {
    configure({
      appenders: { rec: { type: 'recording' } },
      categories: { default: { appenders: ['rec'], level: 'INFO' } },
    });

    const logger = getLogger('http');
    const middleware = connectLogger(logger, { level: 'INFO' });
    const req = makeReq();
    const res = makeRes(200);
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    // Simulate response finish
    res.emit('finish');

    const events = getRecordedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].data[0]).toContain('GET');
    expect(events[0].data[0]).toContain('/api/users');
    expect(events[0].data[0]).toContain('200');
  });

  it('uses default INFO level', () => {
    configure({
      appenders: { rec: { type: 'recording' } },
      categories: { default: { appenders: ['rec'], level: 'INFO' } },
    });

    const logger = getLogger('http');
    const middleware = connectLogger(logger);
    const res = makeRes();

    middleware(makeReq(), res, () => {});
    res.emit('finish');

    const events = getRecordedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].level.levelStr).toBe('INFO');
  });

  it('supports custom format string', () => {
    configure({
      appenders: { rec: { type: 'recording' } },
      categories: { default: { appenders: ['rec'], level: 'INFO' } },
    });

    const logger = getLogger();
    const middleware = connectLogger(logger, {
      format: ':method :url -> :status',
    });
    const res = makeRes(201);

    middleware(makeReq({ method: 'POST', url: '/api/items', originalUrl: '/api/items' }), res, () => {});
    res.emit('finish');

    const events = getRecordedEvents();
    expect(events[0].data[0]).toBe('POST /api/items -> 201');
  });

  it('supports nolog exclusion', () => {
    configure({
      appenders: { rec: { type: 'recording' } },
      categories: { default: { appenders: ['rec'], level: 'INFO' } },
    });

    const logger = getLogger();
    const middleware = connectLogger(logger, {
      nolog: ['/health', /^\/metrics/],
    });

    const res1 = makeRes();
    middleware(makeReq({ url: '/health', originalUrl: '/health' }), res1, () => {});
    res1.emit('finish');

    const res2 = makeRes();
    middleware(makeReq({ url: '/metrics/cpu', originalUrl: '/metrics/cpu' }), res2, () => {});
    res2.emit('finish');

    const res3 = makeRes();
    middleware(makeReq({ url: '/api/data', originalUrl: '/api/data' }), res3, () => {});
    res3.emit('finish');

    expect(getRecordedEvents()).toHaveLength(1);
    expect(getRecordedEvents()[0].data[0]).toContain('/api/data');
  });

  it('supports statusRules for level override', () => {
    configure({
      appenders: { rec: { type: 'recording' } },
      categories: { default: { appenders: ['rec'], level: 'TRACE' } },
    });

    const logger = getLogger();
    const middleware = connectLogger(logger, {
      level: 'INFO',
      statusRules: [
        { from: 400, to: 499, level: 'WARN' },
        { from: 500, to: 599, level: 'ERROR' },
      ],
    });

    const res200 = makeRes(200);
    middleware(makeReq(), res200, () => {});
    res200.emit('finish');

    const res404 = makeRes(404);
    middleware(makeReq(), res404, () => {});
    res404.emit('finish');

    const res500 = makeRes(500);
    middleware(makeReq(), res500, () => {});
    res500.emit('finish');

    const events = getRecordedEvents();
    expect(events).toHaveLength(3);
    expect(events[0].level.levelStr).toBe('INFO');
    expect(events[1].level.levelStr).toBe('WARN');
    expect(events[2].level.levelStr).toBe('ERROR');
  });

  it('supports format function', () => {
    configure({
      appenders: { rec: { type: 'recording' } },
      categories: { default: { appenders: ['rec'], level: 'INFO' } },
    });

    const logger = getLogger();
    const middleware = connectLogger(logger, {
      format: (req, res) => `${req.method} ${res.statusCode}`,
    });
    const res = makeRes(204);

    middleware(makeReq({ method: 'DELETE' }), res, () => {});
    res.emit('finish');

    expect(getRecordedEvents()[0].data[0]).toBe('DELETE 204');
  });
});
