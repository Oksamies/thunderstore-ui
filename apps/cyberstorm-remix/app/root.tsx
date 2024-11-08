import "./styles/index.css";
import "@thunderstore/cyberstorm-styles";
import "@thunderstore/cyberstorm-theme";
import {
  Links,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useLocation,
  useRouteError,
} from "@remix-run/react";
// import { LinksFunction } from "@remix-run/react/dist/routeModules";
import { Provider as RadixTooltip } from "@radix-ui/react-tooltip";

import {
  MobileNavigationMenu,
  MobileUserPopoverContent,
  Navigation,
} from "cyberstorm/navigation/Navigation";
import { LinkLibrary } from "cyberstorm/utils/LinkLibrary";
import { AdContainer, LinkingProvider } from "@thunderstore/cyberstorm";
import { DapperTs } from "@thunderstore/dapper-ts";
// import { CurrentUser } from "@thunderstore/dapper/types";
// import { getDapper } from "cyberstorm/dapper/sessionUtils";

import { captureRemixErrorBoundaryError, withSentry } from "@sentry/remix";
import {
  getPublicEnvVariables,
  publicEnvVariables,
} from "cyberstorm/security/publicEnvVariables";
import { useEffect, useRef, useState } from "react";
import { useHydrated } from "remix-utils/use-hydrated";
import Toast from "@thunderstore/cyberstorm/src/components/Toast";
import { SessionProvider } from "@thunderstore/ts-api-react";
import { CurrentUser } from "@thunderstore/dapper/types";
import { Footer } from "./commonComponents/Footer/Footer";
// Disabled until we have "rated_packages_cyberstorm" available in the currentUser django endpoint
// import { getDapper } from "cyberstorm/dapper/sessionUtils";

// REMIX TODO: https://remix.run/docs/en/main/route/links
// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

declare global {
  interface Window {
    ENV: publicEnvVariables;
    Dapper: DapperTs;
    nitroAds?: {
      createAd: (
        containerId: string,
        params: {
          demo: boolean;
          format: string;
          refreshLimit: number;
          refreshTime: number;
          renderVisibleOnly: boolean;
          refreshVisibleOnly: boolean;
          sizes: string[][];
          report: {
            enabled: boolean;
            wording: string;
            position: string;
          };
          mediaQuery: string;
        }
      ) => void;
    };
  }
}

export const meta: MetaFunction = () => {
  return [
    { title: "Thunderstore" },
    {
      name: "description",
      content: "Thunderstore, the place to be. And to find mods!",
    },
  ];
};

export async function loader() {
  // const dapper = await getDapper();

  return {
    envStuff: {
      ENV: getPublicEnvVariables([
        "PUBLIC_API_URL",
        "PUBLIC_CLIENT_SENTRY_DSN",
        "PUBLIC_SITE_URL",
      ]),
    },
  };
}

// export async function clientLoader() {
//   const dapper = await getDapper(true);

//   return {
//     envStuff: {
//       ENV: getPublicEnvVariables([
//         "PUBLIC_API_URL",
//         "PUBLIC_CLIENT_SENTRY_DSN",
//         "PUBLIC_SITE_URL",
//       ]),
//     },
//     currentUser: await dapper.getCurrentUser(),
//   };
// }

export function shouldRevalidate() {
  return false;
}

const adContainerIds = ["right-column-1", "right-column-2", "right-column-3"];

function Root() {
  const loaderOutput = useLoaderData<typeof loader>();
  const parsedLoaderOutput: {
    envStuff: {
      ENV: publicEnvVariables;
    };
  } = JSON.parse(JSON.stringify(loaderOutput));

  const location = useLocation();
  const shouldShowAds = location.pathname.startsWith("/teams")
    ? false
    : location.pathname.startsWith("/settings")
    ? false
    : location.pathname.startsWith("/package/create")
    ? false
    : location.pathname.startsWith("/tools")
    ? false
    : true;

  const isHydrated = useHydrated();
  const startsHydrated = useRef(isHydrated);
  // Disabled until we have "rated_packages_cyberstorm" available in the currentUser django endpoint
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentUser, setCurrentUser] = useState<CurrentUser>();

  // Disabled until we have "rated_packages_cyberstorm" available in the currentUser django endpoint
  // useEffect(() => {
  //   if (!startsHydrated.current && isHydrated) return;
  //   const fetchAndSetUser = async () => {
  //     const dapper = await getDapper(true);
  //     const fetchedUser = await dapper.getCurrentUser();
  //     if (fetchedUser?.username) {
  //       setCurrentUser(fetchedUser);
  //     }
  //   };
  //   fetchAndSetUser();
  // }, []);

  return (
    <html lang="en">
      <head>
        <meta name="msapplication-TileColor" content="#29295b" />
        <meta name="theme-color" content="#29295b" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#23ffb0" />
        <Links />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(
              parsedLoaderOutput.envStuff.ENV
            )}`,
          }}
        />
        <SessionProvider
          domain={parsedLoaderOutput.envStuff.ENV.PUBLIC_API_URL}
        >
          <LinkingProvider value={LinkLibrary}>
            <Toast.Provider toastDuration={10000}>
              <RadixTooltip delayDuration={300}>
                <div className="project-root">
                  {/* REMIX TODO: For whatever reason the Navigation seems to cause suspense boundary errors. Couldn't find a reason why */}
                  <Navigation
                    hydrationCheck={!startsHydrated.current && isHydrated}
                    currentUser={currentUser}
                  />
                  <MobileNavigationMenu />
                  {!startsHydrated.current && isHydrated && currentUser ? (
                    <MobileUserPopoverContent user={currentUser} />
                  ) : (
                    <MobileUserPopoverContent />
                  )}
                  <section className="project-root__content">
                    <div className="project-root__side-containers" />
                    <div className="project-root__middle-container">
                      <Outlet />
                    </div>
                    <div className="project-root__side-containers">
                      {shouldShowAds
                        ? adContainerIds.map((cid, k_i) => (
                            <AdContainer key={k_i} containerId={cid} />
                          ))
                        : null}
                    </div>
                  </section>
                  <Footer />
                </div>
              </RadixTooltip>
            </Toast.Provider>
          </LinkingProvider>
        </SessionProvider>
        <ScrollRestoration />
        <Scripts />
        {shouldShowAds ? <AdsInit /> : null}
      </body>
    </html>
  );
}

// REMIX TODO: We don't have any data available in the root ErrorBoundary, so we might want to change the designs
export function ErrorBoundary() {
  // REMIX TODO: We need to call the loader separately somehow to get the CurrentUser
  // const loaderOutput = useLoaderData<typeof loader | typeof clientLoader>();
  // const parsedLoaderOutput: {
  //   envStuff: { ENV: { PUBLIC_API_URL: string } };
  //   sessionId: string | null;
  //   currentUser: CurrentUser;
  // } = JSON.parse(JSON.stringify(loaderOutput));
  const error = useRouteError();
  if (process.env.NODE_ENV === "production") {
    captureRemixErrorBoundaryError(error);
  } else if (process.env.NODE_ENV === "development") {
    console.log(error);
  }
  const isResponseError = isRouteErrorResponse(error);
  return (
    <html lang="en">
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
      </head>
      <body>
        {/* <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${process.env.PUBLIC_API_URL}`,
          }}
        /> */}
        <Scripts />
        <LinkingProvider value={LinkLibrary}>
          <Toast.Provider toastDuration={10000}>
            <RadixTooltip delayDuration={300}>
              <div className="project-root">
                {/* <Navigation user={getEmptyUser} /> */}
                <section className="project-root__content">
                  <div className="project-root__side-containers" />
                  <div className="project-root__middle-container">
                    <div className="project-error">
                      <div
                        className="project-error__glitch"
                        data-text={isResponseError ? error.status : 500}
                      >
                        <span>{isResponseError ? error.status : 500}</span>
                      </div>
                      <div className="project-error__description">
                        {isResponseError ? error.data : "Internal server error"}
                      </div>
                      {!isResponseError && (
                        <div className="project-error__flavor">
                          Beep boop. Server something error happens.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="project-root__side-containers"></div>
                </section>
                <Footer />
              </div>
            </RadixTooltip>
          </Toast.Provider>
        </LinkingProvider>
      </body>
    </html>
  );
}

export default withSentry(Root);

// Temporary solution for implementing ads
// REMIX TODO: Move to dynamic html
function AdsInit() {
  const isHydrated = useHydrated();
  const startsHydrated = useRef(isHydrated);

  // This will be loaded 2 times in development because of:
  // https://react.dev/reference/react/StrictMode
  // If strict mode is removed from the entry.client.tsx, this should only run once
  useEffect(() => {
    if (!startsHydrated.current && isHydrated) return;
    if (
      typeof window !== "undefined" &&
      typeof window.nitroAds === "undefined"
    ) {
      const $script = document.createElement("script");
      $script.src = "https://s.nitropay.com/ads-785.js";
      $script.setAttribute("async", "true");

      document.body.append($script);

      return () => $script.remove();
    }
  }, []);

  const nitroAds = typeof window !== "undefined" ? window.nitroAds : undefined;
  useEffect(() => {
    if (nitroAds !== undefined && nitroAds.createAd !== undefined) {
      adContainerIds.forEach((cid) => {
        if (nitroAds !== undefined && nitroAds.createAd !== undefined) {
          nitroAds.createAd(cid, {
            demo: false,
            format: "display",
            refreshLimit: 0,
            refreshTime: 30,
            renderVisibleOnly: true,
            refreshVisibleOnly: true,
            sizes: [["300", "250"]],
            report: {
              enabled: true,
              wording: "Report Ad",
              position: "bottom-right",
            },
            mediaQuery: "(min-width: 1475px) and (min-height: 400px)",
          });
        }
      });
    }
  }, [nitroAds]);

  return <></>;
}
