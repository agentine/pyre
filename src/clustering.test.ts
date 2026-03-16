import { describe, it, expect, afterEach } from 'vitest';
import { isPrimaryProcess, disableClustering } from './clustering.js';

afterEach(() => {
  disableClustering();
});

describe('isPrimaryProcess', () => {
  it('returns true when clustering is disabled', () => {
    expect(isPrimaryProcess({ disableClustering: true })).toBe(true);
  });

  it('returns true when not in cluster mode and no PM2', () => {
    expect(isPrimaryProcess({})).toBe(true);
  });

  it('returns true for PM2 instance 0', () => {
    const orig = process.env.NODE_APP_INSTANCE;
    process.env.NODE_APP_INSTANCE = '0';
    expect(isPrimaryProcess({ pm2: true })).toBe(true);
    if (orig === undefined) delete process.env.NODE_APP_INSTANCE;
    else process.env.NODE_APP_INSTANCE = orig;
  });

  it('returns false for PM2 instance > 0', () => {
    const orig = process.env.NODE_APP_INSTANCE;
    process.env.NODE_APP_INSTANCE = '3';
    expect(isPrimaryProcess({ pm2: true })).toBe(false);
    if (orig === undefined) delete process.env.NODE_APP_INSTANCE;
    else process.env.NODE_APP_INSTANCE = orig;
  });

  it('supports custom pm2InstanceVar', () => {
    const orig = process.env.MY_INSTANCE;
    process.env.MY_INSTANCE = '0';
    expect(isPrimaryProcess({ pm2: true, pm2InstanceVar: 'MY_INSTANCE' })).toBe(true);
    process.env.MY_INSTANCE = '2';
    expect(isPrimaryProcess({ pm2: true, pm2InstanceVar: 'MY_INSTANCE' })).toBe(false);
    if (orig === undefined) delete process.env.MY_INSTANCE;
    else process.env.MY_INSTANCE = orig;
  });
});
