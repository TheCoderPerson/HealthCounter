import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initializeDatabase } from './db/database';
import { Navigation } from './components/Navigation';
import { TodayPage } from './pages/TodayPage';
import { SearchPage } from './pages/SearchPage';
import { ScanPage } from './pages/ScanPage';
import { RecipesPage } from './pages/RecipesPage';
import { ManualFoodPage } from './pages/ManualFoodPage';
import { FoodDetailPage } from './pages/FoodDetailPage';

function App() {
  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <BrowserRouter>
      <div className="pb-16">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/manual" element={<ManualFoodPage />} />
          <Route path="/food/:id" element={<FoodDetailPage />} />
        </Routes>
      </div>
      <Navigation />
    </BrowserRouter>
  );
}

export default App;
