import { config } from "./defaultConfig";
import { fetchCommunityList } from "../communityList";

it("finds RoR2 in community listing", async () => {
  const response = await fetchCommunityList(config);

  expect(Array.isArray(response.results)).toEqual(true);

  const ror = response.results.find(
    (x: { identifier: string }) => x.identifier === "riskofrain2"
  );

  expect(ror).toBeDefined();
});