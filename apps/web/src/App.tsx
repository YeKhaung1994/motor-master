import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { BikeDetailPage } from './pages/BikeDetailPage';
import { BrandsPage } from './pages/BrandsPage';
import { BrowsePage } from './pages/BrowsePage';
import { ComparePage } from './pages/ComparePage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/brands" element={<BrandsPage />} />
          <Route path="/brands/:slug" element={<BrowsePage />} />
          <Route path="/bikes/:slug" element={<BikeDetailPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
