import type { DapperInterface } from "@thunderstore/dapper";
import type { RequestConfig } from "@thunderstore/thunderstore-api";

import {
  createListingComment,
  deleteComment,
  getListingComments,
  reactToComment,
  restoreComment,
} from "./methods/comment";
import { getCommunities, getCommunity } from "./methods/communities";
import { getCommunityFilters } from "./methods/communityFilters";
import {
  getCurrentUser,
  getCurrentUserTeamPermissions,
} from "./methods/currentUser";
import { getDynamicHTML } from "./methods/dynamicHTML";
import {
  getModerationStats,
  getUserModeratedCommunities,
} from "./methods/moderation";
import {
  getPackageChangelog,
  getPackagePermissions,
  getPackageReadme,
  getPackageSource,
  getPackageSubmissionStatus,
  getPackageVersionDependencies,
  getPackageVersions,
  getPackageWiki,
  getPackageWikiPage,
  postPackageSubmissionMetadata,
} from "./methods/package";
import {
  getPackageListingDetails,
  getPackageListingStatus,
  getPackageListings,
} from "./methods/packageListings";
import { getPackageVersionDetails } from "./methods/packageVersion";
import { getRatedPackages } from "./methods/ratedPackages";
import {
  getTeamDetails,
  getTeamMembers,
  getTeamServiceAccounts,
  postTeamCreate,
} from "./methods/team";
import {
  createListingTicket,
  createTicketMessage,
  createTicketNote,
  getCommunityTickets,
  getListingTickets,
  getTicket,
  getTicketMessages,
  getTickets,
  updateTicketStatus,
} from "./methods/tickets";

export {
  getCommunities,
  getCommunity,
  getCommunityFilters,
  getCurrentUser,
  getCurrentUserTeamPermissions,
  getDynamicHTML,
  getPackageChangelog,
  getPackagePermissions,
  getPackageReadme,
  getPackageSource,
  getPackageSubmissionStatus,
  getPackageVersionDependencies,
  getPackageVersions,
  getPackageWiki,
  getPackageWikiPage,
  postPackageSubmissionMetadata,
  getPackageListingDetails,
  getPackageListingStatus,
  getPackageListings,
  getPackageVersionDetails,
  getRatedPackages,
  getTeamDetails,
  getTeamMembers,
  getTeamServiceAccounts,
  postTeamCreate,
  getTickets,
  getTicket,
  getTicketMessages,
  getListingTickets,
  createTicketMessage,
  createTicketNote,
  updateTicketStatus,
  createListingTicket,
  getCommunityTickets,
  deleteComment,
  restoreComment,
  getListingComments,
  createListingComment,
  getModerationStats,
  getUserModeratedCommunities,
};

export interface DapperTsInterface extends DapperInterface {
  config: () => RequestConfig;
  removeSessionHook?: () => void;
}

export class DapperTs implements DapperTsInterface {
  config: () => RequestConfig;
  removeSessionHook?: () => void;

  constructor(config: () => RequestConfig, removeSessionHook?: () => void) {
    this.config = config;
    this.removeSessionHook = removeSessionHook;
    this.getDynamicHTML = this.getDynamicHTML.bind(this);
    this.getCommunities = this.getCommunities.bind(this);
    this.getCommunity = this.getCommunity.bind(this);
    this.getCommunityFilters = this.getCommunityFilters.bind(this);
    this.getRatedPackages = this.getRatedPackages.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.getCurrentUserTeamPermissions =
      this.getCurrentUserTeamPermissions.bind(this);
    this.getPackageChangelog = this.getPackageChangelog.bind(this);
    this.getPackageListings = this.getPackageListings.bind(this);
    this.getPackageListingDetails = this.getPackageListingDetails.bind(this);
    this.getPackageListingStatus = this.getPackageListingStatus.bind(this);
    this.getPackageReadme = this.getPackageReadme.bind(this);
    this.getPackageVersionDetails = this.getPackageVersionDetails.bind(this);
    this.getPackageVersions = this.getPackageVersions.bind(this);
    this.getPackageVersionDependencies =
      this.getPackageVersionDependencies.bind(this);
    this.getPackageWiki = this.getPackageWiki.bind(this);
    this.getPackageWikiPage = this.getPackageWikiPage.bind(this);
    this.getPackagePermissions = this.getPackagePermissions.bind(this);
    this.getPackageSource = this.getPackageSource.bind(this);
    this.getTeamDetails = this.getTeamDetails.bind(this);
    this.getTeamMembers = this.getTeamMembers.bind(this);
    this.getTeamServiceAccounts = this.getTeamServiceAccounts.bind(this);
    this.postTeamCreate = this.postTeamCreate.bind(this);
    this.postPackageSubmissionMetadata =
      this.postPackageSubmissionMetadata.bind(this);
    this.getPackageSubmissionStatus =
      this.getPackageSubmissionStatus.bind(this);
    this.getTickets = this.getTickets.bind(this);
    this.getCommunityTickets = this.getCommunityTickets.bind(this);
    this.getTicket = this.getTicket.bind(this);
    this.getTicketMessages = this.getTicketMessages.bind(this);
    this.getListingTickets = this.getListingTickets.bind(this);
    this.createTicketMessage = this.createTicketMessage.bind(this);
    this.createTicketNote = this.createTicketNote.bind(this);
    this.updateTicketStatus = this.updateTicketStatus.bind(this);
    this.createListingTicket = this.createListingTicket.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
    this.restoreComment = this.restoreComment.bind(this);
    this.reactToComment = this.reactToComment.bind(this);
    this.getListingComments = this.getListingComments.bind(this);
    this.createListingComment = this.createListingComment.bind(this);
    this.getModerationStats = this.getModerationStats.bind(this);
    this.getUserModeratedCommunities =
      this.getUserModeratedCommunities.bind(this);
  }

  public getDynamicHTML = getDynamicHTML;
  public getCommunities = getCommunities;
  public getCommunity = getCommunity;
  public getCommunityFilters = getCommunityFilters;
  public getRatedPackages = getRatedPackages;
  public getCurrentUser = getCurrentUser;
  public getCurrentUserTeamPermissions = getCurrentUserTeamPermissions;
  public getPackageChangelog = getPackageChangelog;
  public getPackageListings = getPackageListings;
  public getPackageListingDetails = getPackageListingDetails;
  public getPackageListingStatus = getPackageListingStatus;
  public getPackageReadme = getPackageReadme;
  public getPackageVersions = getPackageVersions;
  public getPackageVersionDependencies = getPackageVersionDependencies;
  public getPackageVersionDetails = getPackageVersionDetails;
  public getPackageWiki = getPackageWiki;
  public getPackageWikiPage = getPackageWikiPage;
  public getPackagePermissions = getPackagePermissions;
  public getPackageSource = getPackageSource;
  public getTeamDetails = getTeamDetails;
  public getTeamMembers = getTeamMembers;
  public getTeamServiceAccounts = getTeamServiceAccounts;
  public postTeamCreate = postTeamCreate;
  public postPackageSubmissionMetadata = postPackageSubmissionMetadata;
  public getPackageSubmissionStatus = getPackageSubmissionStatus;
  public getTickets = getTickets;
  public getCommunityTickets = getCommunityTickets;
  public getTicket = getTicket;
  public getTicketMessages = getTicketMessages;
  public getListingTickets = getListingTickets;
  public createTicketMessage = createTicketMessage;
  public createTicketNote = createTicketNote;
  public updateTicketStatus = updateTicketStatus;
  public createListingTicket = createListingTicket;
  public deleteComment = deleteComment;
  public restoreComment = restoreComment;
  public reactToComment = reactToComment;
  public getModerationStats = getModerationStats;
  public getUserModeratedCommunities = getUserModeratedCommunities;
  public getListingComments = getListingComments;
  public createListingComment = createListingComment;
}
