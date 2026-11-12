import { maintenanceJsonResponse } from "@/lib/maintenancePage";

export const dynamic = "force-dynamic";

/** Every /api address except the health check and the daily job is rewritten here while MAINTENANCE_MODE=1. */
const respond = () => maintenanceJsonResponse();

export const GET = respond;
export const HEAD = respond;
export const POST = respond;
export const PUT = respond;
export const PATCH = respond;
export const DELETE = respond;
