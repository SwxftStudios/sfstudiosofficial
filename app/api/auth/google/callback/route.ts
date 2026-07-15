import { handleGoogleCallback, toErrorResponse } from "../../../../../lib/backend";

export async function GET(request: Request) {
  try {
    return handleGoogleCallback(request);
  } catch (error) {
    return toErrorResponse(error);
  }
}
