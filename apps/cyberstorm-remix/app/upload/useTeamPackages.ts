import { useEffect, useState } from "react";

import type { DapperTs } from "@thunderstore/dapper-ts";
import type { PackageListing } from "@thunderstore/dapper/types";

export function useTeamPackages(
  dapper: DapperTs,
  authorName: string,
  sourceCommunity: string
) {
  const [searchPackageName, setSearchPackageName] = useState<string>("");
  const [teamPackages, setTeamPackages] = useState<
    { value: string; label: string }[]
  >([]);
  const [teamPackageListings, setTeamPackageListings] = useState<
    PackageListing[]
  >([]);

  useEffect(() => {
    let active = true;
    async function loadTeamPackages() {
      if (authorName && sourceCommunity) {
        try {
          const result = await dapper.getPackageListings({
            kind: "namespace",
            communityId: sourceCommunity,
            namespaceId: authorName,
          });
          if (active) {
            setTeamPackageListings(result.results);
            setTeamPackages(
              result.results.map((pkg) => ({
                value: pkg.name,
                label: pkg.name,
              }))
            );
          }
        } catch (err) {
          console.error("Failed to fetch team packages", err);
          if (active) {
            setTeamPackages([]);
            setTeamPackageListings([]);
          }
        }
      } else {
        setTeamPackages([]);
        setTeamPackageListings([]);
      }
    }
    loadTeamPackages();
    return () => {
      active = false;
    };
  }, [authorName, sourceCommunity, dapper]);

  return {
    teamPackages,
    teamPackageListings,
    searchPackageName,
    setSearchPackageName,
  };
}
