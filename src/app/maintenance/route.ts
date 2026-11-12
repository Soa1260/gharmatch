import { maintenancePageResponse } from "@/lib/maintenancePage";

export const dynamic = "force-dynamic";

/** Every page address is rewritten here while MAINTENANCE_MODE=1 (see next.config.ts and docs/MAINTENANCE.md). */
const respond = () => maintenancePageResponse();

export const GET = respond;
export const HEAD = respond;
export const POST = respond;
export const PUT = respond;
export const PATCH = respond;
export const DELETE = respond;
