import { useState, useEffect } from "react";
import "./App.css";

const API_BASE = "http://localhost:8000";

/* ── small helper ── */
const Badge = ({ label }) => (
  <span className="badge">{label}</span>
);

function App() {
  const [query, setQuery]             = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [method, setMethod]           = useState("hybrid");
  const [allBooks, setAllBooks]       = useState([]);

  /* Fetch all book titles once for autocomplete */
  useEffect(() => {
    fetch(`${API_BASE}/books`)
      .then(r => r.json())
      .then(data => setAllBooks(data.books || []))
      .catch(() => {});
  }, []);

  /* Live autocomplete */
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const filtered = allBooks
      .filter(b => b.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);
    setSuggestions(filtered);
  }, [query, allBooks]);

  const fetchRecommendations = async (bookName = query) => {
    if (!bookName.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);
    setSuggestions([]);

    try {
      const url = `${API_BASE}/recommend?book_name=${encodeURIComponent(bookName)}&method=${method}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong.");
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const pickSuggestion = (title) => {
    setQuery(title);
    setSuggestions([]);
    fetchRecommendations(title);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") fetchRecommendations();
  };

  /* Genre → colour map */
  const genreColor = (genre) => {
    const map = {
      "Dystopia":"#e74c3c","Fantasy":"#9b59b6","Thriller":"#e67e22",
      "Mystery":"#f39c12","Classic":"#2ecc71","Science":"#3498db",
      "Non-Fiction":"#1abc9c","Sci-Fi":"#2980b9","Philosophy":"#8e44ad",
      "Post-Apocalyptic":"#c0392b","Political Satire":"#d35400",
    };
    return map[genre] || "#607d8b";
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">BookMind</span>
          </div>
          <p className="tagline">AI-powered book recommendations</p>
        </div>
        <div className="header-decor" aria-hidden />
      </header>

      {/* ── Search ── */}
      <main className="main">
        <section className="search-section">
          <h1 className="search-title">Find Your Next Read</h1>
          <p className="search-sub">Enter a book you love and we'll recommend what to read next.</p>

          {/* Method Toggle */}
          <div className="method-toggle">
            {["hybrid","content","collaborative"].map(m => (
              <button
                key={m}
                className={`method-btn ${method === m ? "active" : ""}`}
                onClick={() => setMethod(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="search-wrap">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="e.g. 1984, Harry Potter, Sapiens…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
              />
              {query && (
                <button className="clear-btn" onClick={() => { setQuery(""); setResults(null); setError(""); }}>✕</button>
              )}
            </div>

            <button
              className="search-btn"
              onClick={() => fetchRecommendations()}
              disabled={loading || !query.trim()}
            >
              {loading ? <span className="spinner" /> : "Recommend"}
            </button>

            {/* Autocomplete Dropdown */}
            {suggestions.length > 0 && (
              <ul className="suggestions">
                {suggestions.map(s => (
                  <li key={s} className="suggestion-item" onClick={() => pickSuggestion(s)}>
                    <span className="sug-icon">📖</span> {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="error-box">
              <span>⚠️</span> {error}
            </div>
          )}
        </section>

        {/* ── Results ── */}
        {results && (
          <section className="results-section">
            <div className="results-header">
              <h2 className="results-title">
                Because you like <em>"{results.input_book}"</em>
              </h2>
              <Badge label={`${results.method} model`} />
            </div>

            <div className="cards-grid">
              {results.recommendations.map((book, i) => (
                <div className="card" key={book.title} style={{"--delay": `${i * 80}ms`}}>
                  <div className="card-rank">#{i + 1}</div>

                  <div className="card-cover">
                    <span className="card-cover-emoji">📖</span>
                  </div>

                  <div className="card-body">
                    <h3 className="card-title">{book.title}</h3>
                    <p className="card-author">by {book.author}</p>

                    <div className="card-meta">
                      <span
                        className="card-genre"
                        style={{ background: genreColor(book.genre) + "22", color: genreColor(book.genre), border: `1px solid ${genreColor(book.genre)}44` }}
                      >
                        {book.genre}
                      </span>

                      <div className="score-bar-wrap">
                        <div
                          className="score-bar"
                          style={{ width: `${book.similarity_score * 100}%` }}
                        />
                        <span className="score-label">{(book.similarity_score * 100).toFixed(0)}% match</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Empty State ── */}
        {!results && !loading && !error && (
          <div className="empty-state">
            <div className="empty-books">
              {["📕","📗","📘","📙","📚"].map((e, i) => (
                <span key={i} className="empty-book" style={{"--i": i}}>{e}</span>
              ))}
            </div>
            <p>Search for a book above to get personalised recommendations.</p>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>BookMind · Built with FastAPI + React · Cosine Similarity ML</p>
      </footer>
    </div>
  );
}

export default App;
