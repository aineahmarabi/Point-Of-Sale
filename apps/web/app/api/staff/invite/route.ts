import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * POST /api/staff/invite  { email, role }
 * Creates a Clerk invitation carrying the role in public_metadata. When the
 * invitee signs up, the Convex Clerk webhook reads that metadata and assigns
 * the matching role — so role assignment happens automatically on acceptance.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify caller is an admin via their Clerk public metadata.
  const client = await clerkClient();
  const caller = await client.users.getUser(userId);
  const meta = (caller.publicMetadata ?? {}) as { role?: string; app?: string[] };
  const roleStr = (meta.role ?? "").toLowerCase();
  const callerIsAdmin =
    roleStr.includes("admin") ||
    (Array.isArray(meta.app) && meta.app.includes("admin"));
  if (!callerIsAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    email?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim();
  const role = body.role?.trim();
  if (!email || !role) {
    return NextResponse.json(
      { error: "Both email and role are required." },
      { status: 400 },
    );
  }

  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const isAdmin = role.toLowerCase().includes("admin");

  try {
    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        role,
        app: isAdmin ? ["web", "admin"] : ["web"],
        status: "active",
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
      },
      ignoreExisting: true,
    });
    return NextResponse.json({ success: true, invitationId: invitation.id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send invitation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
