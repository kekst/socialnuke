import { makeAutoObservable } from 'mobx';
import React, { createContext, useContext } from 'react';
import { BrowserWindow, getCurrentWindow } from '@electron/remote';
import autobind from 'autobind-decorator';
import { toast } from 'react-toastify';
import { v4 } from 'uuid';
import * as DiscordAPI from './DiscordAPI';
import * as RedditAPI from './RedditAPI';
import { sleep } from './common';

type Platform = 'discord' | 'twitter' | 'reddit';

interface Account {
  platform: Platform;
  id: string;
  token: string;
  name: string;
  refreshed: number;
  iconUrl?: string;
}

export interface Task {
  id: string;
  type: 'purge' | 'dump';
  platform: Platform;
  account: string;
  token: string;
  description: string;
  data: any;
  current?: number;
  total?: number;
  state: 'progress' | 'preparing' | 'queued' | 'cancelled';
}

export class Store {
  accounts: Account[] = [];

  queue: Task[] = [];

  discordTimeout = 400;

  constructor() {
    makeAutoObservable(this);
    this.accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  }

  @autobind
  openDiscordLogin() {
    this.openLogin('discord');
  }

  @autobind
  openLogin(platform: Platform) {
    const loginWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      center: true,
      parent: getCurrentWindow(),
      modal: true,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        partition: v4(),
      },
    });
    loginWindow.removeMenu();
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
    loginWindow.webContents.setUserAgent(userAgent);

    let complete = false;
    loginWindow.webContents.session.webRequest.onBeforeSendHeaders(
      (details, callback) => {
        details.requestHeaders['User-Agent'] = userAgent;
        callback({ cancel: false, requestHeaders: details.requestHeaders });
      }
    );

    loginWindow.webContents.session.webRequest.onBeforeSendHeaders(
      {
        urls: [
          'https://discord.com/api/*',
          'https://api.twitter.com/*',
          'https://s.reddit.com/*',
          'https://oauth.reddit.com/*',
        ],
      },
      (details, callback) => {
        if (complete) {
          return;
        }

        const authorization = details.requestHeaders.Authorization;

        if (authorization) {
          complete = true;
          switch (platform) {
            case 'discord':
              this.addDiscordAccount(authorization);
              break;
            case 'twitter':
              this.addTwitterAccount(authorization.split(' ')[1]);
              break;
            case 'reddit':
              this.addRedditAccount(authorization.split(' ')[1]);
              break;
            default:
            // Unknown
          }
          loginWindow.close();
        }

        callback({ cancel: false, requestHeaders: details.requestHeaders });
      }
    );

    switch (platform) {
      case 'discord':
        loginWindow.loadURL('https://discord.com/login');
        break;
      case 'twitter':
        loginWindow.loadURL('https://twitter.com/login');
        break;
      case 'reddit':
        loginWindow.loadURL('https://new.reddit.com/login/');
        break;
      default:
      // Unknown
    }
  }

  @autobind
  async refreshDiscordAccounts() {
    for (const acc of this.accounts) {
      while (true) {
        try {
          const account = await DiscordAPI.getUser(acc.token);
          if (!account) {
            break;
          }

          acc.name = DiscordAPI.getUserName(account);
          acc.refreshed = new Date().getTime();
          acc.iconUrl = DiscordAPI.getUserAvatar(account);
        } catch (e: any) {
          if (e.message === 'No') {
            this.removeAccount('discord', acc.id);
            break;
          }
        }

        await sleep(200);
      }
    }

    this.onAccountsUpdated();
  }

  @autobind
  refreshAccounts() {
    this.refreshDiscordAccounts();
  }

  async addDiscordAccount(token: string) {
    const account = await DiscordAPI.getUser(token);
    if (!account) {
      toast.error('Invalid token');
      return;
    }

    const findAcc = this.discordAccounts.find((acc) => acc.id === account.id);
    if (findAcc) {
      findAcc.name = DiscordAPI.getUserName(account);
      findAcc.token = token;
      findAcc.refreshed = new Date().getTime();
      findAcc.iconUrl = DiscordAPI.getUserAvatar(account);

      this.accounts = [...this.accounts];
    } else {
      const acc: Account = {
        platform: 'discord',
        id: account.id,
        name: DiscordAPI.getUserName(account),
        token,
        refreshed: new Date().getTime(),
        iconUrl: DiscordAPI.getUserAvatar(account),
      };

      this.accounts = [...this.accounts, acc];
    }

    this.onAccountsUpdated();
  }

  async addTwitterAccount(token: string) {
    //
  }

  async addRedditAccount(token: string) {
    const account = await RedditAPI.getUser(token);
    if (!account) {
      toast.error('Invalid token');
      return;
    }

    const findAcc = this.redditAccounts.find((acc) => acc.id === account.id);
    if (findAcc) {
      findAcc.name = account.name;
      findAcc.token = token;
      findAcc.refreshed = new Date().getTime();
      findAcc.iconUrl = account.icon_img;

      this.accounts = [...this.accounts];
    } else {
      const acc: Account = {
        platform: 'reddit',
        id: account.id,
        name: account.name,
        token,
        refreshed: new Date().getTime(),
        iconUrl: account.icon_img,
      };

      this.accounts = [...this.accounts, acc];
    }

    this.onAccountsUpdated();
  }

  async addTask(task: Task) {
    this.queue.push(task);
    this.runQueue();
  }

  get twitterAccounts() {
    return this.accounts.filter((acc) => acc.platform === 'twitter');
  }

  get redditAccounts() {
    return this.accounts.filter((acc) => acc.platform === 'reddit');
  }

  get discordAccounts() {
    return this.accounts.filter((acc) => acc.platform === 'discord');
  }

  removeAccount(platform: Platform, id: string) {
    this.accounts = this.accounts.filter(
      (acc) => acc.platform !== platform || acc.id !== id
    );

    this.onAccountsUpdated();
  }

  onAccountsUpdated() {
    localStorage.setItem('accounts', JSON.stringify(this.accounts));
  }

  private async runQueueDiscord(
    callback: (
      token: string,
      message: DiscordAPI.ResultMessage
    ) => Promise<void>
  ) {
    if (!this.queue[0]) return;
    const first = this.queue[0];
    if (first.state !== 'preparing') return;
    const { data, token } = first;

    const ignored: string[] = [];
    let latestId: string | undefined =
      data.sort === 'oldest' ? data.min_id : data.max_id;
    this.queue[0].current = 0;

    while (true) {
      const first = this.queue[0];
      if (first.state === 'cancelled') return;

      let res: DiscordAPI.Results;
      try {
        const filters = {
          ...data,
        };

        if (data.sort === 'oldest') {
          filters.min_id = latestId;
        } else {
          filters.max_id = latestId;
        }
        res = await DiscordAPI.waitForSearch(token, filters);
      } catch {
        continue;
      }
      const resMessages = res.messages;

      if (!this.queue[0].total) {
        this.queue[0].total = res.total_results;
        this.queue[0].current = 0;
        this.queue[0].state = 'progress';
      }

      if (!this.queue[0].total || !res.total_results || !resMessages) {
        this.queue.shift();
        return;
      }

      this.queue[0].current = this.queue[0].total - res.total_results;

      const messages = resMessages.map((x: any) => {
        return x.reduce((acc: any, val: any) => (val.hit ? val : acc));
      });

      for (const message of messages) {
        if (!ignored.includes(message.id)) {
          while (true) {
            const first = this.queue[0];
            if (first.state === 'cancelled') return;
            try {
              latestId = message.id;
              await callback(token, message);
              await sleep(this.discordTimeout);
              break;
            } catch (e: any) {
              try {
                if (e.message === 'No') {
                  latestId = message.id;
                  ignored.push(message.id);
                  break;
                }
              } catch (e: any) {
                //
              }

              const t = parseInt(e.message);
              if (t > 0) {
                await sleep(1000 * t);
              } else {
                await sleep(this.discordTimeout);
              }
            }
          }
          this.queue[0].current += 1;
        }
      }
    }
  }

  private async runQueueDiscordDump() {
    //
  }

  private async runQueueDiscordPurge() {
    await this.runQueueDiscord(async (token, message) => {
      await DiscordAPI.removeMessage(token, message.channel_id, message.id);
    });
  }

  async runQueue() {
    if (!this.queue[0]) return;
    const task = this.queue[0];
    if (task.state !== 'queued') return;

    task.state = 'preparing';

    switch (task.type) {
      case 'dump':
        switch (task.platform) {
          case 'discord':
            await this.runQueueDiscordDump();
            break;
          default:
            this.queue.shift();
        }
        break;
      case 'purge':
        switch (task.platform) {
          case 'discord':
            await this.runQueueDiscordPurge();
            break;
          default:
            this.queue.shift();
        }
        break;
      default:
        this.queue.shift();
    }

    while (true) {
      const task = this.queue[0];
      if (!task) {
        return;
      }

      if (task?.state !== 'queued') {
        this.queue.shift();
      } else {
        break;
      }
    }

    this.runQueue();
  }

  @autobind
  cancelTask(id: string) {
    for (const task of this.queue) {
      if (task.id === id) {
        if (task.state === 'queued') {
          this.queue = this.queue.filter((t) => task.id !== t.id);
          return;
        }

        task.state = 'cancelled';
      }
    }
  }
}

function useClassStore(init: any) {
  const [store] = React.useState(init);
  return store;
}

const sharedInstance = new Store();

export const StoreContext = createContext<Store | undefined>(undefined);
export const StoreProvider = ({ children }: { children: any }) => {
  const store = useClassStore(() => sharedInstance);
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export const useStore = (): Store => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider.');
  }
  return store;
};
