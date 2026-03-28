import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const NO_SCROLL_ROUTES = ['/calendar'];

export default function Layout() {
  const { pathname } = useLocation();
  const noScroll = NO_SCROLL_ROUTES.includes(pathname);

  return (
    <div className="h-screen flex flex-col bg-echo-bg overflow-hidden">
      <main
        className={`flex-1 safe-top max-w-lg mx-auto w-full px-5 ${noScroll ? 'overflow-hidden' : 'overflow-y-auto'}`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 120px)' }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
