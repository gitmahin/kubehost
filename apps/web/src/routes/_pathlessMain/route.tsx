import { Sidebar, Header } from '@/components'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_pathlessMain')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='flex justify-start items-start'>
    <Sidebar />
    <div className='w-full'>
      <Header />
      <Outlet />
    </div>
  </div>
}
