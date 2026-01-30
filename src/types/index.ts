import { Database } from './database.types';

// Re-export database types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

// Specific types
export type Profile = Tables<'profiles'>;
export type Intent = Tables<'intents'>;
export type GalleryPhoto = Tables<'gallery_photos'>;
export type VerificationRequest = Tables<'verification_requests'>;
export type Connection = Tables<'connections'>;
export type ConnectionMember = Tables<'connection_members'>;
export type Message = Tables<'messages'>;
export type Report = Tables<'reports'>;

export type ProfileType = Enums<'profile_type'>;
export type VerificationStatus = Enums<'verification_status'>;
export type PhotoStatus = Enums<'photo_status'>;
export type ConnectionType = Enums<'connection_type'>;
export type ConnectionStatus = Enums<'connection_status'>;

// Extended types with relations
export type ProfileWithIntent = Profile & {
  active_intent: Intent | null;
};

export type ConnectionWithMembers = Connection & {
  connection_members: (ConnectionMember & {
    profile: Profile;
  })[];
};

export type MessageWithSender = Message & {
  sender: Profile;
};
