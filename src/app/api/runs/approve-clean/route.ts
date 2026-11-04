import { json, liveRequest, refreshLivePages } from "@/lib/http";
import { approveCleanRuns } from "@/lib/records";
import { currentUser } from "@/lib/session";

export async function POST() {
  await liveRequest();
  const user = await currentUser();
  if (!user || user.role !== "admin") return json({ error: "เฉพาะผู้ดูแลอนุมัติผลวิ่งได้" }, 403);
  const count = await approveCleanRuns();
  refreshLivePages();
  return json({ count });
}
