import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SalesJournal from './components/SalesJournal';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h2 className="nav-brand">POS System</h2>
            <ul className="nav-menu">
              <li>
                <Link to="/" className="nav-link">Dashboard</Link>
              </li>
              <li>
                <Link to="/sales" className="nav-link">Sales Journal</Link>
              </li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sales" element={<SalesJournal />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
