import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './data/context';
import { Layout } from './components/Layout';
import { FullPageLoader } from './components/LoadingSpinner';
import { TodayScreen } from './screens/TodayScreen';
import { PlanScreen } from './screens/PlanScreen';

// Lazy load ProgressScreen since it includes heavy Recharts library
const ProgressScreen = lazy(() =>
  import('./screens/ProgressScreen').then(m => ({ default: m.ProgressScreen }))
);

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<TodayScreen />} />
            <Route path="plan" element={<PlanScreen />} />
            <Route
              path="progress"
              element={
                <Suspense fallback={<FullPageLoader />}>
                  <ProgressScreen />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
