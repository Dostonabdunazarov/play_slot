import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { PublicHeader, Sidebar, TabBar, TopBar } from './Navbar'
import PitchBackdrop from './PitchBackdrop'

export default function Layout() {
  const loggedIn = useAuthStore((s) => s.isAuthenticated())

  if (!loggedIn) {
    return (
      <div className="relative min-h-dvh bg-ground">
        <PitchBackdrop />
        <div aria-hidden className="glow-brand pointer-events-none absolute inset-x-0 top-0 z-0 h-96" />
        <div className="relative z-10 flex min-h-dvh flex-col">
          <PublicHeader />
          <main className="mx-auto w-full max-w-7xl 2xl:max-w-[100rem] flex-1 px-4 pt-5 pb-10 sm:px-6 lg:px-10 lg:pt-9 lg:pb-12">
            <Outlet />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh bg-ground">
      <PitchBackdrop />
      <div aria-hidden className="glow-brand pointer-events-none absolute inset-x-0 top-0 z-0 h-96" />
      <div className="relative z-10 flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full max-w-7xl 2xl:max-w-[100rem] flex-1 px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-9 lg:pb-12">
            <Outlet />
          </main>
        </div>
      </div>
      <TabBar />
    </div>
  )
}
