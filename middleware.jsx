import { getSession } from "@auth0/nextjs-auth0/edge";
import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

/**
 * Authentication middleware
 * @middleware
 * @param {NextRequest} req - The incoming request object
 * @returns {NextResponse} Response with modified headers containing userID
 * @throws {Error} If session retrieval fails
 */
export default async function middleware(req) {
  try {
    const response = NextResponse.next();
    const session = await getSession(req, response);
    const userID = session?.idToken ? jwtDecode(session?.idToken).sub : null;

    response.headers.set("userID", userID);
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
