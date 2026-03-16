import { describe, it, expect } from 'vitest';
import { layoutFactory, addLayout } from './layouts/index.js';
import { getLevel } from './levels.js';
import type { LogEvent } from './LogEvent.js';

function makeEvent(overrides: Partial<LogEvent> = {}): LogEvent {
  return {
    startTime: new Date('2026-01-15T10:30:00.000Z'),
    categoryName: 'test.cat',
    level: getLevel('INFO')!,
    data: ['hello world'],
    context: {},
    pid: 12345,
    ...overrides,
  };
}

describe('basic layout', () => {
  it('formats as [timestamp] [LEVEL] category - message', () => {
    const layout = layoutFactory.layout('basic');
    const result = layout(makeEvent());
    expect(result).toBe('[2026-01-15T10:30:00.000Z] [INFO] test.cat - hello world');
  });

  it('formats Error objects with stack', () => {
    const err = new Error('boom');
    const layout = layoutFactory.layout('basic');
    const result = layout(makeEvent({ data: [err] }));
    expect(result).toContain('boom');
    expect(result).toContain('Error');
  });
});

describe('colored layout', () => {
  it('includes ANSI color codes', () => {
    const layout = layoutFactory.layout('colored');
    const result = layout(makeEvent());
    expect(result).toContain('\x1b[32m'); // green for INFO
    expect(result).toContain('\x1b[0m');  // reset
    expect(result).toContain('hello world');
  });
});

describe('coloured layout', () => {
  it('is an alias for colored', () => {
    const layout = layoutFactory.layout('coloured');
    const result = layout(makeEvent());
    expect(result).toContain('\x1b[32m');
  });
});

describe('messagePassThrough layout', () => {
  it('returns only the message', () => {
    const layout = layoutFactory.layout('messagePassThrough');
    expect(layout(makeEvent())).toBe('hello world');
  });

  it('joins multiple data args', () => {
    const layout = layoutFactory.layout('messagePassThrough');
    expect(layout(makeEvent({ data: ['a', 'b', 'c'] }))).toBe('a b c');
  });
});

describe('dummy layout', () => {
  it('returns empty string', () => {
    const layout = layoutFactory.layout('dummy');
    expect(layout(makeEvent())).toBe('');
  });
});

describe('json layout', () => {
  it('outputs valid JSON with all fields', () => {
    const layout = layoutFactory.layout('json');
    const result = JSON.parse(layout(makeEvent({ context: { user: 'alice' } })));
    expect(result.startTime).toBe('2026-01-15T10:30:00.000Z');
    expect(result.categoryName).toBe('test.cat');
    expect(result.level).toBe('INFO');
    expect(result.data).toEqual(['hello world']);
    expect(result.context).toEqual({ user: 'alice' });
    expect(result.pid).toBe(12345);
  });

  it('omits empty context', () => {
    const layout = layoutFactory.layout('json');
    const result = JSON.parse(layout(makeEvent()));
    expect(result.context).toBeUndefined();
  });
});

describe('pattern layout', () => {
  it('uses default pattern', () => {
    const layout = layoutFactory.layout('pattern');
    const result = layout(makeEvent());
    expect(result).toContain('2026-01-15T10:30:00.000Z');
    expect(result).toContain('INFO');
    expect(result).toContain('test.cat');
    expect(result).toContain('hello world');
  });

  it('supports %d %p %c %m %n tokens', () => {
    const layout = layoutFactory.layout('pattern', { pattern: '%p|%c|%m%n' });
    const result = layout(makeEvent());
    expect(result).toBe('INFO|test.cat|hello world\n');
  });

  it('supports %z (pid)', () => {
    const layout = layoutFactory.layout('pattern', { pattern: 'pid=%z' });
    expect(layout(makeEvent())).toBe('pid=12345');
  });

  it('supports %d{format}', () => {
    const layout = layoutFactory.layout('pattern', { pattern: '%d{yyyy-MM-dd}' });
    expect(layout(makeEvent())).toBe('2026-01-15');
  });

  it('supports %d{ISO8601}', () => {
    const layout = layoutFactory.layout('pattern', { pattern: '%d{ISO8601}' });
    expect(layout(makeEvent())).toBe('2026-01-15T10:30:00.000Z');
  });

  it('supports %c{n} to truncate category', () => {
    const layout = layoutFactory.layout('pattern', { pattern: '%c{1}' });
    expect(layout(makeEvent())).toBe('cat');
  });

  it('supports %x{token} for context values', () => {
    const layout = layoutFactory.layout('pattern', { pattern: 'user=%x{user}' });
    expect(layout(makeEvent({ context: { user: 'bob' } }))).toBe('user=bob');
  });

  it('supports %x{token} with custom token functions', () => {
    const layout = layoutFactory.layout('pattern', {
      pattern: '%x{env}',
      tokens: { env: () => 'production' },
    });
    expect(layout(makeEvent())).toBe('production');
  });

  it('supports %% for literal percent', () => {
    const layout = layoutFactory.layout('pattern', { pattern: '100%%' });
    expect(layout(makeEvent())).toBe('100%');
  });

  it('supports %f %l %o for file/line/column', () => {
    const layout = layoutFactory.layout('pattern', { pattern: '%f:%l:%o' });
    const result = layout(makeEvent({ fileName: 'app.ts', lineNumber: 42, columnNumber: 7 }));
    expect(result).toBe('app.ts:42:7');
  });

  it('supports %[ %] for color', () => {
    const layout = layoutFactory.layout('pattern', { pattern: '%[%p%]' });
    const result = layout(makeEvent());
    expect(result).toContain('\x1b[32m'); // green for INFO
    expect(result).toContain('\x1b[0m');
    expect(result).toContain('INFO');
  });
});

describe('addLayout', () => {
  it('registers a custom layout', () => {
    addLayout('uppercase', () => (event) => event.data.join(' ').toUpperCase());
    const layout = layoutFactory.layout('uppercase');
    expect(layout(makeEvent())).toBe('HELLO WORLD');
  });
});

describe('unknown layout', () => {
  it('throws for unregistered layout', () => {
    expect(() => layoutFactory.layout('nonexistent')).toThrow('unknown layout type');
  });
});
