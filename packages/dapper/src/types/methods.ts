import { type Comment } from "./comment";
import {
  type Communities,
  type Community,
  type CommunityFilters,
} from "./community";
import {
  type PackageListingDetails,
  type PackageListings,
  type PackagePermissions,
  type PackageSource,
  type PackageSubmissionResponse,
  type PackageVersion,
  type PackageVersionDependencies,
} from "./package";
import { type PackageListingType } from "./props";
import { type HTMLContentResponse, type MarkdownResponse } from "./shared";
import { type ServiceAccount, type TeamDetails, type TeamMember } from "./team";
import {
  type Ticket,
  type TicketCreateDTO,
  type TicketMessage,
  type TicketNote,
  type TicketStatusDTO,
} from "./tickets";
import { type CurrentUser, type CurrentUserTeamPermissions } from "./user";

export type GetCommunities = (
  page?: number,
  ordering?: string,
  search?: string
) => Promise<Communities>;

export type GetCommunity = (communityId: string) => Promise<Community>;

export type GetCommunityFilters = (
  communityId: string
) => Promise<CommunityFilters>;

export type GetCurrentUser = () => Promise<null | CurrentUser>;

export type GetCurrentUserTeamPermissions = (
  teamName: string
) => Promise<CurrentUserTeamPermissions>;

export type GetPackageChangelog = (
  namespace: string,
  name: string,
  version?: string
) => Promise<HTMLContentResponse>;

export type GetPackageListingDetails = (
  community: string,
  namespace: string,
  name: string,
  version?: string
) => Promise<PackageListingDetails>;

export type GetPackageListings = (
  type: PackageListingType,
  ordering?: string,
  page?: number,
  q?: string,
  includedCategories?: string[],
  excludedCategories?: string[],
  section?: string,
  nsfw?: boolean,
  deprecated?: boolean
) => Promise<PackageListings>;

export type GetPackageReadme = (
  namespace: string,
  name: string,
  version?: string
) => Promise<MarkdownResponse>;

export type GetPackageVersions = (
  namespace: string,
  name: string
) => Promise<PackageVersion[]>;

export type GetPackageVersionDependencies = (
  namespace: string,
  name: string,
  version: string,
  page?: number
) => Promise<PackageVersionDependencies>;

export type GetPackagePermissions = (
  namespaceId: string,
  communityId: string,
  packageName: string
) => Promise<PackagePermissions | undefined>;

export type GetPackageSource = (
  namespace: string,
  name: string,
  version?: string
) => Promise<PackageSource>;

export type PostPackageSubmissionMetadata = (
  author_name: string,
  communities: string[],
  has_nsfw_content: boolean,
  upload_uuid: string,
  categories?: string[],
  community_categories?: { [key: string]: string[] }
) => Promise<PackageSubmissionResponse>;

export type GetTeamDetails = (teamName: string) => Promise<TeamDetails>;

export type GetTeamMembers = (teamId: string) => Promise<TeamMember[]>;

export type GetTeamServiceAccounts = (
  teamName: string
) => Promise<ServiceAccount[]>;

export type GetPackageSubmissionStatus = (
  submissionId: string
) => Promise<PackageSubmissionResponse>;

export type PostTeamCreate = (name: string) => Promise<TeamDetails>;

export type GetTickets = () => Promise<Ticket[]>;

export type GetTicket = (uuid: string) => Promise<Ticket>;

export type CreateTicketMessage = (
  uuid: string,
  data: TicketCreateDTO
) => Promise<TicketMessage>;

export type CreateTicketNote = (
  uuid: string,
  data: TicketCreateDTO
) => Promise<TicketNote>;

export type UpdateTicketStatus = (
  uuid: string,
  data: TicketStatusDTO
) => Promise<Ticket>;

export type GetListingTickets = (
  community: string,
  namespace: string,
  name: string
) => Promise<Ticket[]>;

export type CreateListingTicket = (
  community: string,
  namespace: string,
  name: string,
  data: TicketCreateDTO
) => Promise<Ticket>;

export type DeleteComment = (uuid: string) => Promise<void>;

export type RestoreComment = (uuid: string) => Promise<void>;

export type GetListingComments = (
  community: string,
  namespace: string,
  name: string
) => Promise<Comment[]>;
