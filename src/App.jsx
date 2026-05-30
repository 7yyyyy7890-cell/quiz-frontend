import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Competition from './pages/Competition';
import Admin from './pages/Admin';
import ApiKeys from './pages/ApiKeys';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/competition" element={<Competition />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/keys" element={<ApiKeys />} />
      </Route>
    </Routes>
  );
}
