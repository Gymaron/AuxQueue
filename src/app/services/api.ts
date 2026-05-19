const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'localhost';
const SERVER_PORT = import.meta.env.VITE_SERVER_PORT || '3000';

const API_URL = `http://${SERVER_IP}:${SERVER_PORT}/graphql`;
const WS_URL = `ws://${SERVER_IP}:${SERVER_PORT}`;

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
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (e) {}
  }
  offlineQueue = [];
  localStorage.removeItem('offline_queue');
  window.dispatchEvent(new CustomEvent('sync-complete'));
});

const executeGraphQL = async (query: string, variables: any = {}) => {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }

    json = await res.json();
  } catch (err: any) {
    throw new Error(err?.message || 'Network error — could not reach server');
  }

  if (json?.errors?.length) {
    const message = json.errors[0]?.message ?? json.errors[0]?.toString() ?? 'Unknown GraphQL error';
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
    const data = await executeGraphQL(`mutation($name: String!, $email: String!, $password: String!) { register(name: $name, email: $email, password: $password) { id name email role { name } } }`, variables);
    return data.register;
  },
  async login(variables: any) {
    const data = await executeGraphQL(`mutation($email: String!, $password: String!) { login(email: $email, password: $password) { id name email role { name } } }`, variables);
    return data.login;
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
  }
};