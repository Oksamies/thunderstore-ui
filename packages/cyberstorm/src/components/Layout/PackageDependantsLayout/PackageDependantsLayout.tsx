"use client";
import { BreadCrumbs } from "../../BreadCrumbs/BreadCrumbs";
import { CommunitiesLink, CommunityLink, PackageLink } from "../../Links/Links";
import { getCommunityDummyData } from "../../../dummyData";
import { Package } from "../../../schema";
import { BaseLayout } from "../BaseLayout/BaseLayout";
import PackageSearchLayout from "../PackageSearchLayout/PackageSearchLayout";
import styles from "./PackageDependantsLayout.module.css";

export interface PackageDependantsLayoutProps {
  isLoading?: boolean;
  packageData: Package;
}

/**
 * Cyberstorm PackageList Layout
 */
export function PackageDependantsLayout(props: PackageDependantsLayoutProps) {
  const { packageData } = props;

  const communityData = getCommunityData(packageData.community);

  return (
    <BaseLayout
      backGroundImageSource={
        communityData.backgroundImageSource
          ? communityData.backgroundImageSource
          : "/images/community_bg.png"
      }
      breadCrumb={
        <BreadCrumbs>
          <CommunitiesLink>Communities</CommunitiesLink>
          <CommunityLink community={communityData.name}>
            {communityData.name}
          </CommunityLink>
          <PackageLink
            community={packageData.community}
            namespace={packageData.namespace}
            package={packageData.name}
          >
            {packageData.name}
          </PackageLink>
          Dependants
        </BreadCrumbs>
      }
      header={
        <div className={styles.header}>
          {"Mods that depend on " +
            packageData.name +
            " by " +
            packageData.author}
        </div>
      }
      mainContent={<PackageSearchLayout communityId={communityData.name} />}
    />
  );
}

PackageDependantsLayout.displayName = "PackageDependantsLayout";

function getCommunityData(communityId: string) {
  return getCommunityDummyData(communityId);
}