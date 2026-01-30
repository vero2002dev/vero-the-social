import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ConnectionType = Database['public']['Enums']['connection_type'];
type ProfileType = Database['public']['Enums']['profile_type'];

/**
 * Check if two profiles are compatible based on:
 * - Profile types (single/couple)
 * - Accepted dynamics
 * - Active intents (for MVP, just check both have intents)
 */
export function areProfilesCompatible(
  profile1: Profile,
  profile2: Profile
): { compatible: boolean; connectionType?: ConnectionType } {
  // Both must be verified
  if (
    profile1.verification_status !== 'verified' ||
    profile2.verification_status !== 'verified'
  ) {
    return { compatible: false };
  }

  // Both must have active intents
  if (!profile1.active_intent_id || !profile2.active_intent_id) {
    return { compatible: false };
  }

  const p1Type = profile1.profile_type;
  const p2Type = profile2.profile_type;

  // Determine connection type
  let connectionType: ConnectionType | undefined;

  // 1→1: single + single
  if (p1Type === 'single' && p2Type === 'single') {
    connectionType = 'one_to_one';
  }

  // 2→1: couple + single
  if (p1Type === 'couple' && p2Type === 'single') {
    connectionType = 'two_to_one';
  }

  // 1→2: single + couple
  if (p1Type === 'single' && p2Type === 'couple') {
    connectionType = 'one_to_two';
  }

  // If no connection type matched, not compatible
  if (!connectionType) {
    return { compatible: false };
  }

  // Check if both profiles accept this dynamic
  const p1Dynamics = profile1.accepted_dynamics as string[];
  const p2Dynamics = profile2.accepted_dynamics as string[];

  const p1Accepts = p1Dynamics.includes(connectionType);
  const p2Accepts = p2Dynamics.includes(connectionType);

  if (!p1Accepts || !p2Accepts) {
    return { compatible: false };
  }

  return { compatible: true, connectionType };
}

/**
 * Get display name for a profile
 */
export function getProfileDisplayName(profile: Profile): string {
  if (profile.profile_type === 'single') {
    return profile.display_name || 'Unknown';
  }
  return profile.couple_name || 'Unknown Couple';
}

/**
 * Get connection type label
 */
export function getConnectionTypeLabel(type: ConnectionType): string {
  const labels: Record<ConnectionType, string> = {
    one_to_one: '1→1',
    two_to_one: '2→1',
    one_to_two: '1→2',
    group: 'Group',
  };
  return labels[type] || type;
}

/**
 * Get profile type icon
 */
export function getProfileTypeIcon(type: ProfileType): string {
  return type === 'single' ? 'user' : 'users';
}
