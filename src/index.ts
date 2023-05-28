import { Plugin, Menu } from "siyuan";
import { svg } from "./const";
import { request } from "./api";
import "./index.scss";

// @ts-ignore
const SIYUAN = window.siyuan;

export default class ThemeChangePlugin extends Plugin {

    onload() {
        this.addTopBar({
            icon: svg,
            title: "主题切换",
            callback: () => {
                this.showThemesMenu();
            }
        });
    }

    showThemesMenu() {
        let menu: Menu = new Menu("ThemeChange");
        const appearance = SIYUAN.config.appearance;
        const mode = appearance.mode === 0 ? 'light' : 'dark';
        const themes: string[] = mode === 'light' ? appearance.lightThemes : appearance.darkThemes;
        for (let theme of themes) {
            menu.addItem({
                label: theme,
                click(theme) {
                    this.useTheme(theme, mode);
                }
            });
        }
    }

    useTheme(theme, mode) {
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
}
