import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, LogIn, Music, Users, LogOut, ShieldAlert } from 'lucide-react';
import { AuxCordLogo } from '../components/AuxCordLogo';
import { api } from '../services/api';

export function PartySelectionPage() {
  const [parties, setParties] = useState<{id: string, name: string, code: string}[]>([]);
  
  // Fetch user role to determine if they can see the Admin Dashboard
  const userRole = localStorage.getItem('userRole') || 'USER';

  useEffect(() => {
    api.getParties().then(setParties).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="bg-[#181818] border-b border-[#282828]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-[#1DB954]" />
            <h1 className="text-2xl font-bold">AuxQueue</h1>
          </div>
          <div className="flex items-center gap-4">
            
            {/* ONLY ADMINS SEE THIS BUTTON */}
            {userRole === 'ADMIN' && (
              <Link to="/admin" className="text-red-400 hover:text-red-300 font-bold flex items-center gap-2 transition-colors mr-4 border border-red-500/30 px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20">
                <ShieldAlert className="w-5 h-5" />
                Admin Logs
              </Link>
            )}

            <Link to="/dashboard" className="text-[#b3b3b3] hover:text-white transition-colors">
              My Songs
            </Link>
            <Link to="/" className="px-4 py-2 bg-transparent border border-[#535353] text-white rounded-full hover:bg-[#282828] transition-all flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Logout
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <AuxCordLogo className="w-24 h-24 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Choose Your Party</h1>
          <p className="text-xl text-[#b3b3b3]">Create a new party or join an existing one</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link to="/party/create" className="group bg-[#181818] rounded-xl p-8 hover:bg-[#282828] transition-all border-2 border-transparent hover:border-[#1DB954] hover:scale-105">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-10 h-10 text-black" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-3">Create Party</h2>
                <p className="text-[#b3b3b3] leading-relaxed">Start a new party queue and get a unique code to share with your friends</p>
              </div>
              <div className="pt-4">
                <span className="px-6 py-3 bg-[#1DB954] text-black font-bold rounded-full inline-flex items-center gap-2 group-hover:bg-[#1ed760] transition-colors">
                  Get Started
                  <Plus className="w-5 h-5" />
                </span>
              </div>
            </div>
          </Link>

          <Link to="/party/join" className="group bg-[#181818] rounded-xl p-8 hover:bg-[#282828] transition-all border-2 border-transparent hover:border-[#1DB954] hover:scale-105">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <LogIn className="w-10 h-10 text-black" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-3">Join Party</h2>
                <p className="text-[#b3b3b3] leading-relaxed">Enter a party code to join your friends and start voting on songs</p>
              </div>
              <div className="pt-4">
                <span className="px-6 py-3 bg-[#1DB954] text-black font-bold rounded-full inline-flex items-center gap-2 group-hover:bg-[#1ed760] transition-colors">
                  Enter Code
                  <LogIn className="w-5 h-5" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-[#181818] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-[#1DB954]" />
              <h3 className="text-2xl font-bold">Recent Parties</h3>
            </div>
            
            <div className="space-y-3">
              {parties.length === 0 ? (
                <p className="text-[#b3b3b3] text-center py-4">No recent parties found. Create one above!</p>
              ) : (
                parties.map((party) => (
                  <Link
                    key={party.id}
                    to={`/party/${party.code}/queue`}
                    className="flex items-center justify-between p-4 bg-[#282828] rounded-lg hover:bg-[#535353] transition-colors"
                  >
                    <div>
                      <p className="font-bold">{party.name}</p>
                      <p className="text-sm text-[#b3b3b3]">Code: {party.code}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[#1DB954]">
                      <span className="text-sm font-semibold">Join</span>
                      <LogIn className="w-5 h-5" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}