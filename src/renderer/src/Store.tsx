import { makeAutoObservable } from "mobx";
import React, { createContext, useContext } from "react";
import { sleep } from "./common";
import { platforms } from "./platforms";
import { PlatformItem, QueryGenerator } from "./platforms/types";
import { waitFor } from "./platforms/utils";
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

  constructor() {
    makeAutoObservable(this);
    this.accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    this.openLogin = this.openLogin.bind(this);
    this.refreshAccounts = this.refreshAccounts.bind(this);
    this.cancelTask = this.cancelTask.bind(this);
  }

  toast(severity: Severity, label: string) {
    this.toasts.push({ id: v4(), severity, label });
  }

  dismissToast(id: string) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  async openLogin(platformKey: string) {
    try {
      const platform = platforms[platformKey];
      const token = await platform.tokenFlow();
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

  private async runQueuePlatform(callback: (item: PlatformItem) => Promise<void>) {
    if (!this.queue[0]) return;
    const first = this.queue[0];
    if (first.state !== "preparing") return;
    const { generator } = first;
    const platform = platforms[first.platform];

    this.queue[0].current = 0;
    this.queue[0].state = "progress";

    for await (const item of generator) {
      const first = this.queue[0];
      if (first.state === "cancelled") return;

      if (item.type === "ok") {
        try {
          await callback(item.result);
        } catch {
          //
        }
      } else if (item.type === "action") {
        if (item.action.type === "wait") {
          await sleep(item.action.time);
          continue;
        }
      }

      //todo update remaining
      this.queue[0].current += 1;
      await sleep(platform.timeout);
    }

    this.queue.shift();
  }

  private async runQueuePurge() {
    await this.runQueuePlatform(async (item) => {
      await waitFor(() => item.delete());
    });
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
