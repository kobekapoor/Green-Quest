import { prisma } from "./prisma.server";
import { redirect, createCookieSessionStorage } from '@remix-run/node'
import { SERVER_ENV } from "~/env.server";
import { createId } from "@paralleldrive/cuid2";
import { addDays } from "date-fns";

const storage = createCookieSessionStorage({
    cookie: {
        name: 'quickerplate-session',
        secure: SERVER_ENV.NODE_ENV === 'production',
        secrets: [SERVER_ENV.SESSION_SECRET],
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
    },
});

export async function createUserSession(userId: string, redirectTo: string) {
    const session = await storage.getSession();
    const token = createId()
    const dbSession = await prisma.session.create({
        data: {
            token,
            userId: userId,
            expiresAt: new Date(addDays(Date.now(),7)),            
        },
    })

    session.set('token', token);
    return redirect(redirectTo, { headers: { 'Set-Cookie': await storage.commitSession(session) } });
}
  
  function getUserSession(request: Request) {
    return storage.getSession(request.headers.get('Cookie'))
  }
    
  export async function getUser(request: Request) {
    const session = await getUserSession(request)
    const token = session.get('token')
    if (!token || typeof token !== 'string') return null
    try {
      const user = await prisma.session.findUnique({
        where: { token },
        select: { 
          user: {
            select: {
              id: true, 
              email: true, 
              firstName: true, 
              lastName:true, 
              mobileNo: true,
              role: true, 
            }
          }
        },
      })
      return user?.user ?? null
    } catch {
      throw logout(request)
    }
  }
  
  export async function logout(request: Request) {
    const session = await getUserSession(request)
    return redirect('/signin', {
      headers: {
        'Set-Cookie': await storage.destroySession(session),
      },
    })
  }