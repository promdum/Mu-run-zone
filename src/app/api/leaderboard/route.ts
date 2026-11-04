import { json, liveRequest } from "@/lib/http";
import { facultyStandings, runnerStandings, teamStandings } from "@/lib/ranks";
import { listVerifiedRuns } from "@/lib/records";
import { toRunEntry } from "@/lib/run-record";

export async function GET() {
  await liveRequest();
  try {
    const runs = (await listVerifiedRuns()).map(toRunEntry);
    return json({
      standings: facultyStandings(runs),
      runners: runnerStandings(runs),
      teams: teamStandings(runs),
    });
  } catch {
    return json({ error: "โหลดลีดเดอร์บอร์ดไม่สำเร็จ" }, 503);
  }
}
