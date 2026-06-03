import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { Music, Plus, LogOut, TrendingUp, Trophy, Flame, Zap, ChevronUp, ChevronDown, Eye, Edit, Trash2, ArrowLeft, WifiOff } from 'lucide-react';
import { api } from '../services/api';

const ITEMS_PER_PAGE = 10;

export function DashboardPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSongs, setTotalSongs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [globalStats, setGlobalStats] = useState({ topSong: null as any, totalVotes: 0, avgVotes: 0, trending: [] as any[] });
  
  const userName = localStorage.getItem('userName') || '';

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleSync = () => { fetchSongs(1, true); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync-complete', handleSync);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-complete', handleSync);
    };
  }, []);

  const fetchSongs = async (page: number, reset = false) => {
    setIsLoading(true);
    try {
      const res = await api.getSongs(page, ITEMS_PER_PAGE, undefined, userName);
      setSongs(prev => reset ? res.data : [...prev, ...res.data]);
      setTotalPages(res.totalPages);
      setTotalSongs(res.total);
      
      const allRes = await api.getSongs(1, 1000, undefined, userName); 
      if (allRes.data.length > 0) {
        const top = [...allRes.data].sort((a, b) => b.votes - a.votes)[0];
        const votes = allRes.data.reduce((sum: number, s: any) => sum + s.votes, 0);
        setGlobalStats({ topSong: top, totalVotes: votes, avgVotes: Math.round(votes / allRes.data.length), trending: [] });
      }
    } catch (err) {}
    setIsLoading(false);
  };

  useEffect(() => { fetchSongs(currentPage, currentPage === 1); }, [currentPage]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLTableRowElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, currentPage, totalPages]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this song?')) {
      await api.deleteSong(id);
      fetchSongs(1, true);
    }
  };

  const handleVote = async (id: string, delta: number) => {
    await api.voteSong(id, delta);
    fetchSongs(1, true);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="bg-[#181818] border-b border-[#282828] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/party/select" className="p-2 hover:bg-[#282828] rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Music className="w-8 h-8 text-[#1DB954]" />
              <h1 className="text-2xl font-bold">AuxQueue Dashboard</h1>
              {isOffline && <span className="ml-4 px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold flex items-center gap-1"><WifiOff className="w-3 h-3"/> Offline Mode</span>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/songs/new" className="px-4 py-2 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] transition-all flex items-center gap-2"><Plus className="w-5 h-5" /> Add Song</Link>
            <Link to="/" className="px-4 py-2 border border-[#535353] rounded-full hover:bg-[#282828] transition-all flex items-center gap-2"><LogOut className="w-5 h-5" /> Logout</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-[#1DB954] via-[#1ed760] to-[#179443] rounded-2xl p-8 h-full">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6" />
                <p className="font-bold uppercase tracking-wide">Top Track Added By You</p>
              </div>
              {globalStats.topSong ? (
                <>
                  <h2 className="text-4xl font-bold mb-3">{globalStats.topSong.title}</h2>
                  <p className="text-2xl opacity-90 mb-2">{globalStats.topSong.artist}</p>
                  <div className="flex gap-6 mt-6">
                    <div className="bg-black/20 rounded-xl px-6 py-3">
                      <p className="text-3xl font-bold">{globalStats.topSong.votes}</p>
                      <p className="text-sm opacity-75">Votes</p>
                    </div>
                  </div>
                </>
              ) : <p>No songs available</p>}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#2e77d0] to-[#1e5bb8] rounded-xl p-6">
              <Music className="w-8 h-8 mb-3" />
              <p className="text-4xl font-bold">{totalSongs}</p>
              <p className="text-sm opacity-90">Total Songs</p>
            </div>
            <div className="bg-gradient-to-br from-[#ff6b35] to-[#d64d1f] rounded-xl p-6">
              <TrendingUp className="w-8 h-8 mb-3" />
              <p className="text-4xl font-bold">{globalStats.totalVotes}</p>
              <p className="text-sm opacity-90">Total Votes</p>
            </div>
          </div>
        </div>

        <div className="bg-[#181818] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#282828]"><h2 className="text-xl font-bold">My Songs</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#282828] text-[#b3b3b3]">
                <tr>
                  <th className="px-6 py-3">Votes</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Artist</th>
                  <th className="px-6 py-3">Added By</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282828]">
                {songs.map((song, index) => (
                  <tr key={song.id} ref={index === songs.length - 1 ? lastElementRef : null} className="hover:bg-[#282828]">
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => handleVote(song.id, 1)} className="hover:text-[#1DB954]"><ChevronUp className="w-4 h-4" /></button>
                      <span className="font-bold text-[#1DB954]">{song.votes}</span>
                      <button onClick={() => handleVote(song.id, -1)} className="hover:text-red-500"><ChevronDown className="w-4 h-4" /></button>
                    </td>
                    <td className="px-6 py-4 font-semibold">{song.title}</td>
                    <td className="px-6 py-4 text-[#b3b3b3]">{song.artist}</td>
                    <td className="px-6 py-4 text-[#b3b3b3]">{song.addedBy}</td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <Link to={`/songs/${song.id}/edit`} className="text-[#b3b3b3] hover:text-[#1DB954]"><Edit className="w-4 h-4" /></Link>
                      <button onClick={() => handleDelete(song.id)} className="text-[#b3b3b3] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isLoading && <div className="text-center py-4 text-[#b3b3b3]">Loading more songs...</div>}
          </div>
        </div>
      </main>
    </div>
  );
}