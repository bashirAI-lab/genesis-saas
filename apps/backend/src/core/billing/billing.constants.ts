export const PlanRanks: Record<string, number> = {
  free: 0,
  silver: 10,
  gold: 20,
  enterprise: 30,
};

// Also define usage limits per plan (mock limits)
export const PlanLimits: Record<string, { maxRecords: number }> = {
  free: { maxRecords: 100 },
  silver: { maxRecords: 10000 },
  gold: { maxRecords: 50000 },
  enterprise: { maxRecords: 9999999 },
};
