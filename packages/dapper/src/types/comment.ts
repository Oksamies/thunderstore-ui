export interface Comment {
  uuid: string;
  parent?: string | null;
  author_id?: number | null;
  body: string;
  is_internal: boolean;
  is_deleted: boolean;
  datetime_created: string;
  datetime_updated: string;
}
