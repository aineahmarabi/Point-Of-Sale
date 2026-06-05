"use server";

import { clerkClient } from "@clerk/nextjs/server";

export interface UpdateUserParams {
  clerkId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  userType?: string;
  status?: string;
  app?: string[];
  roleName?: string;
}

export async function updateClerkUser(params: UpdateUserParams) {
  const client = await clerkClient();

  const publicMetadata: Record<string, unknown> = {};
  if (params.phone !== undefined) publicMetadata.phone = params.phone;
  if (params.userType !== undefined) publicMetadata.user_type = params.userType;
  if (params.status !== undefined) publicMetadata.status = params.status;
  if (params.app !== undefined) publicMetadata.app = params.app;
  if (params.roleName !== undefined) publicMetadata.role = params.roleName;

  const user = await client.users.updateUser(params.clerkId, {
    ...(params.firstName !== undefined && { firstName: params.firstName }),
    ...(params.lastName !== undefined && { lastName: params.lastName }),
    publicMetadata,
  });

  return { clerkId: user.id };
}
