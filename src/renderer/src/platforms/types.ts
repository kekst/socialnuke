import React from 'react';

export interface User {
  readonly id: string;
  readonly iconUrl?: string;
  readonly name: string;
}

export type QueryGenerator = AsyncGenerator<
  PlatformResponse<PlatformItem>,
  void,
  void
>;

export interface PlatformTarget {
  readonly id: string;
  readonly parentId?: string;
  readonly iconUrl?: string;
  readonly icon?: React.ReactNode;
  readonly disabled?: boolean;
  readonly name: string;
  readonly type: string;
  readonly user: User;

  children?(): Promise<PlatformResponse<PlatformTarget[]>>;
  estimate?(filters: any): Promise<PlatformResponse<number>>;
  query(filters: any): QueryGenerator;
}

export interface FilterToggle {
  readonly key: string;
  readonly title: string;
  readonly defaultValue?: boolean;
}

export interface Filter {
  readonly key: string;
  readonly title: string;
  readonly type: 'dateRange' | 'select' | 'text' | 'toggles';
  readonly options?: { label: string; value: any; icon?: React.ReactNode }[];
  readonly toggles?: FilterToggle[];
  readonly defaultValue?: any;
}

export interface TargetType {
  readonly key: string;
  readonly name: string;
}

export interface ActionWait {
  type: 'wait';
  time: number;
}

export type Action = ActionWait;

export interface PlatformResponseOk<T> {
  type: 'ok';
  result: T;
}

export interface PlatformResponseAction {
  type: 'action';
  action: Action;
}

export type PlatformResponse<T> =
  | PlatformResponseOk<T>
  | PlatformResponseAction;

export interface Platform {
  readonly key: string;
  readonly name: string;
  readonly icon: React.ReactNode;
  readonly filters: Filter[];
  readonly features: {
    purge: boolean;
    dump: boolean;
  };
  readonly targetTypes: TargetType[];
  readonly timeout: number;

  tokenFlow(): Promise<string>;
  withToken(token: string): Promise<PlatformActor>;
}

export interface PlatformItem {
  readonly id: string;
  delete(): Promise<PlatformResponse<boolean>>;
}

export interface PlatformActor {
  readonly user: User;
  targets(type: string): Promise<PlatformResponse<PlatformTarget[]>>;
}
