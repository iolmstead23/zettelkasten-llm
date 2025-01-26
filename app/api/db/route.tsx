import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { headers } from "next/headers";

/**
 * @title MongoDB API
 *  MongoDB database operations API endpoint
 * @category api
 */

/**
 * @title GET Operation
 * @remarks
 * Retrieves user data from MongoDB.
 * Requires userID in request headers.
 *
 * @returns {Promise<NextResponse>} JSON response with user data
 * @throws {Error} Database connection errors
 */
export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!, {});
  const headersList = headers();
  const userID = (await headersList).get("userid");

  try {
    await client.connect();
    const db = client.db("userdata");
    const notes = await db
      .collection("notes")
      .find({ userID: userID })
      .toArray();
    return NextResponse.json(notes[0].data, { status: 200 });
  } catch (error) {
    return NextResponse.json(error, { status: 400 });
  } finally {
    await client.close();
  }
}

/**
 * @title POST Operation
 * @remarks
 * Updates user data in MongoDB.
 *
 * @param {Request} req - Request containing user data
 * @returns {Promise<NextResponse>} JSON response with result
 * @throws {Error} Database connection errors
 */
export async function POST(req: Request) {
  const client = new MongoClient(process.env.MONGODB_URI!, {});
  const data = await req.json();

  try {
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Unable to connect to database" });
  } finally {
    await client.close();
  }
}
