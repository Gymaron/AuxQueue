import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { Music, ChevronUp, ChevronDown, SkipForward, Plus, Copy, Check, Users, ArrowLeft, X, Edit, Trash2, Save, BarChart3, Send } from 'lucide-react';
import { api } from '../services/api';

export function PartyQueuePage() {
  const { code } = useParams();
  const userName = localStorage.getItem('userName') || 'Anonymous';
  const userRole = localStorage.getItem('userRole') || 'USER';

  const [nowPlaying, setNowPlaying] = useState<any | null>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSong, setNewSong] = useState({ title: '', artist: '' });
  const [editForm, setEditForm] = useState({ title: '', artist: '' });
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'localhost';
  const CHAT_API_URL = `http://${SERVER_IP}:3000/api/chat`;

  const fetchQueue = async () => {
    try {
      const res = await api.getSongs(1, 100, code);
      const sorted = res.data.sort((a: any, b: any) => b.votes - a.votes);
      if (sorted.length > 0 && !nowPlaying) {
        setNowPlaying(sorted[0]);
        setQueue(sorted.slice(1));
      } else {
        setQueue(sorted.filter((s: any) => s.id !== nowPlaying?.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000); 
    
    fetch(`${CHAT_API_URL}/${code}`)
      .then(res => res.json())
      .then(data => setChatMessages(data))
      .catch(console.error);

    const unsubscribe = api.subscribe((data) => {
      if (data.type === 'CHAT_MESSAGE' && data.chat.partyCode === code) {
        setChatMessages(prev => [...prev, data.chat]);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [code, nowPlaying]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;
    try {
      await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partyCode: code, user: userName, message: currentMessage })
      });
      setCurrentMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (id: string, delta: number) => { await api.voteSong(id, delta); fetchQueue(); };
  
  const handleSkip = async () => {
    if (nowPlaying) await api.deleteSong(nowPlaying.id); 
    if (queue.length > 0) { setNowPlaying(queue[0]); setQueue(queue.slice(1)); } else setNowPlaying(null);
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addSong({ title: newSong.title, artist: newSong.artist, addedBy: userName, partyCode: code });
    setNewSong({ title: '', artist: '' }); setShowAddForm(false); fetchQueue();
  };

  const handleDeleteSong = async (id: string) => { if (confirm('Remove this song?')) { await api.deleteSong(id); fetchQueue(); } };
  const handleStartEdit = (song: any) => { setEditingSongId(song.id); setEditForm({ title: song.title, artist: song.artist }); };
  const handleCancelEdit = () => { setEditingSongId(null); setEditForm({ title: '', artist: '' }); };
  const handleSaveEdit = async (id: string) => { await api.updateSong(id, { title: editForm.title, artist: editForm.artist }); setEditingSongId(null); fetchQueue(); };

  const allQueueSongs = nowPlaying ? [nowPlaying, ...queue] : queue;
  const uniqueContributors = new Set(allQueueSongs.map(song => song.addedBy)).size;

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="bg-[#181818] border-b border-[#282828] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/party/select" className="inline-flex items-center gap-2 text-[#b3b3b3] hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <div className="flex items-center gap-3">
              <Music className="w-8 h-8 text-[#1DB954]" />
              <div><h1 className="text-xl font-bold">Party Queue</h1><p className="text-sm text-[#b3b3b3]">Code: {code}</p></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { navigator.clipboard.writeText(code || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-4 py-2 bg-[#282828] rounded-full flex items-center gap-2 hover:bg-[#535353] transition-colors">
              {copied ? <Check className="w-4 h-4 text-[#1DB954]" /> : <Copy className="w-4 h-4" />} <span className="text-sm font-semibold">Share Code</span>
            </button>
            <Link to={`/party/${code}/statistics`} className="px-4 py-2 bg-[#282828] rounded-full flex items-center gap-2 hover:bg-[#535353] transition-colors"><BarChart3 className="w-4 h-4" /> <span className="text-sm font-semibold">Statistics</span></Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gradient-to-br from-[#1DB954] to-[#179443] rounded-xl p-8">
            {nowPlaying ? (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold uppercase mb-3">Now Playing</p>
                  <h2 className="text-4xl font-bold mb-2">{nowPlaying.title}</h2>
                  <p className="text-xl mb-2">{nowPlaying.artist}</p>
                  <p className="text-sm opacity-75">Added by {nowPlaying.addedBy}</p>
                </div>
                {userRole === 'ADMIN' && (
                  <button onClick={handleSkip} className="p-4 bg-black/20 rounded-full hover:bg-black/40 transition">
                    <SkipForward className="w-8 h-8" />
                  </button>
                )}
              </div>
            ) : (
               <div className="text-center"><p className="text-2xl font-bold">No song playing</p></div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Up Next ({queue.length})</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} className="px-6 py-3 bg-[#1DB954] text-black font-bold rounded-full flex gap-2"><Plus className="w-5 h-5" /> Add Song</button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddSong} className="bg-[#181818] p-6 rounded-xl border border-[#1DB954] grid md:grid-cols-2 gap-4 relative">
              <button type="button" onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-[#b3b3b3] hover:text-white"><X className="w-5 h-5" /></button>
              <input type="text" placeholder="Title" value={newSong.title} onChange={e => setNewSong({...newSong, title: e.target.value})} className="bg-[#282828] p-3 rounded text-white" required />
              <input type="text" placeholder="Artist" value={newSong.artist} onChange={e => setNewSong({...newSong, artist: e.target.value})} className="bg-[#282828] p-3 rounded text-white" required />
              <button type="submit" className="md:col-span-2 bg-[#1DB954] text-black font-bold py-3 rounded">Add to Queue</button>
            </form>
          )}

          <div className="bg-[#181818] rounded-xl p-6 space-y-3">
            {queue.map((song, i) => (
              <div key={song.id} className="flex items-center gap-4 p-4 bg-[#282828] rounded-lg">
                {editingSongId === song.id ? (
                  <>
                    <div className="text-2xl font-bold text-[#b3b3b3] w-8 text-center">{i + 1}</div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="bg-[#181818] p-2 rounded text-white" required />
                      <input type="text" value={editForm.artist} onChange={e => setEditForm({...editForm, artist: e.target.value})} className="bg-[#181818] p-2 rounded text-white" required />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleSaveEdit(song.id)} className="p-2 bg-[#1DB954] text-black rounded hover:bg-[#1ed760]"><Save className="w-4 h-4" /></button>
                      <button onClick={handleCancelEdit} className="p-2 bg-[#181818] rounded hover:bg-[#535353]"><X className="w-4 h-4" /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-[#b3b3b3] w-8 text-center">{i + 1}</span>
                    <div className="flex-1">
                      <h3 className="font-bold">{song.title}</h3>
                      <p className="text-sm text-[#b3b3b3]">{song.artist}</p>
                      <p className="text-xs text-[#b3b3b3] mt-1">Added by {song.addedBy}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#181818] px-3 py-2 rounded">
                      <button onClick={() => handleVote(song.id, 1)} className="hover:text-[#1DB954]"><ChevronUp className="w-5 h-5" /></button>
                      <span className="text-xl font-bold text-[#1DB954] min-w-[2rem] text-center">{song.votes}</span>
                      <button onClick={() => handleVote(song.id, -1)} className="hover:text-red-500"><ChevronDown className="w-5 h-5" /></button>
                    </div>
                    <div className="flex items-center gap-2 min-w-[5rem]">
                      {(userRole === 'ADMIN' || song.addedBy === userName) && (
                        <>
                          <button onClick={() => handleStartEdit(song)} className="p-2 hover:text-[#1DB954]"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteSong(song.id)} className="p-2 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#181818] rounded-xl flex flex-col h-[700px] border border-[#282828] sticky top-24">
          <div className="p-4 border-b border-[#282828] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1DB954]" />
            <h2 className="font-bold text-lg">Live Chat</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <p className="text-center text-[#b3b3b3] text-sm mt-4">No messages yet. Be the first to say hi!</p>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.user === userName ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-[#b3b3b3] mb-1">{msg.user}</span>
                  <div className={`px-4 py-2 rounded-2xl max-w-[85%] ${msg.user === userName ? 'bg-[#1DB954] text-black rounded-tr-none' : 'bg-[#282828] text-white rounded-tl-none'}`}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-4 border-t border-[#282828] bg-[#121212] rounded-b-xl flex gap-2">
            <input 
              type="text" 
              value={currentMessage} 
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 bg-[#282828] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
            />
            <button type="submit" className="p-2 bg-[#1DB954] text-black rounded-full hover:bg-[#1ed760] transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}