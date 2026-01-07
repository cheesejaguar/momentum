import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './data/context';
import { Layout } from './components/Layout';
import { TodayScreen } from './screens/TodayScreen';
import { PlanScreen } from './screens/PlanScreen';
import { ProgressScreen } from './screens/ProgressScreen';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<TodayScreen />} />
            <Route path="plan" element={<PlanScreen />} />
            <Route path="progress" element={<ProgressScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
