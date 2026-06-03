import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Copy, Check, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export function CreatePartyPage() {
  const navigate = useNavigate();
  const [partyName, setPartyName] = useState('');
  const [partyCode, setPartyCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    try {
      const res = await api.createParty(partyName);
      setPartyCode(res.code);
      setCreated(true);
    } catch (err: any) {
      setServerError(JSON.parse(err.message).error || 'Failed to create party');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(partyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinParty = () => {
    navigate(`/party/${partyCode}/queue`);
  };

  if (created) {
    return (
      <div className="min-h-screen bg-[#121212] text-white">
        <header className="bg-[#181818] border-b border-[#282828]">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Link to="/party/select" className="inline-flex items-center gap-2 text-[#b3b3b3] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Sparkles className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Party Created!</h1>
            <p className="text-xl text-[#b3b3b3]">Share this code with your friends</p>
          </div>

          <div className="bg-[#181818] rounded-xl p-8 space-y-8">
            <div>
              <label className="block text-sm font-semibold text-[#b3b3b3] mb-3">Party Name</label>
              <p className="text-2xl font-bold">{partyName}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#b3b3b3] mb-3">Party Code</label>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-lg p-6 text-center">
                  <p className="text-5xl font-bold text-black tracking-widest">{partyCode}</p>
                </div>
                <button onClick={handleCopyCode} className="p-4 bg-[#282828] rounded-lg hover:bg-[#535353] transition-colors">
                  {copied ? <Check className="w-6 h-6 text-[#1DB954]" /> : <Copy className="w-6 h-6" />}
                </button>
              </div>
            </div>
            <div className="pt-6 border-t border-[#282828]">
              <button onClick={handleJoinParty} className="w-full bg-[#1DB954] text-black font-bold py-4 rounded-full hover:bg-[#1ed760] transition-all">
                Enter Party Queue
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="bg-[#181818] border-b border-[#282828]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/party/select" className="inline-flex items-center gap-2 text-[#b3b3b3] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Create Your Party</h1>
          <p className="text-xl text-[#b3b3b3]">Give your party a name and we'll generate a unique code</p>
        </div>

        <form onSubmit={handleCreate} className="bg-[#181818] rounded-xl p-8 space-y-6">
          {serverError && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm">
              {serverError}
            </div>
          )}
          <div>
            <label htmlFor="partyName" className="block text-sm font-semibold mb-3">Party Name</label>
            <input
              id="partyName" type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} required
              className="w-full bg-[#282828] border border-[#535353] rounded-lg py-4 px-6 text-white text-lg focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
              placeholder="e.g., Friday Night Party"
            />
          </div>
          <div className="pt-6">
            <button type="submit" className="w-full bg-[#1DB954] text-black font-bold py-4 rounded-full hover:bg-[#1ed760] transition-all">
              Create Party
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}