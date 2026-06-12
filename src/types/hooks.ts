export type HookType = `PRE_TRANSACTION` | `POST_TRANSACTION`;

export interface CreateHookData {
  name: string;
  url: string;
  type: HookType;
  active: boolean;
  timeout: number;
  retry_count: number;
}

export interface HookResp {
  id: string;
  name: string;
  url: string;
  type: HookType;
  active: boolean;
  timeout: number;
  retry_count: number;
  created_at: string;
  last_run: string;
  last_success: boolean;
}
