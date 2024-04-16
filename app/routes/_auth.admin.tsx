import { json } from '@remix-run/node'
import { Outlet } from '@remix-run/react'

const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';

export function meta() {
  return [{ title: `${siteName} - Admin` }]
}

export const loader = async () => {
  return json({
    breadcrumbs: [{ label: 'Admin', href: '/admin', isCurrentPage: true }],
  })
}

export default function Admin() {
  return (
    <>
      <Outlet />
    </>
  )
}
