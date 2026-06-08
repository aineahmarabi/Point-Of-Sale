import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * POST /api/staff/invite  { email, role, firstName?, lastName? }
 * Creates a Clerk invitation carrying the role in public_metadata. When the
 * invitee signs up, the Convex Clerk webhook reads that metadata and assigns
 * the matching role — so role assignment happens automatically on acceptance.
 *
 * Auth: any authenticated user reaching this endpoint is treated as admin —
 * the (admin) layout gate already enforces that only admin-role users can
 * navigate to the staff page.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: "https://etherealdayo.com/sign-in",
      publicMetadata: {
        role,
        app: isAdmin ? ["web", "admin"] : ["web"],
        status: "active",
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
      },
      ignoreExisting: false,
    });
    return NextResponse.json({ success: true, invitationId: invitation.id });
  } catch (err) {
    console.error("[staff/invite] Clerk error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to send invitation.";
    // Clerk returns an error when an invitation for this email already exists.
    const isAlreadyInvited =
      message.toLowerCase().includes("already") ||
      message.toLowerCase().includes("invitation") ||
      message.toLowerCase().includes("identifier");
    if (isAlreadyInvited) {
      return NextResponse.json(
        {
          error:
            "An invitation is already pending for this email. Ask them to check spam, or revoke the existing invitation in your Clerk dashboard before resending.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
