import { useMatches } from "@remix-run/react";

type Breadcrumb = {
    label: string
    href: string
    isCurrentPage: boolean
}

export function useBreadcrumbs() {
    const matches = useMatches()
    const breadcrumbs = matches.filter(match => match.data && match.data.breadcrumbs).flatMap<Breadcrumb>(match => match.data.breadcrumbs)
    return breadcrumbs
}