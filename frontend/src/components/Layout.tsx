import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Sidebar, TabBar, TopBar } from './Navbar'

export default function Layout() {
  const loggedIn = useAuthStore((s) => s.isAuthenticated())

  return (
    <div className="flex min-h-dvh bg-ground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          className={`mx-auto w-full max-w-6xl flex-1 px-4 pt-5 sm:px-6 lg:px-10 lg:pt-9 lg:pb-12 ${
            loggedIn ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))]' : 'pb-10'
          }`}
        >
          <Outlet />
        </main>
      </div>
      <TabBar />
    </div>
  )
}
