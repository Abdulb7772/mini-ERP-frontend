import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const isOnProtected = nextUrl.pathname.startsWith("/protected");
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnRegister = nextUrl.pathname.startsWith("/register");
      const isOnProducts = nextUrl.pathname === "/products";

      if (isOnProtected) {
        if (!isLoggedIn) return false; // Redirect unauthenticated users to login page
        
        // Block customers from accessing protected routes
        if (userRole === "customer") {
          return NextResponse.redirect(new URL("/products", nextUrl));
        }
        
        return true;
      } else if (isLoggedIn && (isOnLogin || isOnRegister)) {
        // Redirect based on role after login/register
        if (userRole === "customer") {
          return NextResponse.redirect(new URL("/products", nextUrl));
        }
        return NextResponse.redirect(new URL("/protected/dashboard", nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
