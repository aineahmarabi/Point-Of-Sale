"use server";

import { clerkClient } from "@clerk/nextjs/server";

export interface InviteUserParams {
  email: string;
  firstName?: string;
  lastName?: string;
  roleName?: string;
  app?: ("admin" | "web")[];
}

export async function inviteClerkUser(params: InviteUserParams) {
  const client = await clerkClient();

  const publicMetadata: Record<string, unknown> = {
    app: params.app ?? ["admin"],
    status: "pending",
  };
  if (params.firstName) publicMetadata.first_name = params.firstName;
  if (params.lastName) publicMetadata.last_name = params.lastName;
  if (params.roleName) publicMetadata.role = params.roleName;

  const invitation = await client.invitations.createInvitation({
    emailAddress: params.email,
    publicMetadata,
    ignoreExisting: false,
  });

  return { invitationId: invitation.id };
}
