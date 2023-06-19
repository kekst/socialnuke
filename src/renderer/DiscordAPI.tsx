import { toast } from 'react-toastify';
import { sleep } from './common';

const ENDPOINT = 'https://discord.com/api/v9/';

export interface Target {
  id: string;
  name: string;
  accountId: string;
  canDeleteAll: boolean;
  iconUrl?: string;
  channelId?: string; // for guilds only
  type: 'channel' | 'guild';
}
export interface ResultMessage {
  attachments?: { filename: string; url: string }[];
  author: { id: string; username: string };
  channel_id: string;
  id: string;
  hit: boolean;
  content: string;
  timestamp: string;
}

export interface Results {
  retry_after?: number;
  document_indexed?: number;
  total_results?: number;
  messages?: ResultMessage[][];
}

export interface Filters {
  type: 'channel' | 'guild';
  target?: string;
  author_id?: string;
  content?: string;
  mentions?: string;
  min_id?: string;
  max_id?: string;
  channel_id?: string;
  keep_last?: number;
  recheck?: boolean;
  has?: 'link' | 'embed' | 'file' | 'video' | 'image' | 'sound';
  sort?: 'newest' | 'oldest';
}

export function getUserAvatar(user: DiscordUser) {
  return user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${
        (parseInt(user.discriminator || '0') || 0) % 5
      }.png`;
}

export function getUserName(user: DiscordUser) {
  if (user.discriminator && user.discriminator !== '0') {
    return `${user.username}#${user.discriminator}`;
  }

  return user.username;
}

export function getHeaders(token: string) {
  return {
    authorization: token,
  };
}

export async function getUser(token: string): Promise<DiscordUser | undefined> {
  try {
    const res = await fetch(`${ENDPOINT}users/@me`, {
      headers: getHeaders(token),
    });

    if (res.status === 403) {
      throw new Error('No');
    }

    if (res.status !== 200) {
      throw new Error('Rate limited?');
    }

    return await res.json();
  } catch {
    return undefined;
  }
}

interface DiscordUser {
  id: string;
  avatar: string | null;
  discriminator: string | null;
  global_name: string | null;
  username: string;
}
interface TargetObject {
  id: string;
  recipients?: DiscordUser[];
  iconUrl?: string;
  canDeleteAll?: boolean;
  name?: string;
  permissions?: string;
  owner?: boolean;
  icon?: string;
  type?: string;
  accountId?: string;
}

export async function getOfType(
  token: string,
  type: 'channel' | 'guild'
): Promise<TargetObject[]> {
  const res = await fetch(`${ENDPOINT}users/@me/${type}s`, {
    headers: getHeaders(token),
  });
  const json: any[] = await res.json();
  if (!Array.isArray(json)) {
    throw new Error('Unauthenticated.');
  }

  if (type === 'channel') {
    return json
      .sort((a, b) => {
        if (b.last_message_id && a.last_message_id) {
          return parseInt(b.last_message_id) - parseInt(a.last_message_id);
        }

        if (a.last_message_id) {
          return 1;
        }

        return 0;
      })
      .map((obj) => {
        if (obj.recipients.length === 1 && obj.recipients[0]) {
          const user = obj.recipients[0];
          return {
            ...obj,
            iconUrl: getUserAvatar(user),
          };
        }
        return obj;
      });
  }

  return json.map((obj) => ({
    ...obj,
    iconUrl: obj.icon
      ? `https://cdn.discordapp.com/icons/${obj.id}/${obj.icon}.png`
      : undefined,
  }));
}

export async function getGuildChannels(
  token: string,
  guildId: string
): Promise<any[]> {
  const res = await fetch(`${ENDPOINT}guilds/${guildId}/channels`, {
    headers: getHeaders(token),
  });
  const json: any[] = await res.json();
  if (!Array.isArray(json)) {
    throw new Error('Unauthenticated.');
  }

  json.sort((a, b) => parseInt(a.position) - parseInt(b.position));
  const top = [];
  const cats = json.filter((chan) => !chan.parent_id);

  for (const cat of cats) {
    top.push(cat);
    if (cat.type === 4) {
      top.push(...json.filter((chan) => chan.parent_id === cat.id));
    }
  }
  return top;
}

function buildParams(data: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'undefined') {
      params.append(key, value);
    }
  }

  return params;
}

export async function getMessages(
  token: string,
  {
    type,
    target,
    author_id,
    mentions,
    min_id,
    max_id,
    channel_id,
    has,
    content,
    sort,
  }: Filters
): Promise<Results> {
  const params = buildParams({
    content,
    author_id,
    has,
    channel_id,
    mentions,
    min_id,
    max_id,
  });
  params.append('include_nsfw', 'true');
  if (sort === 'oldest') {
    params.append('sort_by', 'timestamp');
    params.append('sort_order', 'asc');
  }

  const res = await fetch(
    `${ENDPOINT}${type}s/${target}/messages/search?${params.toString()}`,
    {
      headers: getHeaders(token),
    }
  );

  if (res.status === 403) {
    throw new Error('No');
  }

  if (res.status !== 200 && res.status !== 202) {
    throw new Error('Rate limited?');
  }

  const json = await res.json();
  return json;
}

export async function removeMessage(
  token: string,
  channel_id: string,
  id: string
) {
  const res = await fetch(`${ENDPOINT}channels/${channel_id}/messages/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  if (res.status === 403) {
    throw new Error('No');
  }

  if (res.status !== 204) {
    throw new Error(res.headers.get('retry-after') || '1');
  }
}

export async function waitForSearch(
  token: string,
  filters: Filters
): Promise<Results> {
  while (true) {
    try {
      const res = await getMessages(token, filters);
      if (typeof res.document_indexed === 'undefined') {
        return res;
      }

      const retryAfter = res.retry_after || 2;
      toast.info(`Not indexed yet, retrying in ${retryAfter} seconds...`);
      await sleep(retryAfter * 1000);
    } catch (e: any) {
      if (e.message === 'No') {
        toast.error(`Unrecoverable error.`);
        throw new Error('Failure');
      }

      toast.info(`Recoverable error, retrying in 1 second...`);
      await sleep(1000);
    }
  }
}
