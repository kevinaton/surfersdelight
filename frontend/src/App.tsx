import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Waves, MapPin, Wind, Clock, AlertTriangle, Coffee, 
  ShoppingBag, ArrowLeft, ArrowRight, Check, Send, MessageCircle, X, Bell, Settings, Search, Plus, User, Info, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_USER_ID = '79109041-3b55-4428-98e3-0d2f6f190e96';

const fetchScoutData = async (userName: string) => {
  const { data } = await axios.get(`http://localhost:3001/api/scout/current?userName=${userName}`);
  return data;
};

const fetchItineraryData = async (spot: any) => {
  const { data } = await axios.get(`http://localhost:3001/api/itinerary/${spot.name}?lat=${spot.lat}&lon=${spot.lon}`);
  return data;
};

const fetchPreferencesByName = async (userName: string) => {
  const { data } = await axios.get(`http://localhost:3001/api/preferences/by-name/${userName}`);
  return data;
};

const searchLocations = async (text: string) => {
  const { data } = await axios.get(`http://localhost:3001/api/geocoding/search?text=${text}`);
  return data;
};

const savePreferences = async (payload: { userName: string, preferences: any }) => {
  const { data } = await axios.post('http://localhost:3001/api/preferences/save', payload);
  return data;
};

const sendMessageToRick = async (payload: { message: string, history: any[] }) => {
  const { data } = await axios.post('http://localhost:3001/api/chat', payload);
  return data;
};

const RICK_ENCOURAGEMENTS = [
  "Listen up, braddah! You aren't in Arizona anymore. The ocean is pumping and the green room is waiting!",
  "Don't let the haoles get you down. You've got the soul of a champion. Now go show that swell who's boss!",
  "The Kam Highway is clear and the trades are light. Perfection, total perfection! Go shred it to pieces!",
  "Remember, it's not just about the waves, it's about the feeling in your soul. Stay loose and stay stoked!",
  "Cowabunga! You're about to have the session of a lifetime. Keep your eyes on the horizon!",
  "The lineup is calling your name. Paddle hard, drop in deep, and don't look back!",
  "You're tracking for a legendary session. The swell is consistent and the vibe is pure North Shore!",
  "Stay out of the impact zone and find your flow. You were born for this, braddah!"
];

function App() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'onboarding' | 'scout' | 'shredding' | 'itinerary'>('onboarding');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [rickWisdom, setRickWisdom] = useState('');
  
  // Profile State
  const [userName, setUserName] = useState(localStorage.getItem('surferName') || '');
  
  // Preference States
  const [selectedSpots, setSelectedSpots] = useState<any[]>([]);
  const [spotSearch, setSpotSearch] = useState('');
  const [sensitivity, setSensitivity] = useState(5);
  const [availability, setAvailability] = useState<string[]>(['Morning', 'Weekend']);

  // UI States
  const [showNotification, setShowNotification] = useState<{ title: string, body: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  // Queries
  const prefQuery = useQuery({
    queryKey: ['preferences', userName],
    queryFn: () => fetchPreferencesByName(userName),
    enabled: !!userName,
  });

  const scoutQuery = useQuery({
    queryKey: ['scout', userName],
    queryFn: () => fetchScoutData(userName),
    enabled: (view === 'scout' || view === 'shredding') && !!userName,
  });

  const itineraryQuery = useQuery({
    queryKey: ['itinerary', selectedSpot?.name],
    queryFn: () => fetchItineraryData(selectedSpot),
    enabled: !!selectedSpot && view === 'itinerary',
  });

  const searchResultsQuery = useQuery({
    queryKey: ['search', spotSearch],
    queryFn: () => searchLocations(spotSearch),
    enabled: spotSearch.length > 2,
  });

  // Sync state with fetched preferences
  useEffect(() => {
    if (prefQuery.data && !prefQuery.data.status) {
      const spots = prefQuery.data.spots || [];
      const normalizedSpots = spots.map((s: any) => 
        typeof s === 'string' ? { name: s, lat: 21.6640, lon: -158.0531 } : s
      );
      
      setSelectedSpots(normalizedSpots);
      setSensitivity(prefQuery.data.friction_sensitivity || 5);
      setAvailability(prefQuery.data.availability || []);
      
      if (view === 'onboarding' && onboardingStep === 0 && normalizedSpots.length > 0) {
        setView('scout');
      }
    }
  }, [prefQuery.data]);

  const prefMutation = useMutation({
    mutationFn: savePreferences,
    onSuccess: () => {
      localStorage.setItem('surferName', userName);
      triggerNotification("Profile Sync Complete!", `Rick Kane is ready for you, ${userName}.`);
      queryClient.invalidateQueries({ queryKey: ['scout'] });
      setView('scout');
    },
  });

  const chatMutation = useMutation({
    mutationFn: sendMessageToRick,
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: data.text }] }]);
    }
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const triggerNotification = (title: string, body: string) => {
    setShowNotification({ title, body });
    setTimeout(() => setShowNotification(null), 5000);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', parts: [{ text: chatInput }] };
    setChatHistory(prev => [...prev, userMsg]);
    chatMutation.mutate({ message: chatInput, history: chatHistory });
    setChatInput('');
  };

  const addSpot = (spot: any) => {
    if (selectedSpots.length >= 10) {
      triggerNotification("Lineup Full", "10 spots is the limit, braddah!");
      return;
    }
    if (selectedSpots.find(s => s.name === spot.name)) return;
    setSelectedSpots([...selectedSpots, spot]);
    setSpotSearch('');
  };

  const removeSpot = (name: string) => {
    setSelectedSpots(selectedSpots.filter(s => s.name !== name));
  };

  const handleGoShred = (spot: any) => {
    setSelectedSpot(spot);
    const randomWisdom = RICK_ENCOURAGEMENTS[Math.floor(Math.random() * RICK_ENCOURAGEMENTS.length)];
    setRickWisdom(randomWisdom);
    setView('shredding');
  };

  const nextStep = () => {
    if (onboardingStep < 4) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      prefMutation.mutate({
        userName,
        preferences: {
          spots: selectedSpots,
          availability,
          friction_sensitivity: sensitivity
        }
      });
    }
  };

  const getCleanName = (name: any) => {
    if (!name) return "Unknown Spot";
    return name.toString().split(',')[0];
  };

  if (view === 'onboarding') {
    const steps = [
      {
        title: "Welcome, Braddah!",
        desc: "First things first, what do you go by in the lineup?",
        content: (
          <div className="mt-8 relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sun-yellow opacity-50" />
            <input 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full bg-white/10 rounded-2xl py-4 pl-12 pr-4 border border-white/20 outline-none focus:border-sun-yellow/50 transition-all font-black text-deep-teal"
            />
          </div>
        ),
        icon: <User className="w-12 h-12 text-deep-teal" />
      },
      { 
        title: "Pick Your Lineup", 
        desc: "Enter up to 10 spots you want to surf.",
        content: (
          <div className="mt-6 space-y-4 text-left text-deep-teal">
            <div className="relative">
              <div className="bg-white/10 rounded-xl flex items-center px-4 py-3 border border-white/20 focus-within:border-sun-yellow/50 transition-colors">
                <Search className="w-5 h-5 opacity-50 mr-3" />
                <input 
                  value={spotSearch}
                  onChange={(e) => setSpotSearch(e.target.value)}
                  placeholder="Search for a beach..."
                  className="bg-transparent outline-none flex-1 text-sm font-bold placeholder-deep-teal/40 text-deep-teal"
                />
              </div>
              <AnimatePresence>
                {spotSearch.length > 2 && searchResultsQuery.data && (
                  <motion.div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden z-50 shadow-2xl border border-white">
                    {searchResultsQuery.data.slice(0, 5).map((res: any) => (
                      <button key={res.name} onClick={() => addSpot(res)} className="w-full text-left px-5 py-3 hover:bg-turquoise/20 flex justify-between items-center border-b border-turquoise/10 last:border-0 text-deep-teal">
                        <div>
                          <p className="text-sm font-black leading-tight">{getCleanName(res.name)}</p>
                          <p className="text-[10px] opacity-60 font-bold">{res.city}, {res.country}</p>
                        </div>
                        <Plus className="w-4 h-4 text-turquoise" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
              {selectedSpots.map(spot => (
                <div key={spot.name} className="bg-white/10 p-3 rounded-xl flex justify-between items-center border border-white/10">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-sun-yellow" />
                    <p className="text-xs font-black truncate max-w-[180px]">{getCleanName(spot.name)}</p>
                  </div>
                  <button onClick={() => removeSpot(spot.name)}><X className="w-4 h-4 opacity-50 hover:text-red-500" /></button>
                </div>
              ))}
            </div>
          </div>
        ),
        icon: <MapPin className="w-12 h-12 text-deep-teal" />
      },
      { 
        title: "The Golden Window", 
        desc: "When are you free to shred?",
        content: (
          <div className="flex gap-4 justify-center mt-6">
            {['Morning', 'Afternoon', 'Weekend'].map(time => (
              <button 
                key={time}
                onClick={() => setAvailability(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time])}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${availability.includes(time) ? 'bg-sun-yellow text-deep-teal border-sun-yellow shadow-lg' : 'bg-white/10 border-white/20 text-deep-teal'}`}
              >
                <Clock className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase">{time}</span>
              </button>
            ))}
          </div>
        ),
        icon: <Clock className="w-12 h-12 text-deep-teal" />
      },
      { 
        title: "Friction Sensitivity", 
        desc: "How much traffic can you handle?",
        content: (
          <div className="mt-8 px-4 text-deep-teal">
            <input 
              type="range" min="1" max="10" value={sensitivity} 
              onChange={(e) => setSensitivity(parseInt(e.target.value))}
              className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer accent-sun-yellow"
            />
            <div className="flex justify-between mt-4 text-[10px] font-black uppercase opacity-60">
              <span>Sensitive</span>
              <span className="text-deep-teal text-xl leading-none">{sensitivity}</span>
              <span>Soul Surfer</span>
            </div>
          </div>
        ),
        icon: <AlertTriangle className="w-12 h-12 text-deep-teal" />
      },
      { 
        title: "Ready to Shred", 
        desc: "Profile locked in. Rick Kane is ready!",
        content: <div className="mt-6 text-xs italic font-bold opacity-60 text-deep-teal">"The North Shore is calling, {userName}!"</div>,
        icon: <Check className="w-12 h-12 text-deep-teal" />
      }
    ];

    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-deep-teal">
        <motion.div 
          key={onboardingStep}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-card rounded-[2rem] p-10 text-center shadow-2xl"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 p-6 rounded-full shadow-inner">
              {steps[onboardingStep].icon}
            </div>
          </div>
          <h2 className="text-3xl font-beachy text-sun-yellow mb-4 drop-shadow-md">{steps[onboardingStep].title}</h2>
          <p className="text-lg opacity-90 leading-tight font-bold">
            {steps[onboardingStep].desc}
          </p>

          {steps[onboardingStep].content}

          <div className="flex justify-center gap-2 my-10">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`onboarding-dot ${i === onboardingStep ? 'bg-sun-yellow w-8' : 'bg-deep-teal/20'}`} />
            ))}
          </div>

          <div className="flex gap-3">
            {onboardingStep > 0 && (
              <button 
                onClick={() => setOnboardingStep(onboardingStep - 1)}
                className="bg-white/10 p-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <button 
              onClick={nextStep}
              disabled={prefMutation.isPending || (onboardingStep === 0 && !userName) || (onboardingStep === 1 && selectedSpots.length === 0)}
              className="flex-1 btn-primary py-4 rounded-2xl text-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {prefMutation.isPending ? "Syncing..." : (onboardingStep === 4 ? "Go Shred" : "Next")}
              {!prefMutation.isPending && <ArrowRight className="w-6 h-6" />}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (scoutQuery.isLoading || prefQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-blue">
        <motion.div 
          animate={{ y: [0, -20, 0] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-2xl font-beachy text-deep-teal"
        >
          Paddling out, {userName}...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12 relative text-deep-teal">
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card rounded-2xl p-4 z-[100] border-2 border-sun-yellow/50 shadow-2xl flex items-start gap-4"
          >
            <div className="bg-sun-yellow p-2 rounded-lg">
              <Bell className="w-5 h-5 text-[#042f2e]" />
            </div>
            <div>
              <p className="font-black text-sun-yellow text-sm leading-none mb-1">{showNotification.title}</p>
              <p className="text-[11px] font-bold opacity-90 leading-tight">{showNotification.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'scout' ? (
          <motion.div 
            key="scout-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-md w-full"
          >
            <div className="glass-card rounded-[2rem] p-8">
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="bg-sun-yellow p-4 rounded-full shadow-lg relative">
                  <Waves className="w-12 h-12 text-[#042f2e]" />
                  <button 
                    onClick={() => { setOnboardingStep(0); setView('onboarding'); }}
                    className="absolute -top-2 -right-2 bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors border border-white/20"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                <h1 className="text-4xl font-beachy text-sun-yellow drop-shadow-md text-center">SurfersDelight</h1>
                <p className="text-xl text-center font-bold opacity-90">{userName}'s Surf Scout</p>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Scout Engine</p>
                  <button 
                    onClick={() => setShowDebug(!showDebug)}
                    className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-md transition-colors ${showDebug ? 'bg-sun-yellow text-[#042f2e]' : 'bg-white/10 opacity-60'}`}
                  >
                    <Info className="w-3 h-3" />
                    Debug Intel
                  </button>
                </div>

                {!scoutQuery.data?.topSpots?.length && (
                  <div className="bg-white/10 p-8 rounded-2xl border border-white/20 text-center italic opacity-60">
                    Rick Kane is searching the horizon. Click the button below to start scouting!
                  </div>
                )}

                {scoutQuery.data?.topSpots[0] && (
                  <div 
                    onClick={() => handleGoShred(scoutQuery.data.topSpots[0])}
                    className="flex flex-col gap-4 bg-white/10 p-5 rounded-2xl border border-white/20 relative overflow-hidden group cursor-pointer hover:bg-white/20 transition-all shadow-sm"
                  >
                    <div className="absolute top-0 right-0 bg-sun-yellow text-[#042f2e] px-3 py-1 rounded-bl-xl font-black text-[10px] tracking-widest">
                      TOP CALL
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-xl">
                        <MapPin className="w-8 h-8 text-deep-teal" />
                      </div>
                      <div>
                        <p className="text-[10px] opacity-70 uppercase tracking-widest font-black mb-1">Utility Score: {scoutQuery.data.topSpots[0].utilityScore}</p>
                        <p className="text-2xl font-black italic tracking-tight">{getCleanName(scoutQuery.data.topSpots[0].name)}</p>
                      </div>
                    </div>

                    {showDebug && (
                      <div className="mt-2 grid grid-cols-3 gap-2 p-3 bg-[#042f2e]/10 rounded-xl text-[9px] font-black uppercase">
                        <div className="text-center">
                          <p className="opacity-50">Quality</p>
                          <p className="text-deep-teal">{scoutQuery.data.topSpots[0].qualityScore}/10</p>
                        </div>
                        <div className="text-center border-x border-white/20">
                          <p className="opacity-50">Traffic</p>
                          <p className={`${scoutQuery.data.topSpots[0].friction.traffic > 0.5 ? 'text-red-500' : 'text-green-600'}`}>
                            {(scoutQuery.data.topSpots[0].friction.traffic * 100).toFixed(0)}% Delay
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="opacity-50">Crowds</p>
                          <p className="text-deep-teal">{(scoutQuery.data.topSpots[0].friction.crowd * 100).toFixed(0)}% Busy</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {scoutQuery.data?.topSpots[0] && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/20 shadow-inner">
                      <div className="flex items-center gap-2 mb-1">
                        <Wind className="w-4 h-4 text-sun-yellow" />
                        <span className="text-[10px] uppercase font-black opacity-70 tracking-widest">Wind</span>
                      </div>
                      <p className="text-lg font-black">{scoutQuery.data.topSpots[0].isOffshore ? 'Offshore' : 'Onshore'}</p>
                      <p className="text-xs opacity-60 font-bold">{scoutQuery.data.topSpots[0].windSpeed} mph</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/20 shadow-inner">
                      <div className="flex items-center gap-2 mb-1">
                        <Waves className="w-4 h-4 text-sun-yellow" />
                        <span className="text-[10px] uppercase font-black opacity-70 tracking-widest">Swell</span>
                      </div>
                      <p className="text-lg font-black">{scoutQuery.data.topSpots[0].waveHeight}ft @ {scoutQuery.data.topSpots[0].period}s</p>
                    </div>
                  </div>
                )}

                {scoutQuery.data?.topSpots[0] && (
                  <div className="bg-white/10 p-5 rounded-2xl border border-white/20 italic text-sm leading-relaxed font-bold">
                    <p className="opacity-90">"{scoutQuery.data.topSpots[0].rickKaneInsight}"</p>
                    <p className="mt-2 text-right font-beachy text-sun-yellow not-italic">— Rick Kane</p>
                  </div>
                )}

                <button 
                  onClick={() => scoutQuery.refetch()}
                  className="w-full btn-primary py-4 rounded-2xl text-lg flex items-center justify-center gap-2"
                >
                  <Waves className="w-6 h-6" />
                  Go Shred
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {scoutQuery.data?.topSpots?.slice(1).map((spot: any) => (
                <div 
                  key={spot.name} 
                  onClick={() => handleGoShred(spot)}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex flex-col gap-3 text-white cursor-pointer hover:bg-white/20 transition-all shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <MapPin className="w-4 h-4 text-sun-yellow" />
                      </div>
                      <p className="font-bold tracking-tight text-deep-teal">{getCleanName(spot.name)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-sun-yellow uppercase tracking-widest">U-SCORE: {spot.utilityScore}</p>
                      <p className="text-[10px] opacity-70 font-bold text-deep-teal">{spot.waveHeight}ft @ {spot.period}s</p>
                    </div>
                  </div>
                  
                  {showDebug && (
                    <div className="grid grid-cols-3 gap-2 px-3 py-2 bg-deep-teal/5 rounded-lg text-[8px] font-black uppercase text-deep-teal">
                      <div className="text-center"><p className="opacity-40">Quality</p><p>{spot.qualityScore}</p></div>
                      <div className="text-center border-x border-white/20"><p className="opacity-40">Traffic</p><p>{(spot.friction.traffic * 100).toFixed(0)}%</p></div>
                      <div className="text-center"><p className="opacity-40">Crowds</p><p>{(spot.friction.crowd * 100).toFixed(0)}%</p></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ) : view === 'shredding' ? (
          <motion.div 
            key="shredding-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full glass-card rounded-[2.5rem] p-10 text-center"
          >
            <div className="flex justify-center mb-8">
              <motion.div 
                animate={{ x: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="bg-sun-yellow p-6 rounded-full shadow-lg"
              >
                <Navigation className="w-12 h-12 text-[#042f2e]" />
              </motion.div>
            </div>
            
            <h2 className="text-3xl font-beachy text-sun-yellow mb-2 drop-shadow-md">En Route!</h2>
            <p className="text-xl font-black mb-10 opacity-90">Heading to {getCleanName(selectedSpot?.name)}</p>

            <div className="bg-white/10 p-8 rounded-3xl border border-white/20 italic mb-10 relative">
              <div className="absolute -top-3 left-6 bg-sun-yellow text-[#042f2e] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Rick's Wisdom
              </div>
              <p className="text-lg leading-relaxed font-bold">"{rickWisdom}"</p>
              <p className="mt-4 text-right font-beachy text-sun-yellow not-italic">— Rick Kane</p>
            </div>

            <button 
              onClick={() => setView('itinerary')}
              className="w-full bg-[#042f2e] text-white py-5 rounded-2xl font-black text-xl shadow-xl flex items-center justify-center gap-3 transform active:scale-95 transition-all"
            >
              <Check className="w-6 h-6 text-sun-yellow" />
              I'm at the Lineup
            </button>
            
            <p className="mt-6 text-[10px] font-black uppercase tracking-widest opacity-40">Monitoring local conditions...</p>
          </motion.div>
        ) : (
          <motion.div 
            key="itinerary-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md w-full glass-card rounded-[2rem] p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={() => setView('scout')}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-70 hover:opacity-100 transition-opacity"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Scout
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 mb-8 text-center">
              <div className="bg-sun-yellow p-4 rounded-full shadow-lg mb-2">
                <Coffee className="w-12 h-12 text-[#042f2e]" />
              </div>
              <h1 className="text-3xl font-beachy text-sun-yellow drop-shadow-md">Victory Lap!</h1>
              <p className="text-lg font-bold opacity-90 leading-tight">You conquered {getCleanName(selectedSpot?.name)}—now treat yourself.</p>
            </div>

            <div className="space-y-4">
              {itineraryQuery.isLoading ? (
                <p className="text-center opacity-70 italic font-bold">Scoping out the local scene...</p>
              ) : (
                itineraryQuery.data?.recommendations.map((rec: any, idx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={rec.name} 
                    className="bg-white/10 p-5 rounded-2xl border border-white/20 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                          {rec.type === 'Refuel' ? <Coffee className="w-5 h-5 text-deep-teal" /> : <ShoppingBag className="w-5 h-5 text-deep-teal" />}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-black opacity-50 tracking-widest mb-0.5">{rec.type}</p>
                          <p className="text-lg font-black leading-none tracking-tight">{rec.name}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-md">{rec.distance}</span>
                    </div>
                    <p className="text-sm opacity-80 leading-relaxed italic font-bold text-deep-teal">"{rec.insight}"</p>
                  </motion.div>
                ))
              )}
            </div>

            <div className="mt-8 bg-white/10 p-5 rounded-2xl border border-white/20 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-1 opacity-70">Ready for Tomorrow?</p>
              <p className="text-xs font-black opacity-90">Rick is already tracking the next swell.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat UI */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.8 }}
              className="absolute bottom-20 right-0 w-80 glass-card rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/30"
            >
              <div className="bg-sun-yellow p-5 text-[#042f2e] flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Waves className="w-5 h-5" />
                  </div>
                  <span className="font-beachy text-xl">Rick Kane</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-deep-teal"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-white/10 shadow-inner">
                {chatHistory.length === 0 && (
                  <p className="text-xs italic opacity-70 text-center mt-10 font-bold text-deep-teal">"Ask me anything about the North Shore, braddah!"</p>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] font-black leading-relaxed shadow-sm ${
                      msg.role === 'user' ? 'bg-sun-yellow text-[#042f2e]' : 'bg-white/25 border border-white/10 text-deep-teal'
                    }`}>
                      {msg.parts[0].text}
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-white/20 p-3 rounded-2xl text-[11px] font-black animate-pulse text-deep-teal">Rick is thinking...</div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white/10 border-t border-white/10 flex gap-2">
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Message Rick..."
                  className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-xs font-black outline-none border border-white/20 focus:border-sun-yellow/50 placeholder-deep-teal/50 text-deep-teal"
                />
                <button 
                  onClick={handleSendChat}
                  disabled={chatMutation.isPending}
                  className="p-2 bg-sun-yellow text-[#042f2e] rounded-xl disabled:opacity-50 shadow-md font-black"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-sun-yellow text-[#042f2e] p-5 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 border-4 border-white/30"
        >
          {isChatOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
        </button>
      </div>
    </div>
  );
}

export default App;
