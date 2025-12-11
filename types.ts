export enum Sport {
  Baseball = 'Baseball',
  Softball = 'Softball',
}

export enum League {
  // Baseball
  TBall = 'Tee Ball (Tee Ball Bat)',
  BaseballUSA = 'Little League / Rec (USA Bat)',
  BaseballUSSSA = 'Travel Ball (USSSA Big Barrel)',
  BBCOR = 'High School (BBCOR)',
  
  // Softball
  SoftballTBall = 'Tee Ball Softball (Tee Ball Bat or Fastpitch Bat)',
  SoftballRec = 'Rec / Little League Softball (USA Softball Bat)',
  SoftballTravel = 'Travel Fastpitch (USSSA / USA Softball Fastpitch Bat)',
  SoftballHS = 'High School Softball (USA Softball Fastpitch Bat)'
}

export enum StrengthLevel {
  Unselected = 'Unselected',
  Easy = 'Yes, Easy',
  Struggled = 'Yes, but struggled',
  Failed = 'No, arm dropped',
}

export enum BatMaterial {
  Composite = 'Composite',
  Alloy = 'Alloy',
  Hybrid = 'Hybrid',
  Wood = 'Wood',
  NoPreference = 'No Preference'
}

export interface UserMeasurements {
  sport: Sport;
  league: League;
  age: number; // Age of the athlete
  heightFeet: number;
  heightInches: number;
  centerToFingertip: number; // inches
  weight: number; // lbs
  strengthTestResult: StrengthLevel;
  materialPreference: BatMaterial;
  email: string;
}

export interface BatRecommendation {
  length: number; // inches
  weight: number; // oz
  drop: number; // weight - length
  reasoning: string[];
  picks: {
    name: string;
    desc: string;
    type: string;
  }[];
}