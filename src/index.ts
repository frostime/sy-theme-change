/*
 * Copyright (c) 2023 by Yp Z (frostime). All Rights Reserved.
 * @Author       : Yp Z
 * @Date         : 2023-09-27 00:34:28
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2024-10-01 14:14:29
 * @Description  : 
 */
import { Plugin, Menu, getFrontend, showMessage } from "siyuan";
import { svg } from "./const";
import { request, getInstalledTheme, getBazaarTheme, installBazaarTheme } from "./api";
import "./index.scss";

// import { changelog } from "sy-plugin-changelog";

declare global {
    interface Window {
        siyuan: any;
    }
}


const SIYUAN = window.siyuan;
const Lang = SIYUAN.config.lang;


class Themes {
    name2displayName: {[key: string]: string} = {};

    async updateThemes(packages?: any) {
        this.name2displayName = {};

        if (!packages) {
            let frontend = getFrontend();
            packages = (await getInstalledTheme(frontend)).packages;
        }
        for (let pkg of packages) {
            let displayName = pkg.displayName[Lang];
            if (displayName === undefined || displayName === null || displayName === '') {
                displayName = pkg.displayName['default'];
            }
            // console.debug(pkg.displayName)
            this.name2displayName[pkg.name] = displayName;
        }
    }

    getDisplayName(name: string) {
        let displayName = this.name2displayName[name];
        if (displayName === undefined || displayName === null || displayName === '') {
            displayName = name;
        }
        return displayName;
    }
}


export default class ThemeChangePlugin extends Plugin {

    themes: Themes;
    isMobile: boolean;
    bazzarThemes: ITheme[] = [];

    async onload() {
        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        const topBarElement = this.addTopBar({
            icon: svg,
            title: this.i18n.title,
            callback: () => {
                this.showThemesMenu(topBarElement.getBoundingClientRect());
            },
            position: "right"
        });
        this.themes = new Themes();
        getBazaarTheme().then((data) => {
            this.bazzarThemes = data ?? [];
            this.themes.updateThemes(data);
            // console.debug(this.bazzarThemes)
        });
        // await this.themes.updateThemes();
        // changelog(this, 'i18n/changelog.md').then((result) => {
        //     result?.Dialog?.setSize({
        //         width: "45rem",
        //         height: "25rem",
        //     });
        // });
    }

    showThemesMenu(rect: DOMRect) {
        let menu: Menu = new Menu("ThemeChange");
        const appearance = SIYUAN.config.appearance;
        const mode = appearance.mode === 0 ? 'light' : 'dark';
        const themes: {name: string; label: string}[] = mode === 'light' ? appearance.lightThemes : appearance.darkThemes;
        const current = mode === 'light' ? appearance.themeLight : appearance.themeDark;

        //Switch theme
        for (const theme of themes) {
            let icon = null;
            if (theme.name === current) {
                icon = 'iconSelect';
            }
            menu.addItem({
                label: this.themes.getDisplayName(theme.name),
                icon: icon,
                click: () => {
                    this.useTheme(theme.name, mode);
                }
            });
        }

        const allThemes = Array.from(new Set([...appearance.lightThemes, ...appearance.darkThemes]));
        // console.debug("All installed themes:", allThemes);
        menu.addSeparator()
        menu.addItem({
            label: this.i18n.random,
            icon: 'iconRefresh',
            click: () => this.random(mode),
        });

        const installedThemeNames = allThemes.map((theme) => theme.name);

        //Install theme
        menu.addItem({
            label: this.i18n.install,
            type: "submenu",
            submenu: this.bazzarThemes.filter((theme: ITheme) => {
                return !installedThemeNames.includes(theme.name);
            }).map((theme: ITheme) => {
                // console.debug(theme);
                return {
                    label: this.themes.getDisplayName(theme.name),
                    click: () => {
                        installBazaarTheme(theme).then(async (ans) => {
                            console.info("Install theme", ans);
                            showMessage(this.i18n.installDone);
                        });
                    }
                }
            })
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

    private useTheme(themeName: string, mode: string) {
        const appearance = SIYUAN.config.appearance;
        const current = mode === 'light' ? appearance.themeLight : appearance.themeDark;
        if (themeName === current) {
            return;
        }
        const obj = {
            ...SIYUAN.config.appearance,
        };
        if (mode === 'light') {
            obj.themeLight = themeName;
        } else {
            obj.themeDark = themeName;
        }
        try {
            //部分主题在 destroy 时会报错导致无法切换主题
            globalThis?.destroyTheme && globalThis.destroyTheme();
        } catch (e) {
            console.warn("Some error occurred when destroy theme", e);
        }
        request('/api/setting/setAppearance', obj).then(() => {
            window.location.reload();
        });
    }

    private random(mode: string) {
        const appearance = SIYUAN.config.appearance;
        const current = mode === 'light' ? appearance.themeLight : appearance.themeDark;
        const themes = mode === 'light' ? [...appearance.lightThemes] : [...appearance.darkThemes];
        for (let i = 0; i < themes.length; i++) {
            if (themes[i].name === current) {
                themes.splice(i, 1);
            }
        }
        if (themes.length === 0) {
            return;
        }
        const r = Math.floor(Math.random() * themes.length)
        this.useTheme(themes[r].name, mode);
    }
}
