import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../services/api';

export function EditSongPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');

  const [formData, setFormData] = useState({
    title: '', artist: '', album: '', duration: '', genre: '', addedBy: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const data = await api.getSongById(id!);
        setFormData({
          title: data.title || '', 
          artist: data.artist || '', 
          album: data.album || '',
          duration: data.duration || '', 
          genre: data.genre || '', 
          addedBy: data.addedBy || ''
        });
      } catch (err) {
        setServerError('Song not found');
      } finally {
        setLoading(false);
      }
    };
    fetchSong();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.artist.trim()) newErrors.artist = 'Artist is required';
    if (!formData.album.trim()) newErrors.album = 'Album is required';
    if (!formData.genre.trim()) newErrors.genre = 'Genre is required';
    if (!formData.addedBy.trim()) newErrors.addedBy = 'Added By is required';
    if (formData.duration && !/^[0-5]?[0-9]:[0-5][0-9]$/.test(formData.duration)) {
      newErrors.duration = 'Duration must be in MM:SS format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await api.updateSong(id!, { title: formData.title, artist: formData.artist });
        navigate(-1); // Go back to the previous page
      } catch (err: any) {
        setServerError('Failed to update song');
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">Loading...</div>;

  if (serverError && !formData.title) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{serverError}</h1>
          <button onClick={() => navigate(-1)} className="text-[#1DB954] hover:text-[#1ed760]">← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="bg-[#181818] border-b border-[#282828]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-[#b3b3b3] hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Edit Song</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-[#181818] rounded-lg p-8 space-y-6">
          {serverError && <div className="bg-red-500/20 text-red-500 p-3 rounded-md text-sm">{serverError}</div>}
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold mb-2">Song Title *</label>
              <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} className="w-full bg-[#282828] border border-[#535353] rounded-md py-3 px-4 text-white" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label htmlFor="artist" className="block text-sm font-semibold mb-2">Artist *</label>
              <input id="artist" name="artist" type="text" value={formData.artist} onChange={handleChange} className="w-full bg-[#282828] border border-[#535353] rounded-md py-3 px-4 text-white" />
              {errors.artist && <p className="text-red-500 text-xs mt-1">{errors.artist}</p>}
            </div>
            <div>
              <label htmlFor="album" className="block text-sm font-semibold mb-2">Album *</label>
              <input id="album" name="album" type="text" value={formData.album} onChange={handleChange} disabled className="w-full bg-[#282828] border border-[#535353] rounded-md py-3 px-4 text-[#b3b3b3] cursor-not-allowed" />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-semibold mb-2">Duration *</label>
              <input id="duration" name="duration" type="text" value={formData.duration} onChange={handleChange} disabled className="w-full bg-[#282828] border border-[#535353] rounded-md py-3 px-4 text-[#b3b3b3] cursor-not-allowed" />
            </div>
            <div>
              <label htmlFor="genre" className="block text-sm font-semibold mb-2">Genre *</label>
              <input id="genre" name="genre" type="text" value={formData.genre} onChange={handleChange} disabled className="w-full bg-[#282828] border border-[#535353] rounded-md py-3 px-4 text-[#b3b3b3] cursor-not-allowed" />
            </div>
            <div>
              <label htmlFor="addedBy" className="block text-sm font-semibold mb-2">Added By *</label>
              <input id="addedBy" name="addedBy" type="text" value={formData.addedBy} onChange={handleChange} disabled className="w-full bg-[#282828] border border-[#535353] rounded-md py-3 px-4 text-[#b3b3b3] cursor-not-allowed" />
            </div>
          </div>

          <div className="pt-6 border-t border-[#282828] flex gap-4">
            <button type="submit" className="flex-1 px-6 py-3 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] transition-all flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Save Changes
            </button>
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-transparent border-2 border-[#535353] text-white font-bold rounded-full">
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}