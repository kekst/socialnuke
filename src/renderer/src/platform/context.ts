import React from "react";

import { Platform, PlatformTarget } from "../platforms/types";

export interface PlatformContextValue {
  setFilter(key: string, value: any): void;
  filters: any;
  setAccountId(id: string): void;
  accountId?: string;
  setTarget(target?: PlatformTarget): void;
  target?: PlatformTarget;
  platform: Platform;
}

export const PlatformContext = React.createContext<PlatformContextValue>(undefined as any);

export const usePlatform = () => React.useContext(PlatformContext);
