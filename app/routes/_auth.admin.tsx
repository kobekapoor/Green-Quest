import { json } from '@remix-run/node'
import { Outlet } from '@remix-run/react'


export function meta({data}) {
  return [{ title: `${data.siteName} - Admin` }]
}

export const loader = async () => {

  const siteName = process.env.SITE_NAME ? process.env.SITE_NAME.toString() : 'Blank';


  return json({
    siteName,
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
