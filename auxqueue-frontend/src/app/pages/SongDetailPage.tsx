import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, Clock, Music, User, Tag, ThumbsUp, Edit, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export function SongDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSongById(id!)
      .then(data => {
        setSong(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this song?')) {
      await api.deleteSong(id!);
      navigate(-1);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Loading...</div>;

  if (!song) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Song Not Found</h1>
          <button onClick={() => navigate(-1)} className="text-[#1DB954] hover:text-[#1ed760]">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(song.addedAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="bg-[#181818] border-b border-[#282828]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-[#b3b3b3] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-[#1DB954] to-[#179443] rounded-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide mb-2 opacity-90">Song Details</p>
              <h1 className="text-5xl font-bold mb-4">{song.title}</h1>
              <p className="text-2xl opacity-90">{song.artist}</p>
            </div>
            <div className="flex items-center gap-3 bg-black/20 rounded-lg px-6 py-4">
              <ThumbsUp className="w-8 h-8" />
              <div>
                <p className="text-3xl font-bold">{song.votes}</p>
                <p className="text-sm opacity-90">Votes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#181818] rounded-lg p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4"><div className="p-3 bg-[#282828] rounded-lg"><Music className="w-6 h-6 text-[#1DB954]" /></div><div><p className="text-sm text-[#b3b3b3] mb-1">Album</p><p className="font-semibold">{song.album}</p></div></div>
            <div className="flex items-start gap-4"><div className="p-3 bg-[#282828] rounded-lg"><Clock className="w-6 h-6 text-[#1DB954]" /></div><div><p className="text-sm text-[#b3b3b3] mb-1">Duration</p><p className="font-semibold">{song.duration || 'N/A'}</p></div></div>
            <div className="flex items-start gap-4"><div className="p-3 bg-[#282828] rounded-lg"><User className="w-6 h-6 text-[#1DB954]" /></div><div><p className="text-sm text-[#b3b3b3] mb-1">Added By</p><p className="font-semibold">{song.addedBy}</p></div></div>
            <div className="flex items-start gap-4"><div className="p-3 bg-[#282828] rounded-lg"><Calendar className="w-6 h-6 text-[#1DB954]" /></div><div><p className="text-sm text-[#b3b3b3] mb-1">Added At</p><p className="font-semibold">{formattedDate}</p></div></div>
            <div className="flex items-start gap-4"><div className="p-3 bg-[#282828] rounded-lg"><Tag className="w-6 h-6 text-[#1DB954]" /></div><div><p className="text-sm text-[#b3b3b3] mb-1">Genre</p><p className="font-semibold">{song.genre}</p></div></div>
          </div>

          <div className="pt-6 border-t border-[#282828] flex gap-4">
            <Link to={`/songs/${song.id}/edit`} className="flex-1 px-6 py-3 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] hover:scale-105 transition-all flex items-center justify-center gap-2">
              <Edit className="w-5 h-5" /> Edit Song
            </Link>
            <button onClick={handleDelete} className="px-6 py-3 bg-transparent border-2 border-red-500 text-red-500 font-bold rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}