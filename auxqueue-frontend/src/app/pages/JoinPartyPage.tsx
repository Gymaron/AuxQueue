import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, LogIn } from 'lucide-react';
import { api } from '../services/api';

export function JoinPartyPage() {
  const navigate = useNavigate();
  const [partyCode, setPartyCode] = useState('');
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (partyCode.trim()) {
      try {
        await api.getParty(partyCode);
        navigate(`/party/${partyCode.toUpperCase()}/queue`);
      } catch (err: any) {
        setServerError('Party not found. Please check the code.');
      }
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setPartyCode(value);
    setServerError('');
  };

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
          <h1 className="text-5xl font-bold mb-4">Join a Party</h1>
          <p className="text-xl text-[#b3b3b3]">Enter the 6-digit party code to join</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#181818] rounded-xl p-8 space-y-8">
          {serverError && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm text-center">
              {serverError}
            </div>
          )}
          <div>
            <label htmlFor="partyCode" className="block text-sm font-semibold mb-3 text-center">Party Code</label>
            <input
              id="partyCode" type="text" value={partyCode} onChange={handleCodeChange} required maxLength={6} autoComplete="off"
              className="w-full bg-[#282828] border-2 border-[#535353] rounded-lg py-6 px-6 text-white text-5xl font-bold text-center tracking-widest focus:outline-none focus:border-[#1DB954]"
              placeholder="ABC123"
            />
          </div>

          <div className="pt-6">
            <button type="submit" disabled={partyCode.length !== 6} className="w-full bg-[#1DB954] text-black font-bold py-4 rounded-full disabled:opacity-50 flex items-center justify-center gap-2">
              <LogIn className="w-6 h-6" /> Join Party
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}