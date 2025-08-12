import { parseEvent } from './events.parser';
import { KillEvent, MatchEnded, MatchStarted } from '../events.interface';

describe('parseEvent completo', () => {
  it('parseia MATCH_STARTED corretamente', () => {
    const line = '12/08/2025 10:15:30 - New match 12345 has started';
    const event = parseEvent(line) as MatchStarted;
    expect(event).not.toBeNull();
    expect(event.type).toBe('MATCH_STARTED');
    expect(event.matchId).toBe(12345);
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  it('parseia KILL com arma corretamente', () => {
    const line = '12/08/2025 10:20:00 - Alice killed Bob using AK47';
    const event = parseEvent(line) as KillEvent;
    expect(event).not.toBeNull();
    expect(event.type).toBe('KILL');
    expect(event.killer).toBe('Alice');
    expect(event.victim).toBe('Bob');
    expect(event.weapon).toBe('AK47');
    expect(event.cause).toBeUndefined();
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  it('parseia KILL do <WORLD> corretamente', () => {
    const line = '12/08/2025 10:25:00 - <WORLD> killed Charlie by FIRE';
    const event = parseEvent(line) as KillEvent;
    expect(event).not.toBeNull();
    expect(event.type).toBe('KILL');
    expect(event.killer).toBe('<WORLD>');
    expect(event.victim).toBe('Charlie');
    expect(event.cause).toBe('FIRE');
    expect(event.weapon).toBeUndefined();
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  it('parseia MATCH_ENDED corretamente', () => {
    const line = '12/08/2025 11:00:00 - Match 12345 has ended';
    const event = parseEvent(line) as MatchEnded;
    expect(event).not.toBeNull();
    expect(event.type).toBe('MATCH_ENDED');
    expect(event.matchId).toBe(12345);
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  it('retorna null para linha mal formatada', () => {
    expect(parseEvent('linha inválida')).toBeNull();
    expect(parseEvent('12/08/2025 10:20:00 without proper format')).toBeNull();
    expect(parseEvent('12/08/2025 10:20:00 - Unknown event')).toBeNull();
  });
});
