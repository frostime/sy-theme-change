import { fetchSyncPost, getFrontend } from "siyuan";

export async function getBazaarTheme(frontend: string): Promise<ITheme[]> {
    const response = await fetchSyncPost("/api/bazaar/getBazaarTheme", { frontend });
    if (response.code !== 0) {
        throw new Error(response.msg || "Failed to load the theme marketplace");
    }
    return response.data?.packages ?? [];
}

export async function installBazaarTheme(theme: ITheme): Promise<void> {
    const appearance = window.siyuan.config.appearance;
    const modes = theme.modes ?? [];
    const currentMode: ThemeMode = appearance.mode === 0 ? "light" : "dark";
    const supportsCurrentMode = modes.length === 0 || modes.includes(currentMode);
    // 与思源集市安装逻辑保持一致：优先安装到当前模式，否则退回到主题支持的模式
    const mode = supportsCurrentMode ? appearance.mode : (modes.includes("dark") ? 1 : 0);
    const modeOS = supportsCurrentMode ? appearance.modeOS : false;

    const response = await fetchSyncPost("/api/bazaar/installBazaarTheme", {
        frontend: getFrontend(),
        repoURL: theme.repoURL,
        repoHash: theme.repoHash,
        repoRef: theme.repoRef ?? "",
        packageName: theme.name,
        mode,
        modeOS,
    });
    if (response.code !== 0) {
        throw new Error(response.msg || `Failed to install theme ${theme.name}`);
    }
}

export async function setTheme(theme: string, mode: 0 | 1): Promise<void> {
    const response = await fetchSyncPost("/api/setting/setTheme", {
        theme,
        modes: [mode],
    });
    if (response.code !== 0) {
        throw new Error(response.msg || `Failed to switch to theme ${theme}`);
    }
}
