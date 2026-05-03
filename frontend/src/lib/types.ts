export type User = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  providers?: string[];
};

export type AuthResponse = User & {
  token: string;
  refreshToken?: string | null;
};

export type AuthUser = User;

export type Conversation = {
  id: string;
  title: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CaptionRecord = {
  id: string;
  filename: string;
  content_type: string;
  prompt?: string | null;
  caption: string;
  thumbnail_data_url?: string | null;
  created_at?: string | null;
};

export type CaptionUploadResponse = {
  record: CaptionRecord;
  conversation: Conversation;
  records: CaptionRecord[];
};
