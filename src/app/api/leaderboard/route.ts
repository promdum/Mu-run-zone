import { getPrisma } from "@/lib/db";
import { json, liveRequest } from "@/lib/http";
import { facultyStandings, runnerStandings, teamStandings } from "@/lib/ranks";
import { toRunEntry } from "@/lib/run-record";

export async function GET() {
  await liveRequest();
  const prisma = await getPrisma();
  const rows = await prisma.run.findMany({ where: { status: "verified" } });
  const runs = rows.map(toRunEntry);
  return json({
    standings: facultyStandings(runs),
    runners: runnerStandings(runs),
    teams: teamStandings(runs),
  });
}
