import {
  Event,
  EventType,
  KillEvent,
  MatchEnded,
  MatchStarted,
} from '../event.interface';

function parseDate(dateStr: string): Date {
  const [day, month, yearAndTime] = dateStr.split('/');
  const [year, time] = yearAndTime.split(' ');
  return new Date(`${year}-${month}-${day}T${time}`);
}

export function parseEvent(line: string): Event | null {
  const dateRegex = /^(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}) - (.+)$/;
  const match = line.match(dateRegex);
  if (!match) return null;

  const timestamp = parseDate(match[1]);
  const eventStr = match[2];

  if (eventStr.startsWith('New match')) {
    const matchId = parseInt(eventStr.match(/\d+/)?.[0] || '0');
    console.log(matchId);
    return {
      timestamp,
      type: EventType.MATCH_STARTED,
      matchId,
    } as MatchStarted;
  }

  if (eventStr.startsWith('Match') && eventStr.includes('has ended')) {
    const matchId = parseInt(eventStr.match(/\d+/)?.[0] || '0');
    return { timestamp, type: EventType.MATCH_ENDED, matchId } as MatchEnded;
  }

  if (eventStr.includes('killed')) {
    if (eventStr.includes('<WORLD> killed')) {
      const parts = eventStr.match(/<WORLD> killed (\w+) by (\w+)/);
      if (!parts) return null;
      return {
        timestamp,
        type: EventType.KILL,
        killer: '<WORLD>',
        victim: parts[1],
        cause: parts[2],
      } as KillEvent;
    } else {
      const parts = eventStr.match(/(\w+) killed (\w+) using (\w+)/);
      if (!parts) return null;
      return {
        timestamp,
        type: EventType.KILL,
        killer: parts[1],
        victim: parts[2],
        weapon: parts[3],
      } as KillEvent;
    }
  }

  return null;
}
