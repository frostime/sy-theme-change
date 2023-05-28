import { Plugin, Menu, isMobile } from "siyuan";
import { svg } from "./const";
import { request } from "./api";
import "./index.scss";

// @ts-ignore
const SIYUAN = window.siyuan;

export default class ThemeChangePlugin extends Plugin {

    onload() {
        const topBarElement = this.addTopBar({
            icon: svg,
            title: "主题切换",
            callback: (event: MouseEvent) => {
                this.showThemesMenu(topBarElement.getBoundingClientRect());
            }
        });
    }

    showThemesMenu(rect: DOMRect) {
        let menu: Menu = new Menu("ThemeChange");
        const appearance = SIYUAN.config.appearance;
        const mode = appearance.mode === 0 ? 'light' : 'dark';
        const themes: string[] = mode === 'light' ? appearance.lightThemes : appearance.darkThemes;
        for (const theme of themes) {
            menu.addItem({
                label: theme,
                click: () => {
                    this.useTheme(theme, mode);
                }
            });
        }
        menu.addSeparator()
        menu.addItem({
                label: '试试手气~',
                icon: 'iconRefresh',
                click: () => this.random(mode),
        });
        if (isMobile()) {
            menu.fullscreen();
        } else {
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
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
