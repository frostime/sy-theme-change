/*
 * Copyright (c) 2023 by Yp Z (frostime). All Rights Reserved.
 * @Author       : Yp Z
 * @Date         : 2023-09-27 00:34:28
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2023-09-27 10:08:11
 * @Description  : 
 */
import { Plugin, Menu, getFrontend, showMessage } from "siyuan";
import { svg } from "./const";
import { request, getInstalledTheme, getBazaarTheme, installBazaarTheme } from "./api";
import "./index.scss";

import { changelog } from "sy-plugin-changelog";

declare global {
    interface Window {
        siyuan: any;
    }
}


const SIYUAN = window.siyuan;
const Lang = SIYUAN.config.lang;


class Themes {
    name2displayName: {[key: string]: string} = {};

    async updateThemes() {
        this.name2displayName = {};

        let frontend = getFrontend();
        let data = await getInstalledTheme(frontend);
        let packages = data.packages;
        for (let pkg of packages) {
            let displayName = pkg.displayName[Lang];
            if (displayName === undefined || displayName === null || displayName === '') {
                displayName = pkg.displayName['default'];
            }
            console.log(pkg.displayName)
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
        await this.themes.updateThemes();
        changelog(this, 'i18n/changelog.md').then((result) => {
            result?.Dialog?.setSize({
                width: "45rem",
                height: "25rem",
            });
        });
        getBazaarTheme().then((data) => {
            this.bazzarThemes = data ?? [];
            console.log(this.bazzarThemes)
        });
    }

    showThemesMenu(rect: DOMRect) {
        let menu: Menu = new Menu("ThemeChange");
        const appearance = SIYUAN.config.appearance;
        const mode = appearance.mode === 0 ? 'light' : 'dark';
        const themes: string[] = mode === 'light' ? appearance.lightThemes : appearance.darkThemes;
        const current = mode === 'light' ? appearance.themeLight : appearance.themeDark;
        for (const theme of themes) {
            let icon = null;
            if (theme === current) {
                icon = 'iconSelect';
            }
            menu.addItem({
                label: this.themes.getDisplayName(theme),
                icon: icon,
                click: () => {
                    this.useTheme(theme, mode);
                }
            });
        }
        menu.addSeparator()
        menu.addItem({
            label: this.i18n.random,
            icon: 'iconRefresh',
            click: () => this.random(mode),
        });
        menu.addItem({
            label: this.i18n.install,
            type: "submenu",
            submenu: this.bazzarThemes.map((theme: ITheme) => {
                return {
                    label: theme.name,
                    click: () => {
                        installBazaarTheme(theme).then(async (ans) => {
                            console.info("Install theme", ans);
                            this.themes.updateThemes().then(() => {
                                showMessage(this.i18n.installDone);
                            });
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

    private useTheme(theme: string, mode: string) {
        const appearance = SIYUAN.config.appearance;
        const current = mode === 'light' ? appearance.themeLight : appearance.themeDark;
        if (theme === current) {
            return;
        }
        const obj = {
            ...SIYUAN.config.appearance,
        };
        if (mode === 'light') {
            obj.themeLight = theme;
        } else {
            obj.themeDark = theme;
        }
        request('/api/setting/setAppearance', obj).then(() => window.location.reload());
    }

    private random(mode: string) {
        const appearance = SIYUAN.config.appearance;
        const current = mode === 'light' ? appearance.themeLight : appearance.themeDark;
        const themes = mode === 'light' ? [...appearance.lightThemes] : [...appearance.darkThemes];
        for (let i = 0; i < themes.length; i++) {
            if (themes[i] === current) {
                themes.splice(i, 1);
            }
        }
        if (themes.length === 0) {
            return;
        }
        const r = Math.floor(Math.random() * themes.length)
        this.useTheme(themes[r], mode);
    }
}
