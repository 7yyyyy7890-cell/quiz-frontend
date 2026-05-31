import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Competition from './pages/Competition';
import Admin from './pages/Admin';
import ApiKeys from './pages/ApiKeys';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Competition />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/keys" element={<ApiKeys />} />
      </Route>
    </Routes>
  );
}
