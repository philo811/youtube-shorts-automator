import React, { useState } from 'react';
import { Youtube, Upload, Clock, CheckCircle } from 'lucide-react';

function App() {
  const [url, setUrl] = useState('');
  const [connected] = useState(false);
  const [videos, setVideos] = useState([
    { id: 1, title: 'Podcast Episode 42', status: 'PROCESSING' },
    { id: 2, title: 'Tech Review 2024', status: 'DONE' },
  ]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const handleConnect = () => {
    // Redirect to backend OAuth flow
    window.location.href = `${API_URL}/api/youtube/auth-url`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    // Optimistic UI update
    setVideos([{ id: Date.now(), title: url, status: 'PENDING' }, ...videos]);
    setUrl('');
    
    // In real app, call POST /api/videos/ingest
  };

  return (
    <div className="premium-container">
      <header className="header">
        <div className="logo">ShortsAutomator</div>
        <button 
          className={`btn ${connected ? '' : 'btn-youtube'}`}
          onClick={handleConnect}
        >
          <Youtube size={20} />
          {connected ? 'Channel Connected' : 'Sign in with YouTube'}
        </button>
      </header>

      <main>
        <section className="card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Create New Clips</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>YouTube Video URL</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="url" 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  style={{ flex: 1 }}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <button type="submit" className="btn">
                  <Upload size={20} />
                  Ingest Video
                </button>
              </div>
            </div>
          </form>
        </section>

        <section>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Recent Jobs</h3>
          <div className="video-grid">
            {videos.map(video => (
              <div key={video.id} className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {video.title}
                </h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {video.status === 'PENDING' && <Clock size={16} color="var(--text-muted)" />}
                  {video.status === 'PROCESSING' && <Clock size={16} color="#818cf8" />}
                  {video.status === 'DONE' && <CheckCircle size={16} color="#34d399" />}
                  
                  <span className={`status-badge status-${video.status.toLowerCase()}`}>
                    {video.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
