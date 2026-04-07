/**
 * Utility Formula: U = Q_score * (1 - (Friction * SensitivityWeight))
 * 
 * QualityScore (Q): 1-10 based on "surfability" (Height, Period, Wind).
 * Friction (F): Traffic (70%) + Crowd (30%) normalized 0 to 1.
 * Sensitivity (S): User preference 1-10.
 * 
 * This formula ensures that high-quality waves (Q=10) remain high-scoring 
 * even with bad traffic, while flat waves (Q=2) can never reach a high score.
 */

export const calculateUtilityScore = (qualityScore, trafficFriction, crowdFriction, sensitivity) => {
  // Normalize total friction to a 0-1 scale
  // trafficFriction and crowdFriction are 0 (clear) to 1 (heavy)
  const totalFriction = (trafficFriction * 0.7 + crowdFriction * 0.3);
  
  // Sensitivity Weight: 1 (don't care) to 10 (hate traffic)
  // Maps to a "discount" factor. At max sensitivity, bad friction can cut 50% of the score.
  const sensitivityWeight = (sensitivity / 10) * 0.5;
  
  // Calculate Discount: 1.0 (no discount) to 0.5 (max discount)
  const discount = 1 - (totalFriction * sensitivityWeight);
  
  const utility = qualityScore * discount;
  
  return parseFloat(utility.toFixed(1));
};

export const getQualityScore = (waveHeight, period, windSpeed, isOffshore) => {
  let score = 0;

  // 1. HEIGHT (The Foundation)
  // We want to reward "real" waves and penalize "ankles"
  if (waveHeight < 1.0) score = 1.0; // Flat/Micro
  else if (waveHeight < 2.0) score = 3.0; // Knee to Waist
  else if (waveHeight < 4.0) score = 6.0; // Chest to Head
  else if (waveHeight < 8.0) score = 8.5; // Overhead
  else score = 10.0; // Epic/Double Overhead+

  // 2. PERIOD (The Energy)
  // Long period swell is much more "worthy" than wind-slop
  if (period >= 14) score += 1.5;
  else if (period >= 10) score += 1.0;
  else if (period >= 7) score += 0.5;
  else if (period < 5) score -= 2.0; // Weak wind-waves

  // 3. WIND (The Cleanliness)
  if (isOffshore) {
    score += 1.0;
    if (windSpeed < 10) score += 0.5; // Clean & Light
  } else {
    if (windSpeed > 15) score -= 2.5; // Blown out
    else if (windSpeed > 8) score -= 1.0; // Choppy
  }

  // 4. THE "NOT WORTHY" FLOOR
  // If it's too small AND low period, it's just not surfing.
  if (waveHeight < 1.5 && period < 6) {
    score = Math.min(score, 3.0);
  }

  return Math.min(10, Math.max(1, parseFloat(score.toFixed(1))));
};
