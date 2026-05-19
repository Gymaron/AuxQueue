import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../services/api';

export function CreateSongPage() {
  const navigate = useNavigate();
  const { code } = useParams();
  
  const userName = localStorage.getItem('userName') || '';

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    duration: '',
    genre: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.artist.trim()) newErrors.artist = 'Artist is required';
    if (!formData.album.trim()) newErrors.album = 'Album is required';
    if (!formData.genre.trim()) newErrors.genre = 'Genre is required';
    if (!/^[0-5]?[0-9]:[0-5][0-9]$/.test(formData.duration)) {
      newErrors.duration = 'Duration must be in MM:SS format (e.g., 3:45)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (validateForm()) {
      try {
        await api.addSong({ ...formData, addedBy: userName, partyCode: code });
        navigate(-1);
      } catch (err: any) {
        setServerError(JSON.parse(err.message).error || 'Failed to add song');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="bg-[#181818] border-b border-[#282828]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[#b3b3b3] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Add New Song</h1>
          <p className="text-[#b3b3b3]">Fill in the details to add a new song to the queue</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-[#181818] rounded-lg p-8 space-y-6">
          {serverError && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm">
              {serverError}
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold mb-2">Song Title *</label>
              <input
                id="title" name="title" type="text"
                value={formData.title} onChange={handleChange}
                className={`w-full bg-[#282828] border ${errors.title ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]`}
              />
            </div>
            <div>
              <label htmlFor="artist" className="block text-sm font-semibold mb-2">Artist *</label>
              <input
                id="artist" name="artist" type="text"
                value={formData.artist} onChange={handleChange}
                className={`w-full bg-[#282828] border ${errors.artist ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]`}
              />
            </div>
            <div>
              <label htmlFor="album" className="block text-sm font-semibold mb-2">Album *</label>
              <input
                id="album" name="album" type="text"
                value={formData.album} onChange={handleChange}
                className={`w-full bg-[#282828] border ${errors.album ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]`}
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-semibold mb-2">Duration *</label>
              <input
                id="duration" name="duration" type="text"
                value={formData.duration} onChange={handleChange} placeholder="e.g., 3:45"
                className={`w-full bg-[#282828] border ${errors.duration ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]`}
              />
            </div>
            <div>
              <label htmlFor="genre" className="block text-sm font-semibold mb-2">Genre *</label>
              <input
                id="genre" name="genre" type="text"
                value={formData.genre} onChange={handleChange}
                className={`w-full bg-[#282828] border ${errors.genre ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]`}
              />
            </div>
            <div>
              <label htmlFor="addedBy" className="block text-sm font-semibold mb-2">Added By (Auto-filled)</label>
              <input
                id="addedBy" type="text" value={userName} readOnly
                className="w-full bg-[#282828] border border-[#535353] rounded-md py-3 px-4 text-[#b3b3b3] cursor-not-allowed"
              />
            </div>
          </div>
          <div className="pt-6 border-t border-[#282828] flex gap-4">
            <button type="submit" className="flex-1 px-6 py-3 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] transition-all flex justify-center gap-2">
              <Save className="w-5 h-5" /> Add Song
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}