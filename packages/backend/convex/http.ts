import { httpRouter } from "convex/server";
import { clerkWebhook } from "./user/clerk";

const http = httpRouter();
const api_v1 = "/api";

// Existing path (kept for backwards compatibility).
http.route({
  method: "POST",
  path: `${api_v1}/user`,
  handler: clerkWebhook,
});

// Conventional alias — point the Clerk webhook endpoint here.
http.route({
  method: "POST",
  path: "/clerk-webhook",
  handler: clerkWebhook,
});

export default http;
