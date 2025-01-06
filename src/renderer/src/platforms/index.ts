import { Platform } from './types';
import Discord from './Discord';

export const platforms: Record<string, Platform> = {
  discord: new Discord(),
};
