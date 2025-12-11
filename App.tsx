import React, { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Ruler, ChevronRight, ChevronLeft, 
  RefreshCw, Sun, Moon, 
  Info, AlertTriangle, Mail, Lock, Star
} from 'lucide-react';

import { League, Sport, StrengthLevel, UserMeasurements, BatRecommendation, BatMaterial } from './types';
import { calculateRecommendation, calculateTestWeight, getHouseholdItem } from './services/batLogic';
import { subscribeToNewsletter } from './services/api';
import StepIndicator from './components/StepIndicator';

// Initial State
const initialMeasurements: UserMeasurements = {
  sport: Sport.Baseball,
  league: League.BaseballUSA,
  age: 10,
  heightFeet: 4,
  heightInches: 6,
  centerToFingertip: 0,
  weight: 80,
  strengthTestResult: StrengthLevel.Unselected,
  materialPreference: BatMaterial.NoPreference, // Default to No Preference
  email: ''
};

export default function App() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<UserMeasurements>(initialMeasurements);
  const [recommendation, setRecommendation] = useState<BatRecommendation | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to Light Mode
  const [emailError, setEmailError] = useState('');

  // Timer State
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const timerRef = useRef<number | null>(null);

  const theme = useMemo(() => {
    const isBaseball = data.sport === Sport.Baseball;
    return {
      bgApp: isDarkMode ? 'bg-slate-950' : 'bg-gray-50',
      bgPanel: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200',
      bgInput: isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-slate-900',
      textMain: isDarkMode ? 'text-white' : 'text-slate-900',
      textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
      accentText: isBaseball ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400',
      accentBg: isBaseball ? 'bg-emerald-600' : 'bg-yellow-500',
      accentBorder: isBaseball ? 'border-emerald-600' : 'border-yellow-500',
      primaryButton: isBaseball 
        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' 
        : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-500/20',
    };
  }, [data.sport, isDarkMode]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Timer Logic
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setTimerFinished(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timerActive, timeLeft]);

  const startTimer = () => {
    setTimeLeft(20);
    setTimerActive(true);
    setTimerFinished(false);
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleNext = () => {
    // Validate Email before moving to final step
    if (step === 4) {
      if (!validateEmail(data.email)) {
        setEmailError('Please enter a valid email address to unlock your report.');
        return;
      }
      setEmailError(''); // Clear error if valid
      
      const rec = calculateRecommendation(data);
      setRecommendation(rec);

      // Trigger MailerLite Subscription
      // Format: "30-inch // 20 oz (-10 Drop)"
      const batString = `${rec.length}-inch // ${rec.weight} oz (${rec.drop} Drop)`;
      subscribeToNewsletter(data.email, data.sport, batString);
    }

    setStep(prev => Math.min(prev + 1, 5));
  };

  const handleReset = () => {
    setData(initialMeasurements);
    setStep(1);
    setRecommendation(null);
    setTimerFinished(false);
    setTimeLeft(20);
    setEmailError('');
  };

  const getAvailableLeagues = () => {
    if (data.sport === Sport.Baseball) {
      return [
        League.TBall,
        League.BaseballUSA,
        League.BaseballUSSSA,
        League.BBCOR
      ];
    }
    return [
      League.SoftballTBall,
      League.SoftballRec,
      League.SoftballTravel,
      League.SoftballHS
    ];
  };

  // Handle sport change to reset league to valid default
  const handleSportChange = (newSport: Sport) => {
    let defaultLeague = League.BaseballUSA;
    if (newSport === Sport.Softball) defaultLeague = League.SoftballRec;
    
    setData({
      ...data,
      sport: newSport,
      league: defaultLeague
    });
  };

  const renderSizer = () => {
    return (
      <div className="space-y-8">
        <StepIndicator 
          currentStep={step} totalSteps={5} 
          labels={['Rules', 'Matrix', 'Strength', 'Unlock', 'Report']}
          activeColorClass={theme.accentText} barColorClass={theme.accentBg} 
          isDarkMode={isDarkMode} 
        />
        
        {step === 1 && (
          <div className="animate-fadeIn space-y-8">
             <div className="space-y-4">
               <h3 className={`text-2xl font-sport uppercase ${theme.textMain}`}>Select Sport</h3>
               <div className="grid grid-cols-2 gap-4">
                  {Object.values(Sport).map(s => (
                    <button 
                      key={s} 
                      onClick={() => handleSportChange(s)}
                      className={`relative p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-center text-center gap-2 ${
                        data.sport === s 
                          ? `${theme.accentBorder} bg-opacity-5 ${isDarkMode ? 'bg-white' : 'bg-black'} ${theme.textMain} shadow-lg scale-[1.02]` 
                          : `border-transparent ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'} text-gray-500`
                      }`}
                    >
                      {/* Visual Indicator of selection */}
                      {data.sport === s && (
                        <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${theme.accentBg}`} />
                      )}
                      <div className={`text-lg font-bold uppercase tracking-wider ${data.sport === s ? theme.accentText : 'text-gray-500'}`}>
                        {s}
                      </div>
                    </button>
                  ))}
               </div>
             </div>

             <div className="space-y-4">
                <label className={`text-sm font-bold uppercase tracking-wider ${theme.textMuted}`}>League / Level</label>
                <select 
                  value={data.league} 
                  onChange={e => setData({...data, league: e.target.value as League})} 
                  className={`w-full p-4 rounded-xl outline-none border-2 transition-colors ${theme.bgInput} focus:${theme.accentBorder}`}
                >
                  {getAvailableLeagues().map(l => <option key={l} value={l} className="text-black">{l}</option>)}
                </select>
                <p className="text-xs text-gray-500 italic mt-1">This determines which bats are legal for your athlete’s league.</p>
             </div>
             
             {data.league === League.BBCOR && (
               <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center">
                 <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/> 
                 <span><strong>Requirement:</strong> High School mandates BBCOR (-3) drop weight.</span>
               </div>
             )}
          </div>
        )}

        {step === 2 && (
          <div className="animate-fadeIn space-y-6">
            <h3 className={`text-2xl font-sport uppercase ${theme.textMain}`}>Measurements</h3>
            
            <div className="space-y-2">
              <label className={`text-xs uppercase font-bold ${theme.textMuted}`}>Age</label>
              <input type="number" value={data.age} onChange={e => setData({...data, age: +e.target.value})} 
                className={`w-full p-4 rounded-xl outline-none border-2 transition-colors ${theme.bgInput} focus:${theme.accentBorder}`} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className={`text-xs uppercase font-bold ${theme.textMuted}`}>Height (Ft)</label>
                 <input type="number" value={data.heightFeet} onChange={e => setData({...data, heightFeet: +e.target.value})} 
                  className={`w-full p-4 rounded-xl mt-2 outline-none border-2 transition-colors ${theme.bgInput} focus:${theme.accentBorder}`} />
              </div>
              <div>
                 <label className={`text-xs uppercase font-bold ${theme.textMuted}`}>Height (In)</label>
                 <input type="number" value={data.heightInches} onChange={e => setData({...data, heightInches: +e.target.value})} 
                  className={`w-full p-4 rounded-xl mt-2 outline-none border-2 transition-colors ${theme.bgInput} focus:${theme.accentBorder}`} />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-xs uppercase font-bold ${theme.textMuted}`}>Player Weight (Lbs)</label>
              <input type="number" value={data.weight} onChange={e => setData({...data, weight: +e.target.value})} 
                className={`w-full p-4 rounded-xl outline-none border-2 transition-colors ${theme.bgInput} focus:${theme.accentBorder}`} />
            </div>

            {/* Revised Measurement Section */}
            <div className={`mt-4 border rounded-xl overflow-hidden ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-white'}`}>
              <div className="p-6">
                <div className="flex items-center mb-3">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <Ruler className={`w-4 h-4 ${theme.accentText}`} />
                   </div>
                   <h4 className={`font-bold uppercase tracking-wider ${theme.textMain}`}>The "Center-to-Fingertip" Method</h4>
                </div>
                
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  This is the <strong>Gold Standard</strong> for sizing. Measure from the center of the player's chest to the tip of their index finger while their arm is held straight out to the side.
                </p>

                <div className={`flex items-center p-4 rounded-lg border-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'} transition-colors focus-within:${theme.accentBorder}`}>
                  <label className="flex-shrink-0 text-xs font-bold uppercase tracking-wider mr-4 text-gray-500">Your Measurement:</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 28" 
                    value={data.centerToFingertip || ''} 
                    onChange={e => setData({...data, centerToFingertip: +e.target.value})} 
                    className={`flex-1 min-w-0 bg-transparent text-lg font-mono font-bold outline-none ${theme.textMain} placeholder-gray-300`} 
                  />
                  <span className="ml-2 text-xs font-bold text-gray-400">INCHES</span>
                </div>

                <details className="group mt-5 pt-5 border-t border-gray-100 dark:border-slate-700">
                  <summary className="text-xs font-bold uppercase text-gray-400 cursor-pointer hover:text-gray-600 flex items-center select-none">
                    <Info className="w-4 h-4 mr-1"/>
                    <span>Other ways to check (requires bat)</span>
                    <span className="ml-auto transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-4 space-y-4 text-sm text-gray-500 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg">
                    <div>
                       <span className={`font-bold block mb-1 ${theme.textMain}`}>Chest Reach:</span> 
                       Place knob at center of chest. Player reaches forward. They should be able to just barely cup the end cap.
                    </div>
                    <div>
                       <span className={`font-bold block mb-1 ${theme.textMain}`}>Palm Check:</span> 
                       Stand bat vertically against leg. The knob should reach the center of the player's palm.
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fadeIn space-y-8">
             <h3 className={`text-2xl font-sport uppercase ${theme.textMain}`}>Strength & Preference</h3>
             <div className={`p-8 rounded-2xl border-2 text-center transition-colors ${timerFinished ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : `${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}`}>
                <h4 className={`font-bold uppercase mb-2 ${theme.textMain} text-xl`}>The {calculateTestWeight(data.weight, data.league)} oz Hold Test</h4>
                <p className={`text-sm ${theme.textMuted} mb-6`}>Hold a {getHouseholdItem(calculateTestWeight(data.weight, data.league))} straight out.</p>
                
                {!timerActive && !timerFinished ? (
                   <button onClick={startTimer} className={`px-8 py-3 rounded-full font-bold text-sm uppercase tracking-wide transform hover:scale-105 transition-all ${theme.primaryButton}`}>Start 20s Timer</button>
                ) : (
                   <div className={`text-5xl font-mono font-black ${theme.textMain}`}>{timeLeft > 0 ? timeLeft : "TIME'S UP!"}</div>
                )}
                
                {(timerFinished || timeLeft < 20) && (
                   <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slideUp">
                      {Object.values(StrengthLevel).filter(x => x !== 'Unselected').map(lvl => (
                        <button key={lvl} onClick={() => setData({...data, strengthTestResult: lvl})} 
                          className={`p-3 text-sm rounded-lg border-2 font-bold transition-all ${data.strengthTestResult === lvl ? `${theme.accentBorder} ${theme.accentBg} bg-opacity-10 text-black dark:text-white` : 'border-transparent bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>
                          {lvl}
                        </button>
                      ))}
                   </div>
                )}
             </div>

             <div className="space-y-3">
                <label className={`text-sm font-bold uppercase tracking-wider ${theme.textMuted}`}>Material Preference</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   {[BatMaterial.Composite, BatMaterial.Alloy, BatMaterial.NoPreference].map(mat => (
                      <button key={mat} onClick={() => setData({...data, materialPreference: mat})}
                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${data.materialPreference === mat ? `${theme.accentBorder} ${theme.accentBg} bg-opacity-5 ${theme.textMain}` : 'border-transparent bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>
                        {mat}
                      </button>
                   ))}
                </div>
                <p className="text-xs text-gray-500 italic px-1">*Composite = Bigger sweet spot, requires break-in. Alloy = Hot out of wrapper, stiff feel.</p>
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fadeIn space-y-8">
            <div className="text-center space-y-4">
               <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} mb-6`}>
                 <Lock className="w-8 h-8"/>
               </div>
               <h3 className={`text-3xl font-sport uppercase ${theme.textMain}`}>Unlock Your Report</h3>
               <p className={`${theme.textMuted}`}>
                 Your custom sizing profile is ready. Enter your email to view your personalized scouting report and bat recommendations.
               </p>
            </div>

            <div className={`max-w-md mx-auto p-6 rounded-2xl border-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
               <div className="space-y-2">
                 <label className={`text-xs uppercase font-bold ${theme.textMuted}`}>Where should we send your Official Scouting Report?</label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"/>
                    <input 
                      type="email" 
                      placeholder="parent@example.com"
                      value={data.email} 
                      onChange={e => {
                        setData({...data, email: e.target.value});
                        if(emailError) setEmailError('');
                      }} 
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleNext();
                      }}
                      className={`w-full pl-12 pr-4 py-4 rounded-xl outline-none border-2 transition-colors ${theme.bgInput} ${emailError ? 'border-red-500 focus:border-red-500' : `focus:${theme.accentBorder}`}`} 
                    />
                 </div>
                 {emailError && (
                   <p className="text-red-500 text-xs font-bold mt-2 animate-pulse">{emailError}</p>
                 )}
               </div>

               <div className="mt-6 flex items-start space-x-3 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400"/>
                  <span>
                    <strong>🔒 We respect your privacy.</strong> Unlock your results & join the Scorezle Pro tips list.
                  </span>
               </div>
            </div>
          </div>
        )}

        {step === 5 && recommendation && (
           <div className="animate-slideUp space-y-8">
              <div className="flex justify-between items-end pb-4 border-b border-gray-100 dark:border-slate-800">
                <h3 className={`text-3xl font-sport uppercase ${theme.textMain}`}>Your Fit</h3>
                <button onClick={handleReset} className="flex items-center text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider"><RefreshCw className="w-3 h-3 mr-1"/> Start Over</button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-4">
                 {[
                   { l: 'Length', v: recommendation.length + '"', c: theme.accentText },
                   { l: 'Weight', v: recommendation.weight + 'oz', c: theme.textMain },
                   { l: 'Drop', v: recommendation.drop, c: 'text-red-500' },
                 ].map((s, i) => (
                   <div key={i} className={`p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-center shadow-sm`}>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">{s.l}</div>
                      <div className={`text-3xl font-black font-sport ${s.c}`}>{s.v}</div>
                   </div>
                 ))}
              </div>

              <div className="space-y-4">
                 <h4 className={`text-sm font-bold uppercase tracking-wider ${theme.textMuted}`}>Recommended Models</h4>
                 {recommendation.picks.map((pick, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                       <div>
                          <div className={`text-xs font-black uppercase tracking-widest mb-1 ${
                              pick.type === 'Budget' ? 'text-gray-500' : 
                              pick.type === 'Composite' ? 'text-blue-500' : 'text-green-600'
                          }`}>{pick.type} Pick</div>
                          <div className={`text-xl font-bold ${theme.textMain}`}>{pick.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{pick.desc}</div>
                       </div>
                       <a href={`https://www.amazon.com/s?k=${encodeURIComponent(pick.name + " bat")}`} target="_blank" className="mt-4 md:mt-0 px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-lg uppercase tracking-wider text-center hover:bg-black transition-colors">
                          Check Price
                       </a>
                    </div>
                 ))}
              </div>
              
              <div className="p-5 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800">
                 <div className="flex items-center text-xs font-bold uppercase text-gray-400 mb-3"><Info className="w-3 h-3 mr-2"/> Why this size?</div>
                 <ul className="space-y-2">
                   {recommendation.reasoning.map((r, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start leading-relaxed"><span className="mr-3 text-gray-300">•</span>{r}</li>)}
                 </ul>
                 <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 text-[10px] text-center text-gray-400 font-mono uppercase tracking-widest opacity-60">
                    Algorithm based on height, weight, reach, and league restrictions
                 </div>
              </div>

              {/* Updated Scorezle Footer with Marketing Pop */}
              <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center shadow-xl transform transition-all hover:scale-[1.01] animate-fadeIn relative overflow-hidden group">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                
                <div className="relative z-10">
                  <div className="inline-block p-2 rounded-full bg-white/10 mb-4 backdrop-blur-sm">
                    <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                  </div>
                  <h4 className="font-sport uppercase font-black text-2xl md:text-3xl mb-4 leading-tight">
                    Your athlete is officially scouted and ready to swing for the fences.
                  </h4>
                  <p className="text-indigo-100 font-medium text-base md:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                    Now unlock their <span className="font-bold text-white bg-white/20 px-1 rounded">Scorezle Journey</span>. 
                    <br className="hidden md:block" />
                    A monthly story + card adventure that builds confidence, sportsmanship, and motivation.
                  </p>
                  <a href="https://www.scorezle.com" target="_blank" rel="noopener noreferrer" className="inline-flex px-8 py-4 rounded-full bg-white text-indigo-900 font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-gray-50 hover:shadow-indigo-900/30 hover:-translate-y-1 transition-all items-center justify-center mx-auto ring-4 ring-white/30 w-fit">
                      Unlock Your Scorezle Journey
                  </a>
                </div>
              </div>
           </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-slate-800">
            <button 
              onClick={() => setStep(s => Math.max(1, s - 1))} 
              disabled={step === 1} 
              className={`flex items-center text-sm font-bold uppercase tracking-wider ${step===1?'opacity-0 cursor-default': 'text-gray-400 hover:text-gray-600'}`}
            >
              <ChevronLeft className="w-4 h-4 mr-1"/> Back
            </button>
            <button 
              onClick={handleNext} 
              className={`flex items-center px-8 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-transform hover:-translate-y-1 ${theme.primaryButton}`}
            >
              {step === 4 ? 'Get Official Report' : 'Next Step'} <ChevronRight className="w-4 h-4 ml-2"/>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans flex items-center justify-center p-4 md:p-8 transition-colors duration-500 ${theme.bgApp}`}>
      
      {/* Dark Toggle */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)} 
        className={`absolute top-6 right-6 p-3 rounded-full transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-400 hover:text-yellow-500 shadow-md'} z-50`}
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className={`text-5xl md:text-6xl font-sport font-black tracking-tighter uppercase ${theme.textMain} mb-2`}>
            Scorezle <span className={theme.accentText}>Bat Sizer</span>
            <span className="ml-2 text-sm font-sans font-bold opacity-30 tracking-widest bg-gray-200 dark:bg-slate-800 px-2 py-1 rounded align-middle">V2.0</span>
          </h1>
          <p className={`${theme.textMuted} font-mono text-xs uppercase tracking-[0.2em]`}>Precision Sizing Instrument</p>
        </div>

        <div className={`p-6 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden ${theme.bgPanel} transition-all duration-300 min-h-[600px]`}>
           {renderSizer()}
        </div>
      </div>
    </div>
  );
}