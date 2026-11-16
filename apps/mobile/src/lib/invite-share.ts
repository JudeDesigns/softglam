import { Share } from 'react-native';
import * as Linking from 'expo-linking';

/** Deep link that opens the app on the "join" screen with the code filled in. */
export function inviteLink(code: string): string {
  return Linking.createURL(`join/${code}`);
}

/**
 * Opens the phone's share sheet (WhatsApp, Messages, Mail, …) with the invite.
 * Returns false if the artist dismissed it without sharing.
 */
export async function shareInvite(params: {
  code: string;
  clientName: string;
  artistName?: string;
  message?: string;
}): Promise<boolean> {
  const { code, clientName, artistName, message } = params;
  const lines = [
    `Hi ${clientName}! ${artistName ? `${artistName} has` : "I've"} invited you to SoftGlow, where you can try looks on your own photo and send them to me before your appointment.`,
    message?.trim() || null,
    `Open the invite: ${inviteLink(code)}`,
    `Or enter code ${code} in the app (Me → Have an invite code?).`,
  ].filter(Boolean);
  const result = await Share.share({ message: lines.join('\n\n') });
  return result.action !== Share.dismissedAction;
}
