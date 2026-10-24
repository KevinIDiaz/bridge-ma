"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_SESSION, session, type SessionState } from "@/lib/session/store";

/**
 * Subscribes to the module-level session store. The server snapshot is always
 * EMPTY_SESSION, so the first client render matches the server and there is no
 * hydration mismatch. Client writes re-render subscribed components.
 */
export function useSession(): SessionState {
  return useSyncExternalStore(session.subscribe, session.get, getServerSnapshot);
}

function getServerSnapshot(): SessionState {
  return EMPTY_SESSION;
}
