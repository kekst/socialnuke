import { makeAutoObservable } from "mobx";
import React, { createContext, useContext } from "react";
import { sleep } from "./common";
import { platforms } from "./platforms";
import { PlatformItem, PlatformResponse, QueryGenerator } from "./platforms/types";
import { defaultValues } from "./platforms/utils";
import { v4 } from "uuid";

interface Account {
  id: string;
  name: string;
  iconUrl?: string;
  platform: string;
  token: string;
  refreshed: number;
}

export interface Task {
  id: string;
  type: "purge" | "dump";
  generator: QueryGenerator;
  platform: string;
  userName: string;
  iconUrl?: string;
  description: string;
  current?: number;
  total?: number;
  state: "progress" | "preparing" | "queued" | "cancelled";
}

export type Severity = "error" | "info" | "warning";

export interface Toast {
  id: string;
  severity: Severity;
  label: string;
}

export class Store {
  accounts: Account[] = [];
  toasts: Toast[] = [];
  queue: Task[] = [];
  platformState: Record<keyof typeof platforms, { filters: any; accountId?: string }> =
    Object.fromEntries(
      Object.entries(platforms).map(([key, platform]) => [
        key,
        { filters: defaultValues(platform) }
      ])
    );
  paused = false;
  turbo = true;

  constructor() {
    makeAutoObservable(this);
    this.accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    this.openLogin = this.openLogin.bind(this);
    this.refreshAccounts = this.refreshAccounts.bind(this);
    this.cancelTask = this.cancelTask.bind(this);
    this.cancelAll = this.cancelAll.bind(this);
    this.togglePause = this.togglePause.bind(this);
  }

  togglePause() {
    this.paused = !this.paused;
  }

  toast(severity: Severity, label: string) {
    this.toasts.push({ id: v4(), severity, label });
  }

  dismissToast(id: string) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  async addByToken(platformKey: string, token: string) {
    try {
      const platform = platforms[platformKey];
      if (!token) {
        this.toast("error", "Invalid token");
        return;
      }

      const { user } = await platform.withToken(token);
      if (!user) {
        this.toast("error", "Invalid token");
        return;
      }

      const already = this.accounts.find(
        (acc) => acc.id === user.id && acc.platform === platform.key
      );
      if (already) {
        already.name = user.name;
        already.refreshed = new Date().getTime();
        already.iconUrl = user.iconUrl;
        already.token = token;
        this.accounts = [...this.accounts];
      } else {
        this.accounts = [
          ...this.accounts,
          {
            ...user,
            platform: platform.key,
            refreshed: new Date().getTime(),
            token
          }
        ];
      }
      this.onAccountsUpdated();
    } catch {
      this.toast("error", "Unknown error");
    }
  }

  async openLogin(platformKey: string) {
    try {
      const platform = platforms[platformKey];
      const token = await platform.tokenFlow();
      await this.addByToken(platformKey, token);
    } catch {
      this.toast("error", "Unknown error");
    }
  }

  async refreshAccounts() {
    for (const acc of this.accounts) {
      while (true) {
        try {
          const platform = platforms[acc.platform];
          const { user } = await platform.withToken(acc.token);

          acc.name = user.name;
          acc.refreshed = new Date().getTime();
          acc.iconUrl = user.iconUrl;
        } catch (e: any) {
          this.removeAccount(acc.platform, acc.id);
        }

        await sleep(200);
      }
    }

    this.onAccountsUpdated();
  }

  async addTask(task: Task) {
    this.queue.push(task);
    this.runQueue();
  }

  removeAccount(platform: string, id: string) {
    this.accounts = this.accounts.filter((acc) => acc.platform !== platform || acc.id !== id);

    this.onAccountsUpdated();
  }

  onAccountsUpdated() {
    localStorage.setItem("accounts", JSON.stringify(this.accounts));
  }

  private async runQueuePlatform(
    callback: (item: PlatformItem) => Promise<PlatformResponse<boolean>>
  ) {
    if (!this.queue[0]) return;
    const first = this.queue[0];
    if (first.state !== "preparing") return;
    const { generator } = first;

    this.queue[0].current = 0;
    this.queue[0].state = "progress";

    const defaultDelay = 100;
    let throttledDelay = defaultDelay;
    let throttledMessages = 0;

    for await (const item of generator) {
      while (this.paused) {
        await sleep(100);
      }

      const first = this.queue[0];
      if (first.state === "cancelled") return;

      if (item.type === "ok") {
        try {
          while (true) {
            const res = await callback(item.result);
            if (res.type === "action" && res.action.type === "wait") {
              await sleep(res.action.time);

              if (res.action.time > throttledDelay) {
                throttledDelay = defaultDelay + res.action.time;
                console.log("updated delay to", throttledDelay);
              }
              throttledMessages = 50;
            }

            if (res.type === "ok") {
              break;
            }
          }
        } catch {
          //
        }
      } else if (item.type === "action") {
        if (item.action.type === "wait") {
          await sleep(item.action.time);
          continue;
        }
      }

      if (throttledMessages === 0) {
        throttledDelay = defaultDelay;
      } else {
        throttledMessages--;
      }

      //todo update remaining
      this.queue[0].current += 1;
      await sleep(throttledDelay + (!this.turbo ? 1000 : 0));
    }

    this.queue.shift();
  }

  private async runQueuePurge() {
    await this.runQueuePlatform(async (item) => item.delete());
  }

  async runQueue() {
    if (!this.queue[0]) return;
    const task = this.queue[0];
    if (task.state !== "queued") return;

    task.state = "preparing";

    switch (task.type) {
      case "purge":
        await this.runQueuePurge();
        break;
      default:
        this.queue.shift();
    }

    while (true) {
      const task = this.queue[0];
      if (!task) {
        return;
      }

      if (task?.state !== "queued") {
        this.queue.shift();
      } else {
        break;
      }
    }

    this.runQueue();
  }

  cancelTask(id: string) {
    for (const task of this.queue) {
      if (task.id === id) {
        if (task.state === "queued") {
          this.queue = this.queue.filter((t) => task.id !== t.id);
          return;
        }

        task.state = "cancelled";
      }
    }
  }

  cancelAll() {
    this.queue = this.queue.filter((task) => task.state !== "queued");
    for (const task of this.queue) {
      task.state = "cancelled";
    }
  }
}

function useClassStore(init: any) {
  const [store] = React.useState(init);
  return store;
}

export const store = new Store();

export const StoreContext = createContext<Store | undefined>(undefined);
export const StoreProvider = ({ children }: { children: any }) => {
  const value = useClassStore(() => store);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): Store => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore must be used within a StoreProvider.");
  }
  return store;
};
