import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-echo-bg flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 safe-top w-full max-w-6xl xl:max-w-7xl mx-auto px-5 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 md:py-8 pb-28 md:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
