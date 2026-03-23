/**
 * Utility Formula: U = Q_score / (L_friction * S_f)
 * 
 * Q_score: 1-10 based on swell and wind alignment.
 * L_friction: Traffic (80%) + Crowd (20%).
 * S_f: Friction Sensitivity (User preference 1-10).
 */

export const calculateUtilityScore = (qualityScore, trafficFriction, crowdFriction, sensitivity) => {
  // Normalize friction to a scale where 1 is "no friction" and higher is "more friction"
  // Traffic and crowd are expected to be 0 to 1 (0 = clear, 1 = heavy)
  const lFriction = (trafficFriction * 0.8 + crowdFriction * 0.2) + 1;
  
  // Calculate U
  const utility = qualityScore / (lFriction * (sensitivity / 5));
  
  return parseFloat(utility.toFixed(1));
};

export const getQualityScore = (waveHeight, period, windSpeed, isOffshore) => {
  let score = 5; // Base score

  // Height logic (simplified for PoC)
  if (waveHeight >= 3 && waveHeight <= 6) score += 2;
  if (waveHeight > 6 && waveHeight <= 10) score += 3;
  
  // Period logic
  if (period >= 12) score += 2;
  
  // Wind logic
  if (isOffshore) score += 1;
  if (windSpeed < 5) score += 1; // Glassy

  return Math.min(10, score);
};
