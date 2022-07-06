import StatusCodes from "http-status-codes";
import { Request, Response, Router } from "express";
import Airtable from "airtable";
import { json } from "stream/consumers";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY || "" }).base(
  process.env.AIRTABLE_BASE || ""
);
const releases_table = base("Releases");
const versions_table = base("Versions");
// Constants
const router = Router();
const { OK, NO_CONTENT } = StatusCodes;

// Paths
export const p = {
  get_release: "/:target/:version",
  get_version: "/version",
} as const;

interface UpdaterResponse {
  url: string;
  version: string;
  notes: string;
  pub_date: string;
  signature: string;
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get(p.get_version, async (_req: Request, res: Response) => {
  try {
    const records = await versions_table
      .select({
        filterByFormula: `{status}="stable"`,
      })
      .all();
    if (!records || records.length == 0) {
      throw new Error("No stable versions found");
    }
    const recs = records.map((r) => r.get("version"));
    if (recs && recs.length > 0) {
      const version = recs.sort((a, b) => (a && b && a > b ? -1 : 1))[0];
      return res.status(OK).json({ status: "success", data: version });
    } else {
      throw new Error("No stable versions found");
    }
  } catch (error) {
    return res.status(OK).json({
      status: "error",
      message: error.message,
    });
  }
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get(p.get_release, async (req: Request, res: Response) => {
  const { params } = req;
  const { version, target } = params;
  try {
    const records = await releases_table
      .select({
        filterByFormula: `AND({key}="${version}",{target}="${target}")`,
      })
      .all();
    if (!records || records.length == 0) {
      return res.status(NO_CONTENT).send("SUCCsESS");
    }
    const record = records[0];
    const new_version: UpdaterResponse = {
      url: record.get("url") as string,
      version: record.get("version") as string,
      notes: record.get("notes") as string,
      pub_date: new Date(record.get("date") as string).toISOString(),
      signature: record.get("signature") as string,
    };

    return res.status(OK).json({ ...new_version });
  } catch (error) {
    return res.status(NO_CONTENT).send("SUCCsESS");
  }
});

// Export default
export default router;
