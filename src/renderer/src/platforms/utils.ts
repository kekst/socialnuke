import { v4 } from "uuid";

import { Platform, PlatformResponse } from "./types";
import { sleep } from "../common";

export function defaultValues(platform: Platform) {
  const obj: any = {};
  for (const filter of platform.filters) {
    if (typeof filter.defaultValue !== "undefined") {
      obj[filter.key] = filter.defaultValue;
    }

    if (filter.type === "toggles" && filter.toggles) {
      for (const toggle of filter.toggles) {
        if (typeof toggle.defaultValue !== "undefined") {
          obj[toggle.key] = toggle.defaultValue;
        }
      }
    }
  }

  return obj;
}

export async function waitFor<T>(callback: () => Promise<PlatformResponse<T>>): Promise<T> {
  while (true) {
    const res = await callback();
    if (res.type === "action" && res.action.type === "wait") {
      await sleep(res.action.time);
    }

    if (res.type === "ok") {
      return res.result;
    }
  }
}
