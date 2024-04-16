import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { logout } from "~/utils/auth.server"

export const action : ActionFunction = async ({ request }) => logout(request);

export const loader = async () => redirect("/");