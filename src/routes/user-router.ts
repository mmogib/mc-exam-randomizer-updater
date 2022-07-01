import StatusCodes from "http-status-codes";
import { Request, Response, Router } from "express";
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY || "" }).base(
  process.env.AIRTABLE_BASE || ""
);
const table = base("Releases");
// Constants
const router = Router();
const { OK, NO_CONTENT } = StatusCodes;

// Paths
export const p = {
  get_verstion: "/:target/:version",
} as const;
/*
 * {
  "url": "https://mycompany.example.com/myapp/releases/myrelease.tar.gz",
  "version": "0.0.1",
  "notes": "Theses are some release notes",
  "pub_date": "2020-09-18T12:29:53+01:00",
  "signature": ""
}
 */
interface UpdaterResponse {
  url: string;
  version: string;
  notes: string;
  pub_date: string;
  signature: string;
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get(p.get_verstion, async (req: Request, res: Response) => {
  const { params } = req;
  const { version, target } = params;
  const records = await table
    .select({
      filterByFormula: `AND({key}="${version}",{target}="${target}")`,
    })
    .all();
  if (!records || records.length == 0) {
    return res.status(NO_CONTENT).send();
  }
  const record = records[0];
  const new_version: UpdaterResponse = {
    url: record.get("url") as string,
    version: record.get("version") as string,
    notes: record.get("notes") as string,
    pub_date: new Date(record.get("date") as string).toISOString(),
    signature: record.get("signature") as string,
  };
  // const new_version: UpdaterResponse = updates[version];
  // if (!new_version) {
  //{
  //   "url": "https://mycompany.example.com/myapp/releases/myrelease.tar.gz",
  //   "version": "0.0.1",
  //   "notes": "Theses are some release notes",
  //   "pub_date": "2020-09-18T12:29:53+01:00",
  //   "signature": ""
  // }
  // }

  return res.status(OK).json({ ...new_version });
});

// Export default
export default router;
