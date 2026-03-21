import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import { DapperTs } from "@thunderstore/dapper-ts";
import { type PackageListing } from "@thunderstore/dapper/types";

export function useDependencySearch(dapper: DapperTs) {
  const [dependencySourceCommunity, setDependencySourceCommunity] =
    useState<string>("");
  const [dependencySearchQuery, setDependencySearchQuery] =
    useState<string>("");
  const [debouncedDependencySearchQuery] = useDebounce(
    dependencySearchQuery,
    300
  );
  const [dependencySearchResults, setDependencySearchResults] = useState<
    { value: string; label: string; pkg: PackageListing }[]
  >([]);
  const [selectedDependency, setSelectedDependency] = useState<{
    value: string;
    label: string;
    pkg: PackageListing;
  } | null>(null);
  const [isAddingDependency, setIsAddingDependency] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    async function searchCommunityPackages() {
      if (dependencySourceCommunity) {
        try {
          const result = await dapper.getPackageListings(
            { kind: "community", communityId: dependencySourceCommunity },
            undefined,
            1,
            debouncedDependencySearchQuery || undefined
          );
          if (active) {
            setDependencySearchResults(
              result.results.map((pkg) => ({
                value: `${pkg.namespace}-${pkg.name}`,
                label: `${pkg.name} by ${pkg.namespace}`,
                pkg: pkg,
              }))
            );
          }
        } catch (err) {
          console.error("Failed to fetch dependency packages", err);
          if (active) {
            setDependencySearchResults([]);
          }
        }
      } else {
        if (active) setDependencySearchResults([]);
      }
    }
    searchCommunityPackages();
    return () => {
      active = false;
    };
  }, [dependencySourceCommunity, debouncedDependencySearchQuery, dapper]);

  return {
    dependencySourceCommunity,
    setDependencySourceCommunity,
    dependencySearchQuery,
    setDependencySearchQuery,
    dependencySearchResults,
    selectedDependency,
    setSelectedDependency,
    isAddingDependency,
    setIsAddingDependency,
  };
}
