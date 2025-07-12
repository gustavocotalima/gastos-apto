import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthPage = nextUrl.pathname === "/login"
  const isHomePage = nextUrl.pathname === "/"

  // Allow auth pages when not logged in
  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl))
    }
    return NextResponse.next()
  }

  // Redirect to login only if not logged in and not already on login page
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/login", nextUrl)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icon.*|.*\\.png|.*\\.svg).*)"],
}