import { BrowserWindow, getCurrentWindow } from '@electron/remote';
import { v4 } from 'uuid';

import { Platform, PlatformResponse } from './types';
import { sleep } from '../../common';

export function newLoginWindow() {
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

  loginWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      details.requestHeaders['User-Agent'] = userAgent;
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    }
  );

  return loginWindow;
}

export function defaultValues(platform: Platform) {
  const obj: any = {};
  for (const filter of platform.filters) {
    if (typeof filter.defaultValue !== 'undefined') {
      obj[filter.key] = filter.defaultValue;
    }

    if (filter.type === 'toggles' && filter.toggles) {
      for (const toggle of filter.toggles) {
        if (typeof toggle.defaultValue !== 'undefined') {
          obj[toggle.key] = toggle.defaultValue;
        }
      }
    }
  }

  return obj;
}

export async function waitFor<T>(
  callback: () => Promise<PlatformResponse<T>>
): Promise<T> {
  while (true) {
    const res = await callback();
    if (res.type === 'action' && res.action.type === 'wait') {
      await sleep(res.action.time);
    }

    if (res.type === 'ok') {
      return res.result;
    }
  }
}
