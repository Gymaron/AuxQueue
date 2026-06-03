import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, BarChart3, Play, Square, Loader2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../services/api';

interface Song { 
  id: string; 
  title: string; 
  artist: string; 
  votes: number; 
  addedBy: string; 
  partyCode: string; 
}

const COLORS = ['#1DB954', '#1ed760', '#179443', '#2e77d0', '#ff6b35', '#e22134', '#8b5cf6', '#f59e0b'];

export function StatisticsPage() {
  const { code } = useParams();
  const [queueData, setQueueData] = useState<Song[]>([]);
  const [isLive, setIsLive] = useState(false);
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');

  useEffect(() => {
    api.getSongs(1, 100, code).then(res => setQueueData(res.data)).catch(console.error);

    const fetchHeavyAnalytics = async () => {
      try {
        const startTime = performance.now();
        const data = await api.getHeavyPartyAnalytics(code || '');
        const endTime = performance.now();
        setAnalytics({ ...data, fetchTime: (endTime - startTime).toFixed(2) });
      } catch (err: any) {
        setAnalyticsError('Failed to fetch heavy analytics. Matrix computation overloaded.');
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchHeavyAnalytics();

    const unsubscribe = api.subscribe((data) => {
      if (data.type === 'NEW_SONGS' && data.partyCode === code) {
        setQueueData(prev => [...data.songs, ...prev]);
      }
    });
    return unsubscribe;
  }, [code]);

  const toggleLive = async () => {
    if (isLive) {
      await api.stopGeneration(code!);
    } else {
      await api.startGeneration(code!);
    }
    setIsLive(!isLive);
  };

  const totalVotes = queueData.reduce((sum, song) => sum + song.votes, 0);
  const avgVotes = Math.round(totalVotes / queueData.length) || 0;
  
  const contributorStats = queueData.reduce((acc, song) => { 
    acc[song.addedBy] = (acc[song.addedBy] || 0) + 1; 
    return acc; 
  }, {} as Record<string, number>);
  
  const topContributors = Object.entries(contributorStats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
    
  const artistStats = queueData.reduce((acc, song) => { 
    acc[song.artist] = (acc[song.artist] || 0) + 1; 
    return acc; 
  }, {} as Record<string, number>);
  
  const artistData = Object.entries(artistStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
    
  const voteDistribution = [...queueData]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 8)
    .map(song => ({ name: song.title.substring(0, 15), votes: song.votes, artist: song.artist }));
    
  const rankedSongs = [...queueData].sort((a, b) => b.votes - a.votes);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="bg-[#181818] border-b border-[#282828] sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/party/${code}/queue`} className="p-2 hover:bg-[#282828] rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#1DB954]" />
              <div>
                <h1 className="text-xl font-bold">Party Statistics</h1>
                <p className="text-sm text-[#b3b3b3]">Code: {code}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={toggleLive} 
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${isLive ? 'bg-red-500 text-white' : 'bg-[#1DB954] text-black'}`}
          >
            {isLive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isLive ? 'Stop Live WebSocket Gen' : 'Start Live WebSocket Gen'}
          </button>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        
        {loadingAnalytics ? (
          <div className="bg-[#181818] rounded-xl p-8 shadow-lg border border-[#282828] mb-8 flex flex-col items-center justify-center text-[#b3b3b3]">
            <Loader2 className="w-10 h-10 animate-spin text-[#1DB954] mb-4" />
            <p>Processing Heavy Matrix Computation (DDoS Defense Test)...</p>
          </div>
        ) : analyticsError ? (
          <div className="bg-red-500/10 text-red-500 p-6 rounded-xl border border-red-500/30 mb-8 text-center">
            {analyticsError}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#1DB954]/20 to-[#1DB954]/5 p-6 rounded-xl border border-[#1DB954]/30 md:col-span-2">
              <div className="flex items-center gap-2 text-[#1DB954] mb-2"><TrendingUp className="w-5 h-5"/> Gold Challenge: Heavy Analytics Matrix</div>
              <p className="text-5xl font-bold text-[#1DB954]">{analytics?.synergyScore.toFixed(2)} <span className="text-xl font-normal text-[#b3b3b3]">Synergy Score</span></p>
              <p className="text-sm text-[#b3b3b3] mt-3">Calculated against {analytics?.totalSongs.toLocaleString()} database records in <span className="text-white font-bold">{analytics?.fetchTime}ms</span> using TTL Cache & B-Tree Indexes.</p>
            </div>
            <div className="bg-[#181818] p-6 rounded-xl shadow-lg border border-[#282828] flex flex-col justify-center">
              <p className="text-[#b3b3b3] mb-1">Dominant Global Genre</p>
              <p className="text-2xl font-bold">{analytics?.dominantGenre}</p>
              <p className="text-[#b3b3b3] mb-1 mt-4">Top Global Contributor</p>
              <p className="text-2xl font-bold">{analytics?.topContributor}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-[#181818] rounded-xl p-6 shadow-lg border border-[#282828]">
            <p className="text-3xl font-bold text-[#1DB954]">{queueData.length}</p>
            <p className="text-sm opacity-90">Live Queue Items</p>
          </div>
          <div className="bg-[#181818] rounded-xl p-6 shadow-lg border border-[#282828]">
            <p className="text-3xl font-bold text-[#2e77d0]">{totalVotes}</p>
            <p className="text-sm opacity-90">Total Live Votes</p>
          </div>
          <div className="bg-[#181818] rounded-xl p-6 shadow-lg border border-[#282828]">
            <p className="text-3xl font-bold text-[#ff6b35]">{avgVotes}</p>
            <p className="text-sm opacity-90">Avg Votes</p>
          </div>
          <div className="bg-[#181818] rounded-xl p-6 shadow-lg border border-[#282828]">
            <p className="text-3xl font-bold text-[#8b5cf6]">{topContributors.length}</p>
            <p className="text-sm opacity-90">Contributors</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-[#181818] rounded-xl p-6 shadow-lg border border-[#282828]">
              <h2 className="text-2xl font-bold mb-6">Top Songs by Votes</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={voteDistribution}>
                  <XAxis dataKey="name" stroke="#b3b3b3" fontSize={12}/>
                  <YAxis stroke="#b3b3b3" fontSize={12} />
                  <Tooltip cursor={{ fill: '#1DB954', opacity: 0.1 }}/>
                  <Bar dataKey="votes" fill="#1DB954" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-[#181818] rounded-xl p-6 shadow-lg border border-[#282828]">
              <h2 className="text-2xl font-bold mb-6">Artist Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={artistData} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey="value">
                    {artistData.map((e, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[#181818] rounded-xl p-6 shadow-lg border border-[#282828] h-fit">
            <h2 className="text-2xl font-bold mb-6">Live Leaderboard</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#282828] text-[#b3b3b3]">
                  <th className="pb-3">Song</th>
                  <th className="pb-3 text-right">Votes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282828]">
                {rankedSongs.slice(0, 15).map(song => (
                  <tr key={song.id}>
                    <td className="py-3 font-semibold">
                      {song.title} <span className="text-xs text-[#b3b3b3] block">{song.artist}</span>
                    </td>
                    <td className="py-3 text-right font-bold text-[#1DB954]">{song.votes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}