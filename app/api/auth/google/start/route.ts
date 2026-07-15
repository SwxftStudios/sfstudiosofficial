import { createGoogleStartResponse, toErrorResponse } from "../../../../../lib/backend";

export async function GET(request: Request) {
  try {
    return createGoogleStartResponse(request);
  } catch (error) {
    return toErrorResponse(error);
  }
}
