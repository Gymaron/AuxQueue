import { useState, useEffect } from 'react';
import { ShieldAlert, Activity, UserX } from 'lucide-react';

export function AdminDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState<any[]>([]);

  const fetchAdminData = () => {
    const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'localhost';
    const GRAPHQL_URL = `http://${SERVER_IP}:3000/graphql`;
    const token = localStorage.getItem('token');

    fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: '{ getLogs { id userId groupId action timestamp } }' })
    })
      .then(res => res.json())
      .then(res => setLogs(res.data.getLogs))
      .catch(console.error);

    fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: '{ getSuspiciousUsers { id userName reason flaggedAt } }' })
    })
      .then(res => res.json())
      .then(res => setSuspiciousUsers(res.data.getSuspiciousUsers))
      .catch(console.error);
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8">
      <h1 className="text-3xl font-bold text-red-500 flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8" /> Admin Observation Dashboard
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-[#181818] p-6 rounded-xl border border-red-500/30">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
            <UserX className="w-5 h-5" /> Suspicious Users
          </h2>
          <div className="space-y-4">
            {suspiciousUsers.length === 0 ? (
              <p className="text-[#b3b3b3]">No suspicious activity detected yet.</p>
            ) : (
              suspiciousUsers.map((user: any) => (
                <div key={user.id} className="bg-[#282828] p-4 rounded-lg border-l-4 border-red-500">
                  <p className="font-bold text-lg">{user.userName}</p>
                  <p className="text-sm text-[#b3b3b3]">Reason: {user.reason}</p>
                  <p className="text-xs text-gray-500 mt-2">{new Date(Number(user.flaggedAt)).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#181818] p-6 rounded-xl border border-[#282828]">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#1DB954]">
            <Activity className="w-5 h-5" /> Live System Logs
          </h2>
          <div className="space-y-2 h-[600px] overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-[#b3b3b3]">Awaiting system activity...</p>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="bg-[#282828] p-3 rounded">
                  <span className="text-blue-400">{log.userId.substring(0, 8)}...</span> : 
                  <span className={log.groupId === 'ADMIN' ? 'text-purple-400' : 'text-green-400'}> [{log.groupId}]</span> : 
                  <span className="text-yellow-400"> {log.action}</span> : 
                  <span className="text-gray-500"> {new Date(Number(log.timestamp)).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}