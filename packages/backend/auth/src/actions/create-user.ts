"use server";

import { clerkClient } from "@clerk/nextjs/server";

export interface CreateUserParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  app: string;
  status: string;
  roleName?: string;
}

export async function createClerkUser(params: CreateUserParams) {
  const client = await clerkClient();

  const user = await client.users.createUser({
    firstName: params.firstName,
    lastName: params.lastName,
    emailAddress: [params.email],
    password: params.password,
    publicMetadata: {
      app: params.app,
      status: params.status,
      ...(params.roleName ? { role: params.roleName } : {}),
    },
  });

  return { clerkId: user.id };
}
