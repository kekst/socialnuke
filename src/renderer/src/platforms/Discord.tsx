import {
  BsDiscord,
  BsHash,
  BsVolumeUpFill,
  BsAsterisk,
  BsFillFileEarmarkFill,
  BsCardImage,
  BsListColumnsReverse,
  BsMusicNoteBeamed,
  BsFilm,
  BsStickyFill,
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import { ReactNode } from 'react';

import {
  PlatformItem,
  Platform,
  PlatformActor,
  TargetType,
  User,
  PlatformResponse,
  Filter,
  PlatformTarget,
} from './types';
import { newLoginWindow } from './utils';
import { UnauthorizedError } from './errors';

const ENDPOINT = 'https://discord.com/api/v9/';

function dateSnowflake(date: Date) {
  return String((date.getTime() - 1420070400000) * 4194304);
}

function getHeaders(token: string) {
  return {
    authorization: token,
  };
}

interface DiscordUser {
  id: string;
  avatar: string | null;
  discriminator: string | null;
  global_name: string | null;
  username: string;
}

interface DiscordDMChannel {
  id: string;
  recipients?: DiscordUser[];
  name?: string;
  last_message_id?: string;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  owner?: boolean;
}

interface DiscordChannel {
  id: string;
  name: string;
  type?: number;
  position: string;
  parent_id?: string;
}

interface DiscordResultMessage {
  attachments?: { filename: string; url: string }[];
  author: { id: string; username: string };
  channel_id: string;
  id: string;
  hit: boolean;
  content: string;
  timestamp: string;
}

interface DiscordResults {
  retry_after?: number;
  document_indexed?: number;
  total_results?: number;
  messages?: DiscordResultMessage[][];
}

interface DiscordPlatformFilters {
  content?: string;
  range?: [Date | undefined, Date | undefined];
  has?: string;
  oldest?: boolean;
}

function getUserAvatar(user?: DiscordUser) {
  return user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${
        (parseInt(user?.discriminator || '0') || 0) % 5
      }.png`;
}

function getUserName(user: DiscordUser) {
  if (user.discriminator && user.discriminator !== '0') {
    return `${user.username}#${user.discriminator}`;
  }

  return user.username;
}

class DiscordItem implements PlatformItem {
  id: string;

  constructor(private token: string, private message: DiscordResultMessage) {
    this.id = message.id;
  }

  async delete(): Promise<PlatformResponse<boolean>> {
    const res = await fetch(
      `${ENDPOINT}channels/${this.message.channel_id}/messages/${this.message.id}`,
      {
        method: 'DELETE',
        headers: getHeaders(this.token),
      }
    );

    if (res.status === 403) {
      throw new Error('Forbidden');
    }

    if (res.status !== 204) {
      const seconds = parseInt(res.headers.get('retry-after') || '1') || 1;
      return { type: 'action', action: { type: 'wait', time: seconds * 1000 } };
    }

    return { type: 'ok', result: true };
  }
}

class DiscordTarget implements PlatformTarget {
  id: string;
  parentId?: string | undefined;
  iconUrl?: string | undefined;
  icon?: ReactNode;
  disabled?: boolean | undefined;
  name: string;
  type: string;

  constructor(
    private discordUser: DiscordUser,
    private token: string,
    type: 'dms' | 'guilds' | 'channel',
    obj: DiscordDMChannel | DiscordGuild | DiscordChannel,
    parentId?: string
  ) {
    switch (type) {
      case 'dms':
        {
          const dmChannel = obj as DiscordDMChannel;
          const recipients =
            dmChannel.recipients?.map(getUserName).join(', ') || '(empty)';
          const user = dmChannel.recipients?.[0];
          this.id = dmChannel.id;
          this.name =
            dmChannel.recipients?.length !== 1
              ? `Group DM: ${recipients}`
              : recipients;
          this.type = 'dms';
          this.iconUrl = getUserAvatar(user);
        }
        break;
      case 'channel':
        {
          const channel = obj as DiscordChannel;
          this.id = channel.id;
          this.name = channel.name;
          this.type = 'guilds';
          this.parentId = parentId;
          this.disabled = channel.type === 4;
          this.icon = (
            <>
              {channel.type === 0 && <BsHash />}
              {channel.type === 2 && <BsVolumeUpFill />}
            </>
          );
        }
        break;
      case 'guilds':
        {
          const guild = obj as DiscordGuild;
          this.id = guild.id;
          this.name = guild.name;
          this.type = 'guilds';
          this.iconUrl = guild.icon
            ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
            : undefined;
        }
        break;
      default:
        throw new Error('Not supported.');
    }

    if (this.type !== 'guilds') {
      this.children = undefined;
    }
  }

  get user(): User {
    return {
      id: this.discordUser.id,
      name: getUserName(this.discordUser),
      iconUrl: getUserAvatar(this.discordUser),
    };
  }

  async children?(): Promise<PlatformResponse<PlatformTarget[]>> {
    const res = await fetch(`${ENDPOINT}guilds/${this.id}/channels`, {
      headers: getHeaders(this.token),
    });
    const json: DiscordChannel[] = await res.json();
    if (!Array.isArray(json)) {
      throw new UnauthorizedError('Unauthorized');
    }

    json.sort((a, b) => parseInt(a.position) - parseInt(b.position));

    const targets: PlatformTarget[] = [];
    const topLevel = json.filter((chan) => !chan.parent_id);

    for (const channel of topLevel) {
      targets.push(
        new DiscordTarget(
          this.discordUser,
          this.token,
          'channel',
          channel,
          this.id
        )
      );

      if (channel.type === 4) {
        const channels = json.filter((chan) => chan.parent_id === channel.id);
        for (const channel of channels) {
          targets.push(
            new DiscordTarget(
              this.discordUser,
              this.token,
              'channel',
              channel,
              this.id
            )
          );
        }
      }
    }

    return { type: 'ok', result: targets };
  }

  private searchParams(filters: DiscordPlatformFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.range?.[0]) {
      params.set('min_id', dateSnowflake(filters.range?.[0]));
    }
    if (filters.range?.[1]) {
      params.set('max_id', dateSnowflake(filters.range?.[1]));
    }
    if (filters.has) {
      params.set('has', filters.has);
    }
    if (filters.content) {
      params.set('content', filters.content);
    }
    if (filters.oldest) {
      params.append('sort_by', 'timestamp');
      params.append('sort_order', 'asc');
    }
    params.set('author_id', this.discordUser.id);
    params.append('include_nsfw', 'true');

    if (this.parentId && this.type === 'guilds') {
      params.set('channel_id', this.id);
    }

    return params;
  }

  private async search(
    params: URLSearchParams
  ): Promise<PlatformResponse<DiscordResults>> {
    const targetId = this.parentId || this.id;
    const res = await fetch(
      `${ENDPOINT}${
        this.type === 'dms' ? 'channel' : 'guild'
      }s/${targetId}/messages/search?${params.toString()}`,
      {
        headers: getHeaders(this.token),
      }
    );

    if (res.status === 403) {
      throw new Error('No');
    }

    if (res.status !== 200 && res.status !== 202) {
      toast.info(`Rate limited?`);
      return {
        type: 'action',
        action: { type: 'wait', time: 1000 },
      };
    }

    const json = await res.json();

    if (typeof json.document_indexed !== 'undefined') {
      const retryAfter = json.retry_after || 2;
      toast.info(`Not indexed yet, retrying in ${retryAfter} seconds...`);
      return {
        type: 'action',
        action: { type: 'wait', time: retryAfter * 1000 },
      };
    }

    return {
      type: 'ok',
      result: json,
    };
  }

  async estimate(
    filters: DiscordPlatformFilters
  ): Promise<PlatformResponse<number>> {
    const params = this.searchParams(filters);
    const res = await this.search(params);
    if (res.type !== 'ok') {
      return res;
    }

    return { type: 'ok', result: res.result.total_results || 0 };
  }

  async *query(
    filters: DiscordPlatformFilters
  ): AsyncGenerator<PlatformResponse<PlatformItem>, void, void> {
    const params = this.searchParams(filters);

    while (true) {
      try {
        const res = await this.search(params);
        if (res.type !== 'ok') {
          yield res;
          continue;
        }

        const json = res.result;
        if (!json.messages?.length || !json.total_results) {
          return;
        }

        const messages = json.messages.map((x) => {
          return x.reduce((acc, val) => (val.hit ? val : acc));
        });

        if (!messages.length) {
          return;
        }

        for (const message of messages) {
          yield { type: 'ok', result: new DiscordItem(this.token, message) };
        }

        if (filters.oldest) {
          params.set('min_id', messages[messages.length - 1].id);
        } else {
          params.set('max_id', messages[messages.length - 1].id);
        }
      } catch (e: any) {
        if (e.message === 'No') {
          toast.error(`Unrecoverable error.`);
          throw new Error('Failure');
        }

        toast.info(`Recoverable error, retrying in 1 second...`);
        yield {
          type: 'action',
          action: { type: 'wait', time: 1000 },
        };
      }
    }
  }
}

class DiscordActor implements PlatformActor {
  constructor(private token: string, private discordUser: DiscordUser) {}

  get user(): User {
    return {
      id: this.discordUser.id,
      name: getUserName(this.discordUser),
      iconUrl: getUserAvatar(this.discordUser),
    };
  }

  async targets(type: string): Promise<PlatformResponse<PlatformTarget[]>> {
    if (type === 'dms') {
      const res = await fetch(`${ENDPOINT}users/@me/channels`, {
        headers: getHeaders(this.token),
      });
      const json: DiscordDMChannel[] = await res.json();
      if (!Array.isArray(json)) {
        throw new UnauthorizedError('Unauthorized');
      }

      const sorted = json.sort((a, b) => {
        if (b.last_message_id && a.last_message_id) {
          return parseInt(b.last_message_id) - parseInt(a.last_message_id);
        }

        if (a.last_message_id) {
          return 1;
        }

        return 0;
      });

      const targets: PlatformTarget[] = [];
      for (const channel of sorted) {
        if (!channel.recipients?.length) {
          continue;
        }

        targets.push(
          new DiscordTarget(this.discordUser, this.token, 'dms', channel)
        );
      }

      return { type: 'ok', result: targets };
    }

    if (type === 'guilds') {
      const res = await fetch(`${ENDPOINT}users/@me/guilds`, {
        headers: getHeaders(this.token),
      });
      const json: DiscordGuild[] = await res.json();
      if (!Array.isArray(json)) {
        throw new UnauthorizedError('Unauthorized');
      }

      const targets: PlatformTarget[] = [];
      for (const guild of json) {
        targets.push(
          new DiscordTarget(this.discordUser, this.token, 'guilds', guild)
        );
      }
      return { type: 'ok', result: targets };
    }

    throw new Error('Not supported.');
  }
}

const cache: Record<string, DiscordUser> = {};

export default class Discord implements Platform {
  icon = (<BsDiscord />);
  filters: Filter[] = [
    {
      key: 'options',
      type: 'toggles',
      title: 'Options',
      toggles: [
        {
          key: 'oldest',
          title: 'Start from oldest',
          defaultValue: true,
        },
      ],
    },
    {
      key: 'content',
      type: 'text',
      title: 'Contains text',
    },
    {
      key: 'range',
      type: 'dateRange',
      title: 'Date range',
    },
    {
      key: 'has',
      type: 'select',
      title: 'Contains',
      options: [
        { label: 'Anything', value: undefined, icon: <BsAsterisk /> },
        { label: 'File', value: 'file', icon: <BsFillFileEarmarkFill /> },
        { label: 'Image', value: 'image', icon: <BsCardImage /> },
        { label: 'Embed', value: 'embed', icon: <BsListColumnsReverse /> },
        { label: 'Sound', value: 'sound', icon: <BsMusicNoteBeamed /> },
        { label: 'Video', value: 'video', icon: <BsFilm /> },
        { label: 'Sticker', value: 'sticker', icon: <BsStickyFill /> },
      ],
    },
  ];
  key = 'discord';
  name = 'Discord';
  features = { purge: true, dump: true };
  targetTypes: TargetType[] = [
    {
      key: 'dms',
      name: 'DMs',
    },
    {
      key: 'guilds',
      name: 'Guild messages',
    },
  ];
  timeout = 400;

  defaultFilterValues() {
    const obj: any = {};
    for (const filter of this.filters) {
      if (typeof filter.defaultValue !== 'undefined') {
        obj[filter.key] = filter.defaultValue;
      }

      if (filter.type === 'toggles' && filter.toggles) {
        for (const toggle of filter.toggles) {
          if (typeof toggle.defaultValue !== 'undefined') {
            obj[toggle.key] = filter.defaultValue;
          }
        }
      }
    }
  }

  tokenFlow(): Promise<string> {
    return new Promise((resolve, reject) => {
      // TODO: timeout

      const loginWindow = newLoginWindow();

      let complete = false;
      loginWindow.webContents.session.webRequest.onBeforeSendHeaders(
        {
          urls: ['https://discord.com/api/*'],
        },
        (details, callback) => {
          if (complete) {
            return;
          }

          const authorization = details.requestHeaders.Authorization;

          if (authorization) {
            complete = true;
            resolve(authorization);
            loginWindow.close();
          }

          callback({ cancel: false, requestHeaders: details.requestHeaders });
        }
      );

      loginWindow.loadURL('https://discord.com/login');
    });
  }

  async withToken(token: string): Promise<PlatformActor> {
    if (cache[token]) {
      return new DiscordActor(token, cache[token]);
    }

    const res = await fetch(`${ENDPOINT}users/@me`, {
      headers: getHeaders(token),
    });

    if (res.status === 403) {
      throw new UnauthorizedError('Unauthorized');
    }

    if (res.status !== 200) {
      // TODO
    }

    const discordUser: DiscordUser = await res.json();
    if (!discordUser) {
      throw new Error('Unknown error.');
    }

    cache[token] = discordUser;

    return new DiscordActor(token, discordUser);
  }
}
