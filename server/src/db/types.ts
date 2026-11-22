// Row shapes. All times are ISO-8601 UTC strings; flags are nullable *_at strings.
export interface ContentSectionsTable {
  key: string;
  data: string; // JSON text
  version: number;
  updated_at: string;
  updated_by: string | null;
}
export interface MediaTable {
  id: string;
  filename: string;
  original_name: string;
  mime: string;
  width: number;
  height: number;
  alt: string;
  created_at: string;
  created_by: string | null;
  deleted_at: string | null;
}
export interface UsersTable {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  last_login_at: string | null;
  disabled_at: string | null;
}
export interface SessionsTable {
  id: string; // sha256 of the cookie token
  user_id: string;
  expires_at: string;
  ip: string;
  user_agent: string;
}
export interface AuditLogTable {
  id: string;
  at: string;
  user_id: string | null;
  user_email: string;
  action: string;
  target_type: string;
  target_key: string;
  before: string | null;
  after: string | null;
  ip: string;
}
export interface DB {
  content_sections: ContentSectionsTable;
  media: MediaTable;
  users: UsersTable;
  sessions: SessionsTable;
  audit_log: AuditLogTable;
}
