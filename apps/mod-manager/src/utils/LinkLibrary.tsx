import React, { forwardRef } from "react";
import { Link as RouterLink } from "react-router-dom";

import { LinkLibrary, thunderstoreLinkProps } from "@thunderstore/cyberstorm";

type AnyProps = any;
type PackageVersionProps = any;

/*
  Helper to create a link component that forwards refs correctly
  and handles the "to" prop for react-router-dom.
*/
const createLink = (getPath: (props: any) => string) => {
  return forwardRef<HTMLAnchorElement, AnyProps>((props, ref) => {
    // Extract unknown props to pass them down, and strip known "link logic" props
    // based on thunderstoreLinkProps keys, to avoid React warnings on DOM elements.
    const {
      className,
      children,
      community,
      namespace,
      package: pkg,
      version,
      team,
      user,
      wikipageslug,
      queryParams,
      ...rest
    } = props;

    // We purposely don't pass '...rest' to RouterLink if they are custom props from
    // CyberstormLink that RouterLink/anchor doesn't support.
    // Ideally we should filter further if needed.

    return (
      <RouterLink to={getPath(props)} className={className} ref={ref} {...rest}>
        {children}
      </RouterLink>
    );
  }) as any;
};

const noop = () => null;

/**
 * Custom LinkLibrary for the Mod Manager.
 * Maps Cyberstorm semantic links to the application's React Router routes.
 */
export const linkLibrary: LinkLibrary = {
  Anonymous: (props) => (
    <a
      href={props.url}
      className={props.className}
      target="_blank"
      rel="noreferrer"
    >
      {props.children}
    </a>
  ),

  Communities: createLink(() => "/"),

  Community: createLink((props) => `/c/${props.community}`),

  CommunityPackages: createLink((props) => `/c/${props.community}/packages`),

  Index: createLink(() => "/"),

  ManifestValidator: noop,

  MarkdownPreview: noop,

  // Package Details: /c/:community/p/:namespace/:package
  Package: createLink(
    (props) => `/c/${props.community}/p/${props.namespace}/${props.package}`
  ),

  PackageEdit: noop,
  PackageRequired: noop,
  PackageWiki: noop,
  PackageWikiNewPage: noop,
  PackageWikiPage: noop,
  PackageWikiPageEdit: noop,
  PackageChangelog: noop,
  PackageVersions: noop,
  PackageSource: noop,
  PackageDependants: noop,
  PackageFormatDocs: noop,

  PackageVersion: createLink(
    (props: PackageVersionProps) =>
      `/c/${props.community}/p/${props.namespace}/${props.package}/v/${props.version}`
  ),

  PackageVersionRequired: noop,
  PackageVersionVersions: noop,
  PackageVersionWithoutCommunity: noop,
  PackageVersionWithoutCommunityRequired: noop,
  PackageVersionWithoutCommunityVersions: noop,
  PackageUpload: noop,
  PrivacyPolicy: noop,
  Settings: createLink(() => "/manager/settings"),
  SettingsAccount: noop,

  Team: createLink((props) => `/c/${props.community}/t/${props.team}`),

  Teams: noop,
  TeamSettings: noop,
  TeamSettingsMembers: noop,
  TeamSettingsServiceAccounts: noop,
  TeamSettingsSettings: noop,
  TermsOfService: noop,
  User: noop,
};
