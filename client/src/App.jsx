import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useState } from 'react';
import Layout from './components/Layout.jsx';
import LayoutPublic from './components/LayoutPublic.jsx';
import SoundGate from './components/SoundGate.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Chantier = lazy(() => import('./pages/Chantier.jsx'));
const ArcDetail = lazy(() => import('./pages/ArcDetail.jsx'));
const CatalogueInstrus = lazy(() => import('./pages/CatalogueInstrus.jsx'));
const CatalogueProjets = lazy(() => import('./pages/CatalogueProjets.jsx'));
const Drops = lazy(() => import('./pages/Drops.jsx'));
const DropDetail = lazy(() => import('./pages/DropDetail.jsx'));
const Streaks = lazy(() => import('./pages/Streaks.jsx'));
const Insights = lazy(() => import('./pages/Insights.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Freelance = lazy(() => import('./pages/Freelance.jsx'));
const Portefeuille = lazy(() => import('./pages/Portefeuille.jsx'));
const Revue = lazy(() => import('./pages/Revue.jsx'));
const Parametres = lazy(() => import('./pages/Parametres.jsx'));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales.jsx'));
const Confidentialite = lazy(() => import('./pages/Confidentialite.jsx'));

function Prive({ children }) {
  return (
    <RequireAuth>
      <Layout>{children}</Layout>
    </RequireAuth>
  );
}

function RouteFallback() {
  return (
    <div style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
      › chargement…
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const [entre, setEntre] = useState(() => sessionStorage.getItem('twiy_gate') === '1');

  function onEnter(withSound) {
    sessionStorage.setItem('twiy_gate', '1');
    if (withSound === false) sessionStorage.setItem('twiy_sound', '0');
    setEntre(true);
  }

  // /login + pages légales accessibles sans SoundGate
  const gateOk =
    entre ||
    location.pathname === '/login' ||
    location.pathname === '/mentions' ||
    location.pathname === '/confidentialite';

  return (
    <AuthProvider>
      {!gateOk ? (
        <SoundGate onEnter={onEnter} />
      ) : (
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mentions" element={<LayoutPublic><MentionsLegales /></LayoutPublic>} />
            <Route path="/confidentialite" element={<LayoutPublic><Confidentialite /></LayoutPublic>} />

            <Route path="/catalogue/instrus" element={<LayoutPublic><CatalogueInstrus mode="public" /></LayoutPublic>} />
            <Route path="/catalogue/projets" element={<LayoutPublic><CatalogueProjets mode="public" /></LayoutPublic>} />

            <Route path="/studio/instrus" element={<Prive><CatalogueInstrus mode="edit" /></Prive>} />
            <Route path="/studio/projets" element={<Prive><CatalogueProjets mode="edit" /></Prive>} />

            <Route path="/chantier" element={<Prive><Chantier /></Prive>} />
            <Route path="/chantier/:arc" element={<Prive><ArcDetail /></Prive>} />
            <Route path="/drops" element={<Prive><Drops /></Prive>} />
            <Route path="/drops/:id" element={<Prive><DropDetail /></Prive>} />
            <Route path="/streaks" element={<Prive><Streaks /></Prive>} />
            <Route path="/insights" element={<Prive><Insights /></Prive>} />
            <Route path="/analytics" element={<Prive><Analytics /></Prive>} />
            <Route path="/freelance" element={<Prive><Freelance /></Prive>} />
            <Route path="/portefeuille" element={<Prive><Portefeuille /></Prive>} />
            <Route path="/revue" element={<Prive><Revue /></Prive>} />
            <Route path="/parametres" element={<Prive><Parametres /></Prive>} />
          </Routes>
        </Suspense>
      )}
    </AuthProvider>
  );
}
