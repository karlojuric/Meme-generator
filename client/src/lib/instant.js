import { init } from "@instantdb/react";

const DEFAULT_APP_ID = "fd521099-3f8e-4a27-8fda-277abbf04120";

export const APP_ID =
  import.meta.env.VITE_INSTANT_APP_ID?.trim() || DEFAULT_APP_ID;

export const db = init({
  appId: APP_ID,
});
