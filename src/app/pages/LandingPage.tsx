import { Link } from 'react-router';
import { AuxCordLogo } from '../components/AuxCordLogo';
import { Music, Users, Vote, Zap } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <AuxCordLogo className="w-32 h-32 mx-auto animate-pulse" />
          
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-[#1DB954] to-[#1ed760] bg-clip-text text-transparent">
            AuxQueue
          </h1>
          
          <p className="text-2xl md:text-3xl text-[#b3b3b3] font-semibold">
            Democracy meets your party playlist
          </p>
          
          <p className="text-lg text-[#b3b3b3] max-w-2xl mx-auto leading-relaxed">
            Let everyone at your party have a say in what plays next. 
            Submit songs, vote on favorites, and watch the queue dynamically 
            reorder based on what your friends want to hear. No more DJ monopolies—
            your party, your collective vibe.
          </p>
          
          <div className="flex gap-4 justify-center pt-4">
            <Link
              to="/register"
              className="px-8 py-4 bg-[#1DB954] text-black font-bold rounded-full hover:bg-[#1ed760] hover:scale-105 transition-all"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-black transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="py-24 px-8 bg-[#181818]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto">
                <Music className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold">Submit Songs</h3>
              <p className="text-[#b3b3b3]">
                Add your favorite tracks to the party queue
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto">
                <Vote className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold">Vote</h3>
              <p className="text-[#b3b3b3]">
                Upvote songs you love, downvote the ones you don't
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold">Live Updates</h3>
              <p className="text-[#b3b3b3]">
                Watch the queue reorder in real-time based on votes
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold">Collaborate</h3>
              <p className="text-[#b3b3b3]">
                Everyone contributes to the perfect party atmosphere
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-8 px-8 bg-[#121212] text-center text-[#b3b3b3]">
        <p>© 2026 AuxQueue. Turn up the democracy.</p>
      </footer>
    </div>
  );
}