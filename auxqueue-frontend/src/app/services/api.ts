const SERVER_IP = import.meta.env.VITE_SERVER_IP || '172.30.243.204';
const SERVER_PORT = import.meta.env.VITE_SERVER_PORT || '3443';

const API_URL = `https://${SERVER_IP}:${SERVER_PORT}/graphql`;
const WS_URL = `wss://${SERVER_IP}:${SERVER_PORT}`;

let offlineQueue: { query: string, variables: any }[] = JSON.parse(localStorage.getItem('offline_queue') || '[]');
let ws: WebSocket | null = null;
let wsListeners: ((data: any) => void)[] = [];

const connectWS = () => {
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      wsListeners.forEach(listener => listener(data));
    };
  }
};

window.addEventListener('online', async () => {
  for (const item of offlineQueue) {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(item)
      });
    } catch (e) {}
  }
  offlineQueue = [];
  localStorage.removeItem('offline_queue');
  window.dispatchEvent(new CustomEvent('sync-complete'));
});

const executeGraphQL = async (query: string, variables: any = {}) => {
  const headers: any = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (!navigator.onLine) {
    if (query.includes('mutation')) {
      offlineQueue.push({ query, variables });
      localStorage.setItem('offline_queue', JSON.stringify(offlineQueue));
      return { id: `temp-${Date.now()}`, ...variables };
    }
    const cached = localStorage.getItem(`cache_${query}`);
    return cached ? JSON.parse(cached) : null;
  }

  let json: any;
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/';
      }
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }

    json = await res.json();
  } catch (err: any) {
    throw new Error(err?.message || 'Network error — could not reach server');
  }

  if (json?.errors?.length) {
    const message = json.errors[0]?.message ?? json.errors[0]?.toString() ?? 'Unknown GraphQL error';
    if (message.includes('Not authenticated') || message.includes('token')) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw new Error(message);
  }

  if (!query.includes('mutation')) {
    localStorage.setItem(`cache_${query}`, JSON.stringify(json.data));
  }

  return json.data;
};

export const api = {
  subscribe(listener: (data: any) => void) {
    connectWS();
    wsListeners.push(listener);
    return () => { wsListeners = wsListeners.filter(l => l !== listener); };
  },
  async register(variables: any) {
    const data = await executeGraphQL(`mutation($name: String!, $email: String!, $password: String!) { register(name: $name, email: $email, password: $password) { id name email token role { name } } }`, variables);
    if (data.register.token) localStorage.setItem('token', data.register.token);
    return data.register;
  },
  async login(variables: any) {
    const data = await executeGraphQL(`mutation($email: String!, $password: String!) { login(email: $email, password: $password) { id name email token role { name } } }`, variables);
    if (data.login.token && data.login.token !== 'PENDING_2FA') {
      localStorage.setItem('token', data.login.token);
    }
    return data.login;
  },
  async verify2FA(variables: any) {
    const data = await executeGraphQL(`mutation($email: String!, $pin: String!) { verify2FA(email: $email, pin: $pin) { id name email token role { name } } }`, variables);
    if (data.verify2FA.token) localStorage.setItem('token', data.verify2FA.token);
    return data.verify2FA;
  },
  async requestPasswordRecovery(email: string) {
    const data = await executeGraphQL(`mutation($email: String!) { requestPasswordRecovery(email: $email) }`, { email });
    return data.requestPasswordRecovery;
  },
  async resetPassword(variables: any) {
    const data = await executeGraphQL(`mutation($email: String!, $token: String!, $newPassword: String!) { resetPassword(email: $email, token: $token, newPassword: $newPassword) }`, variables);
    return data.resetPassword;
  },
  async createParty(name: string) {
    const data = await executeGraphQL(`mutation($name: String!) { createParty(name: $name) { id name code } }`, { name });
    return data.createParty;
  },
  async getParty(code: string) {
    const data = await executeGraphQL(`query($code: String!) { getParty(code: $code) { id name code } }`, { code });
    if (!data.getParty) throw new Error("Not found");
    return data.getParty;
  },
  async getSongs(page = 1, limit = 10, partyCode?: string, addedBy?: string) {
    const data = await executeGraphQL(`
      query($page: Int, $limit: Int, $partyCode: String, $addedBy: String) {
        getSongs(page: $page, limit: $limit, partyCode: $partyCode, addedBy: $addedBy) {
          data { id title artist album genre duration addedBy votes addedAt partyCode }
          total page totalPages
        }
      }
    `, { page, limit, partyCode, addedBy });
    return data.getSongs;
  },
  async getSongById(id: string) {
    const data = await executeGraphQL(`
      query($id: ID!) {
        getSongById(id: $id) {
          id title artist album genre duration addedBy votes addedAt partyCode
        }
      }
    `, { id });
    if (!data.getSongById) throw new Error("Not found");
    return data.getSongById;
  },
  async addSong(variables: any) {
    const data = await executeGraphQL(`mutation($title: String!, $artist: String!, $album: String, $genre: String, $duration: String, $addedBy: String!, $partyCode: String) { addSong(title: $title, artist: $artist, album: $album, genre: $genre, duration: $duration, addedBy: $addedBy, partyCode: $partyCode) { id } }`, variables);
    return data.addSong;
  },
  async updateSong(id: string, variables: any) {
    const data = await executeGraphQL(`mutation($id: ID!, $title: String, $artist: String) { updateSong(id: $id, title: $title, artist: $artist) { id } }`, { id, ...variables });
    return data.updateSong;
  },
  async deleteSong(id: string) {
    await executeGraphQL(`mutation($id: ID!) { deleteSong(id: $id) }`, { id });
  },
  async voteSong(id: string, delta: number) {
    await executeGraphQL(`mutation($id: ID!, $delta: Int!) { voteSong(id: $id, delta: $delta) { id votes } }`, { id, delta });
  },
  async getParties() {
    const data = await executeGraphQL(`query { getParties { id name code } }`);
    return data.getParties;
  },
  async startGeneration(code: string) {
    await executeGraphQL(`mutation($code: String!) { startGeneration(code: $code) }`, { code });
  },
  async stopGeneration(code: string) {
    await executeGraphQL(`mutation($code: String!) { stopGeneration(code: $code) }`, { code });
  },
  async getHeavyPartyAnalytics(partyCode: string) {
    const data = await executeGraphQL(`
      query($partyCode: String!) {
        getHeavyPartyAnalytics(partyCode: $partyCode) {
          partyCode totalSongs uniqueArtists dominantGenre averageVotes topContributor synergyScore
        }
      }
    `, { partyCode });
    return data.getHeavyPartyAnalytics;
  }
};