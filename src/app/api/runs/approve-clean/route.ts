import { getPrisma } from "@/lib/db";
import { json, liveRequest } from "@/lib/http";
import { currentUser } from "@/lib/session";

export async function POST() {
  await liveRequest();
  const user = await currentUser();
  if (!user || user.role !== "admin") return json({ error: "เฉพาะผู้ดูแลอนุมัติผลวิ่งได้" }, 403);
  const prisma = await getPrisma();
  const result = await prisma.run.updateMany({
    where: { status: "pending", flags: { isEmpty: true } },
    data: { status: "verified" },
  });
  return json({ count: result.count });
}
