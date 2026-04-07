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
  let score = 3; // Base score (lower base for tiny waves)

  // Height logic: More granular for smaller waves
  if (waveHeight < 1) score += (waveHeight * 2); // 0.5ft adds 1.0, 0.7ft adds 1.4
  else if (waveHeight >= 1 && waveHeight < 3) score += 3;
  else if (waveHeight >= 3 && waveHeight <= 6) score += 5;
  else if (waveHeight > 6 && waveHeight <= 10) score += 6;
  else if (waveHeight > 10) score += 7; // Heavy water!
  
  // Period logic: Longer is almost always better
  if (period >= 12) score += 2;
  else if (period >= 8) score += 1;
  else if (period < 4) score -= 1; // Super wind-chop / weak
  
  // Wind logic
  if (isOffshore) score += 1.5;
  if (windSpeed < 5) score += 1; // Glassy
  else if (windSpeed > 15 && !isOffshore) score -= 2; // Blown out

  return Math.min(10, Math.max(1, parseFloat(score.toFixed(1))));
};
