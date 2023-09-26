/**
 * Copyright (c) 2023 frostime. All rights reserved.
 * https://github.com/siyuan-note/plugin-sample-vite-svelte
 * 
 * See API Document in [API.md](https://github.com/siyuan-note/siyuan/blob/master/API.md)
 * API 文档见 [API_zh_CN.md](https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md)
 */

import { fetchSyncPost, IWebSocketData } from "siyuan";


// api/bazaar/getBazaarTheme
export async function getBazaarTheme(): Promise<ITheme[] | null> {
    let data = await request('api/bazaar/getBazaarTheme', {});
    return data?.packages ?? null;
}

// api/bazaar/installBazaarTheme
export async function installBazaarTheme(theme: ITheme): Promise<boolean> {
    let payload = {
        frontend: "desktop",
        mode: "light" in theme.modes ? 0 : 1,
        packageName: theme.name,
        repoHash: theme.repoHash,
        repoURL: theme.repoURL
    }
    let data = await request('api/bazaar/installBazaarTheme', payload);
    return data?.success ?? false;
}


export async function request(url: string, data: any) {
    let response: IWebSocketData = await fetchSyncPost(url, data);
    let res = response.code === 0 ? response.data : null;
    return res;
}

export async function getInstalledTheme(frontend: string) {
    let data = {
        frontend: frontend,
    }
    return request('api/bazaar/getInstalledTheme', data);
}
