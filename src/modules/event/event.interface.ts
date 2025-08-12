export enum EventType {
  MATCH_STARTED = 'MATCH_STARTED',
  KILL = 'KILL',
  MATCH_ENDED = 'MATCH_ENDED',
}
export interface Event {
  timestamp: Date;
  type: EventType;
}

export interface MatchStarted extends Event {
  matchId: number;
}

export interface KillEvent extends Event {
  killer: string;
  victim: string;
  weapon?: string;
  cause?: string;
}

export interface MatchEnded extends Event {
  matchId: number;
}
