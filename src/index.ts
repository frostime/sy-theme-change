import { Plugin, Menu, getFrontend, showMessage } from "siyuan";
import { svg } from "./const";
import { getBazaarTheme, installBazaarTheme, setTheme } from "./api";
import "./index.scss";

declare global {
    interface Window {
        siyuan: any;
    }
}

const SIYUAN = window.siyuan;

function themeDisplayName(theme: ITheme): string {
    if (theme.preferredName) {
        return theme.preferredName;
    }
    const displayName = theme.displayName;
    if (!displayName) {
        return theme.name;
    }
    const lang = SIYUAN.config.lang;
    return displayName[lang] || displayName["default"] || displayName["en"] || theme.name;
}

export default class ThemeChangePlugin extends Plugin {

    isMobile: boolean;
    frontend: string;
    bazaarThemes: ITheme[] = [];

    onload() {
        this.frontend = getFrontend();
        this.isMobile = this.frontend === "mobile" || this.frontend === "browser-mobile";
        getBazaarTheme(this.frontend).then((themes) => {
            this.bazaarThemes = themes;
        }).catch((error) => {
            console.warn("Failed to load the theme marketplace", error);
        });
    }

    onLayoutReady() {
        this.addTopBar({
            id: "theme-change",
            icon: svg,
            title: String(this.i18n.title ?? "Theme Change"),
            position: "right",
            callback: (event) => {
                const target = event.currentTarget as HTMLElement;
                this.showThemesMenu(target.getBoundingClientRect());
            },
        });
    }

    showThemesMenu(rect: DOMRect) {
        const menu: Menu = new Menu("ThemeChange");
        const appearance = SIYUAN.config.appearance;
        const mode: ThemeMode = appearance.mode === 0 ? "light" : "dark";
        const themes: IAppearanceTheme[] = mode === "light" ? appearance.lightThemes : appearance.darkThemes;
        const current = mode === "light" ? appearance.themeLight : appearance.themeDark;

        //Switch theme
        for (const theme of themes) {
            if (!this.isThemeCompatible(theme)) {
                continue;
            }
            menu.addItem({
                label: theme.label || theme.name,
                icon: theme.name === current ? "iconSelect" : undefined,
                click: () => {
                    this.useTheme(theme.name, mode);
                }
            });
        }

        menu.addSeparator();
        menu.addItem({
            label: String(this.i18n.random ?? "Random"),
            icon: "iconRefresh",
            click: () => this.random(mode),
        });

        const installedThemeNames = new Set([
            ...appearance.lightThemes,
            ...appearance.darkThemes,
        ].map((theme: IAppearanceTheme) => theme.name));

        //Install theme
        menu.addItem({
            label: String(this.i18n.install ?? "Install theme"),
            type: "submenu",
            submenu: this.bazaarThemes
                .filter((theme) => !installedThemeNames.has(theme.name) && !theme.disallowInstall)
                .map((theme) => ({
                    label: themeDisplayName(theme),
                    click: () => {
                        this.installTheme(theme);
                    }
                }))
        });
        if (this.isMobile) {
            menu.fullscreen();
        } else {
            menu.open({
                x: rect.left,
                y: rect.bottom,
                isLeft: false,
            });
        }
    }

    private isThemeCompatible(theme: IAppearanceTheme): boolean {
        const frontends = theme.frontends;
        if (!frontends || frontends.length === 0) {
            return true;
        }
        return frontends.includes("all") || frontends.includes(this.frontend);
    }

    private async installTheme(theme: ITheme) {
        try {
            await installBazaarTheme(theme);
            showMessage(String(this.i18n.installDone ?? "Installed"));
        } catch (error) {
            showMessage(error instanceof Error ? error.message : String(error), 6000, "error");
        }
    }

    private async useTheme(themeName: string, mode: ThemeMode) {
        const appearance = SIYUAN.config.appearance;
        const current = mode === "light" ? appearance.themeLight : appearance.themeDark;
        if (themeName === current) {
            return;
        }
        try {
            await setTheme(themeName, mode === "light" ? 0 : 1);
        } catch (error) {
            showMessage(error instanceof Error ? error.message : String(error), 6000, "error");
        }
    }

    private random(mode: ThemeMode) {
        const appearance = SIYUAN.config.appearance;
        const current = mode === "light" ? appearance.themeLight : appearance.themeDark;
        const themes: IAppearanceTheme[] = mode === "light" ? appearance.lightThemes : appearance.darkThemes;
        const candidates = themes.filter((theme) => theme.name !== current && this.isThemeCompatible(theme));
        if (candidates.length === 0) {
            return;
        }
        const theme = candidates[Math.floor(Math.random() * candidates.length)];
        this.useTheme(theme.name, mode);
    }
}
