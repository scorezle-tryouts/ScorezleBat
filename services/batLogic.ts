import { BatMaterial, League, Sport, StrengthLevel, UserMeasurements, BatRecommendation } from '../types';

/**
 * Calculates the estimated test weight for the strength test.
 */
export const calculateTestWeight = (weight: number, league: League): number => {
  if (league === League.TBall || league === League.SoftballTBall) return 15;
  
  // Baseball Heavy
  if (league === League.BBCOR) return 28; 
  
  // Softball is generally -10, so lighter than BBCOR (-3)
  if (league === League.SoftballHS || league === League.SoftballTravel || league === League.SoftballRec) return 23;

  if (weight < 70) return 18;
  if (weight < 100) return 20;
  return 23;
};

/**
 * Returns a common household item that approximates the target weight.
 */
export const getHouseholdItem = (oz: number): string => {
  if (oz <= 16) return "Standard Soup Can (approx 15oz)";
  if (oz <= 19) return "Full 16.9oz Water Bottle";
  if (oz <= 22) return "Full 20oz Sports Drink Bottle";
  if (oz <= 26) return "Large Pasta Sauce Jar (approx 24oz)";
  return "Quart of Milk (approx 2 lbs)";
};

// [MinInches, MaxInches, RecommendedLength]
type RangeRule = [number, number, number];

// Matrix Definition
const YOUTH_MATRIX: { minWeight: number; maxWeight: number; ranges: RangeRule[] }[] = [
  {
    minWeight: 0,
    maxWeight: 50,
    ranges: [
      [36, 40, 26], 
      [41, 44, 26], 
      [45, 48, 27], 
      [49, 52, 28], 
      [53, 56, 29], 
    ]
  },
  {
    minWeight: 51,
    maxWeight: 70,
    ranges: [
      [36, 40, 26],
      [41, 44, 26],
      [45, 48, 27],
      [49, 52, 28],
      [53, 56, 29],
      [57, 60, 29], 
      [61, 64, 30], 
    ]
  },
  {
    minWeight: 71,
    maxWeight: 90,
    ranges: [
      [41, 44, 27],
      [45, 48, 28], 
      [49, 52, 29],
      [53, 56, 29],
      [57, 60, 30],
      [61, 64, 30],
    ]
  },
  {
    minWeight: 91,
    maxWeight: 110,
    ranges: [
      [49, 52, 29],
      [53, 56, 30],
      [57, 60, 30],
      [61, 64, 31],
      [65, 68, 31], 
    ]
  },
  // Extrapolated for larger players > 110lbs
  {
    minWeight: 111,
    maxWeight: 300,
    ranges: [
      [60, 64, 31],
      [65, 68, 32],
      [69, 72, 33],
      [73, 84, 33], 
    ]
  }
];

export const calculateRecommendation = (data: UserMeasurements): BatRecommendation => {
  const reasons: string[] = [];
  const totalInches = (data.heightFeet * 12) + data.heightInches;
  let recLength = 28; // Fallback

  // --- 1. SIZING MATRIX LOGIC ---
  const weightGroup = YOUTH_MATRIX.find(
    (g) => data.weight >= g.minWeight && data.weight <= g.maxWeight
  );

  if (weightGroup) {
    const range = weightGroup.ranges.find(r => totalInches >= r[0] && totalInches <= r[1]);
    
    if (range) {
      recLength = range[2];
      reasons.push(`Matrix Match: ${data.weight}lb player at ${data.heightFeet}'${data.heightInches}" maps to ${recLength}".`);
    } else {
      if (totalInches < weightGroup.ranges[0][0]) {
         recLength = weightGroup.ranges[0][2];
         reasons.push("Height below weight class range: Suggesting smallest safe size.");
      } else {
         const lastRange = weightGroup.ranges[weightGroup.ranges.length - 1];
         recLength = lastRange[2];
         reasons.push("Height above weight class range: Suggesting max size for weight class.");
      }
    }
  } else {
    reasons.push("Weight outside standard matrix: Using generic height scale.");
    if (totalInches < 48) recLength = 27;
    else if (totalInches < 54) recLength = 29;
    else if (totalInches < 60) recLength = 30;
    else if (totalInches < 66) recLength = 32;
    else recLength = 33;
  }

  // --- 2. ARM LENGTH VALIDATION ---
  if (data.centerToFingertip > 0) {
    const armLength = Math.round(data.centerToFingertip);
    if (Math.abs(armLength - recLength) > 1) {
      reasons.push(`Pro Tip: Your arm measurement (${armLength}") suggests a different size than the chart (${recLength}"). We averaged them for safety.`);
      recLength = Math.round((recLength + armLength) / 2);
    } else {
      reasons.push(`Validation: Arm measurement confirms chart sizing.`);
    }
  }

  // --- 3. DROP / WEIGHT LOGIC ---
  let recDrop = -10; // Standard Youth
  
  if (data.league === League.BBCOR) {
    recDrop = -3;
    reasons.push("Legal: BBCOR Mandatory -3.");
  } else if (data.league === League.TBall || data.league === League.SoftballTBall) {
    recDrop = -11; 
    reasons.push("Level: T-Ball standard is -11 to -13.");
  } else if (data.sport === Sport.Softball) {
     // Softball Logic
     if (data.league === League.SoftballHS) {
       recDrop = -10; // Standard HS Fastpitch
       reasons.push("Legal: Standard High School Fastpitch is -10.");
     } else {
       // Travel/Rec
       recDrop = -11;
       if (data.age >= 13 || data.strengthTestResult === StrengthLevel.Easy) {
         recDrop = -10;
         reasons.push("Strength/Age: Suggesting -10 for power.");
       } else {
         reasons.push("Standard: -11 is common for youth fastpitch.");
       }
     }
  } else {
    // Baseball USA/USSSA Logic
    // Baseline based on Age
    if (data.age <= 10) {
      recDrop = -10; // Standard for U10
      reasons.push("Age Base: -10 is standard for ages 10 and under.");
    } else if (data.age <= 12) {
      recDrop = -10;
      if (data.league === League.BaseballUSSSA) {
         // USSSA players often move to -8 earlier
         recDrop = -8;
         reasons.push("League Trend: USSSA players 11-12 often swing -8.");
      } else {
         reasons.push("Age Base: -10 remains standard for 11-12 USA Baseball.");
      }
    } else {
      // 13+ (Pre-High School)
      recDrop = -5;
      reasons.push("Transition: Preparing for BBCOR (-3) with a -5.");
    }

    // Strength Adjustments
    if (data.strengthTestResult === StrengthLevel.Easy) {
       if (recDrop === -10 || recDrop === -11) {
         recDrop = -8;
         reasons.push("Strength Test Passed: Upgrading to -8 for more mass.");
       } else if (recDrop === -8) {
         recDrop = -5;
         reasons.push("Strength Test Passed: Upgrading to -5 for max power.");
       }
    } else if (data.strengthTestResult === StrengthLevel.Failed || data.strengthTestResult === StrengthLevel.Struggled) {
       if (recDrop === -5) {
         recDrop = -8;
         reasons.push("Strength Check: Dropping to -8 to preserve swing speed.");
       } else if (recDrop === -8) {
         recDrop = -10;
         reasons.push("Strength Check: Dropping to -10 to preserve swing speed.");
       } else if (recDrop === -10) {
         recDrop = -11;
         reasons.push("Strength Check: Suggesting ultra-light -11.");
       }
    }

    // SANITY CHECK: Length vs Drop Availability
    // -5 bats usually start at 30".
    // -8 bats usually start at 29".
    if (recDrop === -5 && recLength < 30) {
      recDrop = -8;
      reasons.push("Availability: -5 bats typically start at 30\". Adjusted to -8.");
    }
    if (recDrop === -8 && recLength < 29) {
      recDrop = -10;
      reasons.push("Availability: -8 bats typically start at 29\". Adjusted to -10.");
    }
  }

  const recWeight = recLength + recDrop;

  // --- 4. MATERIAL RECOMMENDATIONS ---
  const picks = [];

  // Default definitions
  let compositePick = { name: "Composite Model", type: "Composite", desc: "Top tier performance." };
  let alloyPick = { name: "Alloy Model", type: "Alloy", desc: "Durable performance." };
  let budgetPick = { name: "Budget Model", type: "Budget", desc: "Best value option." };

  if (data.sport === Sport.Baseball) {
    // Budget Default
    budgetPick = { name: "Rawlings 5150", type: "Budget", desc: "Best value alloy performance." };

    if (data.league === League.BBCOR) {
        compositePick = { name: "Marucci CatX Composite", type: "Composite", desc: "Smooth feel, massive sweet spot." };
        alloyPick = { name: "Louisville Slugger Atlas", type: "Alloy", desc: "Top alloy performance." };
    } else if (data.league === League.BaseballUSSSA) {
        compositePick = { name: "Easton Hype Fire", type: "Composite", desc: "Hottest bat in USSSA." };
        alloyPick = { name: "Marucci CatX Alloy", type: "Alloy", desc: "Durable power." };
    } else if (data.league === League.TBall) {
        compositePick = { name: "Easton ADV T-Ball", type: "Composite", desc: "Lightweight technology." };
        alloyPick = { name: "Franklin Venom", type: "Alloy", desc: "Durable entry level." };
        budgetPick = { name: "Easton Moxie", type: "Budget", desc: "Great starter bat." };
    } else {
        // USA
        compositePick = { name: "Easton ADV 360", type: "Composite", desc: "Massive barrel, light swing." };
        alloyPick = { name: "Louisville Slugger Solo", type: "Alloy", desc: "Lightest swinging USA bat." };
    }
  } else {
    // Softball
    budgetPick = { name: "Louisville Slugger Quest", type: "Budget", desc: "Great entry level alloy." };
    compositePick = { name: "Easton Ghost Double Barrel", type: "Composite", desc: "The gold standard." };
    alloyPick = { name: "Anderson Rocketech", type: "Alloy", desc: "End-loaded power alloy." };
    
    // Override for TBall Softball if needed to be different, but generic is fine for now
    // as prompts didn't specify models for softball tball specifically.
  }
  
  // Sorting Logic: 
  // 1. Preference
  // 2. Alternative
  // 3. Budget
  if (data.materialPreference === BatMaterial.Alloy) {
      picks.push(alloyPick);
      picks.push(compositePick);
  } else {
      // Prioritize Composite for 'Composite' or 'NoPreference' as it's usually the "Pro" choice
      picks.push(compositePick);
      picks.push(alloyPick);
  }
  
  picks.push(budgetPick);

  return {
    length: recLength,
    weight: recWeight,
    drop: recDrop,
    reasoning: reasons,
    picks
  };
};