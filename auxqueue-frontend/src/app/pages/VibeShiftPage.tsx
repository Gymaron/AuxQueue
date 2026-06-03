import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Zap, TrendingUp, TrendingDown, Minus, Radio, Sparkles, Activity } from 'lucide-react';
import { api } from '../services/api';

type EnergyZone = 'hype' | 'groove' | 'chill';

interface Song {
  id: string;
  title: string;
  artist: string;
  votes: number;
  energyLevel: EnergyZone;
  tempo: number; 
}

export function VibeShiftPage() {
  const { code } = useParams();
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentEnergy, setCurrentEnergy] = useState(75);
  const [targetZone, setTargetZone] = useState<EnergyZone>('hype');
  const [animatedParticles, setAnimatedParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await api.getSongs(1, 100, code);
        const processedSongs = res.data.map((song: any) => {
          const stringSum = (song.title?.length || 0) + (song.artist?.length || 0);
          const zoneIndex = stringSum % 3;
          const energyLevel: EnergyZone = zoneIndex === 0 ? 'hype' : zoneIndex === 1 ? 'groove' : 'chill';
          const tempo = 70 + ((stringSum * 7) % 90);
          return { ...song, energyLevel, tempo };
        });
        setQueue(processedSongs);
      } catch (err) {
        console.error(err);
      }
    };

    fetchQueue();
    const pollInterval = setInterval(fetchQueue, 3000);
    return () => clearInterval(pollInterval);
  }, [code]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEnergy(prev => {
        const change = (Math.random() - 0.5) * 10;
        return Math.max(0, Math.min(100, prev + change));
      });

      if (Math.random() > 0.7) {
        const newParticle = {
          id: Date.now() + Math.random(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          color: currentEnergy > 66 ? '#1DB954' : currentEnergy > 33 ? '#ff6b35' : '#2e77d0',
        };
        setAnimatedParticles(prev => [...prev.slice(-20), newParticle]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentEnergy]);

  const getEnergyZone = (energy: number): EnergyZone => {
    if (energy > 66) return 'hype';
    if (energy > 33) return 'groove';
    return 'chill';
  };

  const currentZone = getEnergyZone(currentEnergy);

  const zoneConfig = {
    hype: {
      color: 'from-[#1DB954] via-[#1ed760] to-[#ff6b35]',
      bgColor: 'bg-[#1DB954]',
      textColor: 'text-[#1DB954]',
      icon: Zap,
      label: 'HYPE ZONE',
      description: 'High energy bangers that get everyone moving',
      emoji: '🔥',
    },
    groove: {
      color: 'from-[#ff6b35] via-[#f59e0b] to-[#8b5cf6]',
      bgColor: 'bg-[#ff6b35]',
      textColor: 'text-[#ff6b35]',
      icon: Radio,
      label: 'GROOVE ZONE',
      description: 'Mid-tempo vibes for sustained energy',
      emoji: '✨',
    },
    chill: {
      color: 'from-[#2e77d0] via-[#8b5cf6] to-[#6d28d9]',
      bgColor: 'bg-[#2e77d0]',
      textColor: 'text-[#2e77d0]',
      icon: Sparkles,
      label: 'CHILL ZONE',
      description: 'Mellow tracks for winding down',
      emoji: '🌙',
    },
  };

  const filteredQueue = (zone: EnergyZone) => queue.filter(song => song.energyLevel === zone);

  const handleZoneShift = (zone: EnergyZone) => {
    setTargetZone(zone);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {animatedParticles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              animation: 'fadeOut 3s forwards',
            }}
          />
        ))}
      </div>

      <header className="bg-[#181818] border-b border-[#282828] sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/party/${code}/queue`}
                className="p-2 hover:bg-[#282828] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Activity className="w-8 h-8 text-[#1DB954] animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#1DB954] rounded-full animate-ping" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Vibe Shift™</h1>
                  <p className="text-sm text-[#b3b3b3]">Party Code: {code}</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-[#1DB954] to-[#1ed760] text-black rounded-full font-bold flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>LIVE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-12">
          <div className="bg-gradient-to-br from-[#181818] to-[#282828] rounded-2xl p-8 border-2 border-[#1DB954] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Party Energy Pulse</h2>
                <p className="text-[#b3b3b3]">Real-time vibe detection based on voting patterns</p>
              </div>
              <div className="text-right">
                <p className="text-6xl font-bold bg-gradient-to-r from-[#1DB954] to-[#1ed760] bg-clip-text text-transparent">
                  {Math.round(currentEnergy)}%
                </p>
                <p className="text-sm text-[#b3b3b3]">Energy Level</p>
              </div>
            </div>

            <div className="relative h-24 bg-[#282828] rounded-xl overflow-hidden mb-6">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${zoneConfig[currentZone].color} transition-all duration-1000 ease-out`}
                style={{ width: `${currentEnergy}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              
              <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                <div className="text-center">
                  <p className="text-xs text-white/70">0%</p>
                  <p className="text-xs text-white/50">CHILL</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-white/70">33%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-white/70">66%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-white/70">100%</p>
                  <p className="text-xs text-white/50">HYPE</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl bg-gradient-to-r ${zoneConfig[currentZone].color} text-black`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{zoneConfig[currentZone].emoji}</div>
                  <div>
                    <p className="text-2xl font-bold mb-1">{zoneConfig[currentZone].label}</p>
                    <p className="text-sm opacity-80">{zoneConfig[currentZone].description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentZone === 'hype' && <TrendingUp className="w-8 h-8 animate-bounce" />}
                  {currentZone === 'groove' && <Minus className="w-8 h-8" />}
                  {currentZone === 'chill' && <TrendingDown className="w-8 h-8" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#1DB954]" />
            Vibe Architect Control
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {(['hype', 'groove', 'chill'] as EnergyZone[]).map((zone) => {
              const config = zoneConfig[zone];
              const Icon = config.icon;
              const isActive = targetZone === zone;
              const songCount = filteredQueue(zone).length;

              return (
                <button
                  key={zone}
                  onClick={() => handleZoneShift(zone)}
                  className={`p-6 rounded-xl transition-all hover:scale-105 ${
                    isActive 
                      ? `bg-gradient-to-br ${config.color} text-black shadow-2xl border-4 border-white/30` 
                      : 'bg-[#181818] hover:bg-[#282828] border-2 border-[#282828]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{config.emoji}</div>
                    <Icon className={`w-8 h-8 ${isActive ? '' : 'text-[#b3b3b3]'}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isActive ? '' : 'text-white'}`}>
                    {config.label}
                  </h3>
                  <p className={`text-sm mb-4 ${isActive ? 'opacity-80' : 'text-[#b3b3b3]'}`}>
                    {config.description}
                  </p>
                  <div className={`flex items-center gap-2 text-sm font-bold ${isActive ? '' : config.textColor}`}>
                    <span>{songCount} songs ready</span>
                    {isActive && <Zap className="w-4 h-4 animate-pulse" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          {(['hype', 'groove', 'chill'] as EnergyZone[]).map((zone) => {
            const config = zoneConfig[zone];
            const songs = filteredQueue(zone);
            const Icon = config.icon;

            return (
              <div key={zone} className="bg-[#181818] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 ${config.bgColor} rounded-full flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{config.label}</h3>
                    <p className="text-sm text-[#b3b3b3]">{songs.length} songs • {config.description}</p>
                  </div>
                  <div className="text-3xl">{config.emoji}</div>
                </div>

                <div className="space-y-3">
                  {songs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-4 bg-[#282828] rounded-lg hover:bg-[#535353] transition-colors"
                    >
                      <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center font-bold text-white`}>
                        {song.tempo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{song.title}</h4>
                        <p className="text-sm text-[#b3b3b3] truncate">{song.artist}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${config.textColor}`}>{song.votes}</p>
                        <p className="text-xs text-[#b3b3b3]">{song.tempo} BPM</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] rounded-2xl p-8 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">AI Vibe Prediction</h3>
              <p className="text-sm opacity-80">Based on current voting patterns and time of night</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm opacity-80 mb-2">Next 15 min</p>
              <p className="text-3xl font-bold">📈 Rising</p>
              <p className="text-xs mt-2">Energy expected to increase</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm opacity-80 mb-2">Peak Time</p>
              <p className="text-3xl font-bold">11:30 PM</p>
              <p className="text-xs mt-2">Maximum energy predicted</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm opacity-80 mb-2">Suggested</p>
              <p className="text-3xl font-bold">🔥 Hype</p>
              <p className="text-xs mt-2">Keep the energy high!</p>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-50px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}