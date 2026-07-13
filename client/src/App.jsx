import { Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout.jsx';
import LayoutPublic from './components/LayoutPublic.jsx';
import SoundGate from './components/SoundGate.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Chantier from './pages/Chantier.jsx';
import ArcDetail from './pages/ArcDetail.jsx';
import CatalogueInstrus from './pages/CatalogueInstrus.jsx';
import CatalogueProjets from './pages/CatalogueProjets.jsx';
import Drops from './pages/Drops.jsx';
import DropDetail from './pages/DropDetail.jsx';
import Streaks from './pages/Streaks.jsx';
import Insights from './pages/Insights.jsx';
import Analytics from './pages/Analytics.jsx';
import Freelance from './pages/Freelance.jsx';
import Portefeuille from './pages/Portefeuille.jsx';
import Revue from './pages/Revue.jsx';
import Parametres from './pages/Parametres.jsx';

function Prive({ children }) {
  return (
    <RequireAuth>
      <Layout>{children}</Layout>
    </RequireAuth>
  );
}

export default function App() {
  const location = useLocation();
  const [entre, setEntre] = useState(() => sessionStorage.getItem('twiy_gate') === '1');

  function onEnter() {
    sessionStorage.setItem('twiy_gate', '1');
    setEntre(true);
  }

  // /login accessible sans passer par le SoundGate
  const gateOk = entre || location.pathname === '/login';

  return (
    <AuthProvider>
      {!gateOk ? (
        <SoundGate onEnter={onEnter} />
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

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
      )}
    </AuthProvider>
  );
}
