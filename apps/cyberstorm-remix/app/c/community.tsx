import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  BreadCrumbs,
  Button,
  CollapsibleText,
  CyberstormLink,
  ImageWithFallback,
  MetaItem,
  Title,
} from "@thunderstore/cyberstorm";
import styles from "./CommunityCard.module.css";
import { formatInteger } from "@thunderstore/cyberstorm/src/utils/utils";
import { getDapper } from "cyberstorm/dapper/sessionUtils";
import { PackageSearch } from "~/commonComponents/PackageSearch/PackageSearch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faDownload,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { ApiError } from "@thunderstore/thunderstore-api";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.community.name },
    { name: "description", content: `Mods for ${data?.community.name}` },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  if (params.communityId) {
    try {
      const dapper = await getDapper();
      const searchParams = new URL(request.url).searchParams;
      const order = searchParams.get("order");
      const page = searchParams.get("page");
      const search = searchParams.get("search");
      const includedCategories = searchParams.get("includedCategories");
      const excludedCategories = searchParams.get("excludedCategories");
      const section = searchParams.get("section");
      const nsfw = searchParams.get("nsfw");
      const deprecated = searchParams.get("deprecated");
      const created_recent = searchParams.get("created_recent");
      const updated_recent = searchParams.get("updated_recent");
      const created_after = searchParams.get("created_after");
      const created_before = searchParams.get("created_before");
      const updated_after = searchParams.get("updated_after");
      const updated_before = searchParams.get("updated_before");
      return {
        community: await dapper.getCommunity(params.communityId),
        filters: await dapper.getCommunityFilters(params.communityId),
        listings: await dapper.getPackageListings(
          {
            kind: "community",
            communityId: params.communityId,
          },
          order ?? "",
          page === null ? undefined : Number(page),
          search ?? "",
          includedCategories?.split(",") ?? undefined,
          excludedCategories?.split(",") ?? undefined,
          section ?? "",
          nsfw === "true" ? true : false,
          deprecated === "true" ? true : false,
          created_recent ?? "",
          updated_recent ?? "",
          created_after ?? "",
          created_before ?? "",
          updated_after ?? "",
          updated_before ?? ""
        ),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Response("Community not found", { status: 404 });
      } else {
        // REMIX TODO: Add sentry
        throw error;
      }
    }
  }
  throw new Response("Community not found", { status: 404 });
}

export async function clientLoader({ request, params }: LoaderFunctionArgs) {
  if (params.communityId) {
    try {
      const dapper = await getDapper(true);
      const searchParams = new URL(request.url).searchParams;
      const order = searchParams.get("order");
      const page = searchParams.get("page");
      const search = searchParams.get("search");
      const includedCategories = searchParams.get("includedCategories");
      const excludedCategories = searchParams.get("excludedCategories");
      const section = searchParams.get("section");
      const nsfw = searchParams.get("nsfw");
      const deprecated = searchParams.get("deprecated");
      const created_recent = searchParams.get("created_recent");
      const updated_recent = searchParams.get("updated_recent");
      const created_after = searchParams.get("created_after");
      const created_before = searchParams.get("created_before");
      const updated_after = searchParams.get("updated_after");
      const updated_before = searchParams.get("updated_before");
      return {
        community: await dapper.getCommunity(params.communityId),
        filters: await dapper.getCommunityFilters(params.communityId),
        listings: await dapper.getPackageListings(
          {
            kind: "community",
            communityId: params.communityId,
          },
          order ?? "",
          page === null ? undefined : Number(page),
          search ?? "",
          includedCategories?.split(",") ?? undefined,
          excludedCategories?.split(",") ?? undefined,
          section ?? "",
          nsfw === "true" ? true : false,
          deprecated === "true" ? true : false,
          created_recent ?? "",
          updated_recent ?? "",
          created_after ?? "",
          created_before ?? "",
          updated_after ?? "",
          updated_before ?? ""
        ),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Response("Community not found", { status: 404 });
      } else {
        // REMIX TODO: Add sentry
        throw error;
      }
    }
  }
  throw new Response("Community not found", { status: 404 });
}

export default function Community() {
  const { community, filters, listings } = useLoaderData<
    typeof loader | typeof clientLoader
  >();

  return (
    <>
      {community.background_image_url ? (
        <div
          className={styles.backgroundImg}
          style={{
            backgroundImage: `url(${community.background_image_url})`,
          }}
        />
      ) : null}
      <BreadCrumbs>
        <CyberstormLink linkId="Communities">Communities</CyberstormLink>
        <CyberstormLink linkId="Community" community={community.identifier}>
          {community.name}
        </CyberstormLink>
      </BreadCrumbs>
      <header className="project-root__page-header">
        <div className={styles.root}>
          <div className={styles.image}>
            <ImageWithFallback
              src={community.cover_image_url}
              type="community"
            />
          </div>
          <div className={styles.info}>
            <Title text={community.name} />
            {community.description ? (
              <CollapsibleText text={community.description} maxLength={85} />
            ) : null}
            <div className={styles.meta}>
              {[
                <MetaItem
                  key="meta-packages"
                  label={`${formatInteger(
                    community.total_package_count
                  )} packages`}
                  icon={<FontAwesomeIcon icon={faBoxOpen} />}
                  colorScheme="accent"
                  size="bold_large"
                />,
                <MetaItem
                  key="meta-downloads"
                  label={`${formatInteger(
                    community.total_download_count
                  )} downloads`}
                  icon={<FontAwesomeIcon icon={faDownload} />}
                  colorScheme="accent"
                  size="bold_large"
                />,
                community.discord_url ? (
                  <a key="meta-link" href="{community.discord_url}">
                    <Button.Root colorScheme="transparentPrimary">
                      <Button.ButtonIcon>
                        <FontAwesomeIcon icon={faDiscord} />
                      </Button.ButtonIcon>
                      <Button.ButtonLabel>
                        Join our community
                      </Button.ButtonLabel>
                      <Button.ButtonIcon>
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                      </Button.ButtonIcon>
                    </Button.Root>
                  </a>
                ) : null,
              ]}
            </div>
          </div>
        </div>
      </header>
      <main className="project-root__main">
        <PackageSearch
          listings={listings}
          packageCategories={filters.package_categories}
          sections={filters.sections}
        />
      </main>
    </>
  );
}
