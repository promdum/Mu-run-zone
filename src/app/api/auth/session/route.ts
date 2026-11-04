import { json, liveRequest } from "@/lib/http";
import { currentUser, publicUser } from "@/lib/session";

export async function GET() {
  await liveRequest();
  const user = await currentUser();
  return json({ user: user ? publicUser(user) : null });
}