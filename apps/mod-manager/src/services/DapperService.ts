import { DapperTs } from "@thunderstore/dapper-ts";
import { RequestConfig } from "@thunderstore/thunderstore-api";

const config: RequestConfig = {
  apiHost: "https://thunderstore.io",
};

export const dapper = new DapperTs(() => config);
