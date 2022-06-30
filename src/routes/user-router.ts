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

interface Body {
  target: string;
  version: string;
}

interface Platform {
  [name: string]: {
    signature: string;
    url: string;
  };
}
interface UpdaterResponse {
  version: string;
  notes: string;
  pub_date: string;
  platforms: Platform;
}
const tempPlatform: Platform = {
  "windows-x86_64": {
    signature: "",
    // eslint-disable-next-line max-len
    url: "",
  },
};
const tempResponse: UpdaterResponse = {
  version: "",
  notes: "",
  pub_date: new Date().toISOString(),
  platforms: tempPlatform,
};
interface Update {
  [ver: string]: UpdaterResponse;
}

const updates: Update = {
  "0.1.2": {
    ...tempResponse,
    version: "0.1.3",
    // eslint-disable-next-line max-len
    notes: "first one",
    platforms: {
      "windows-x86_64": {
        signature: "",
        // eslint-disable-next-line max-len
        url: "https://github.com/mmogib/mc-exam-randomizer-app/releases/download/v0.1.2/mc-exam-randomizer-app_0.1.2_x64_en-US.msi",
      },
    },
  },
  "0.1.3": {
    ...tempResponse,
    version: "0.1.4",
    // eslint-disable-next-line max-len
    notes: "some feaures",
    platforms: {
      "windows-x86_64": {
        signature: "",
        // eslint-disable-next-line max-len
        url: "https://github.com/mmogib/mc-exam-randomizer-app/releases/download/v0.1.4/MC.Exam.Randomizer_0.1.4_x64_en-US.msi",
      },
    },
  },
};
/**
 * Get all users.
 */
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
    return res.status(NO_CONTENT).json();
  }
  const record = records[0];
  const new_version: UpdaterResponse = {
    notes: record.get("notes") as string,
    pub_date: new Date(record.get("date") as string).toISOString(),
    version: record.get("version") as string,
    platforms: {
      [target]: {
        signature: "",
        url: record.get("url") as string,
      },
    },
  };
  // const new_version: UpdaterResponse = updates[version];
  // if (!new_version) {
  //
  // }

  return res.status(OK).json({ ...new_version });
});

// Export default
export default router;
