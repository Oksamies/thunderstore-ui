export interface Comment {
  uuid: string;
  parent?: string | null;
  author: {
    username: string;
    avatar: string | null;
  };
  body: string;
  is_internal: boolean;
  is_deleted: boolean;
  datetime_created: string;
  datetime_updated: string;
  reactions?: Record<string, { count: number; user_reacted: boolean }>;
}
