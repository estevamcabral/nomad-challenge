export interface PaginationParams {
  pageNumber?: number;
  size?: number;
}

export interface MatchRankingResult {
  playerName: string;
  totalKills: number;
  totalDeaths: number;
}

export interface PreferredWeaponResult {
  winnerName: string;
  preferredWeapon: string;
  weaponUsageCount: number;
}

export interface LongestStreakResult {
  playerName: string;
  longestStreak: number;
}
