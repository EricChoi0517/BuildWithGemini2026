import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-screen bg-echo-bg">
      <main className="safe-top safe-bottom max-w-lg mx-auto px-5">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
