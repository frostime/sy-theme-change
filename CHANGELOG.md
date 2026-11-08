## v0.5.0

适配思源 3.7+ 与新版集市接口：

- 修复思源 3.8.0 起安装主题时报错 `Fields [mode] and [modeOS] must be provided together`
- 安装主题失败时显示内核返回的错误，而不是提示安装成功
- 安装主题时补全 `modeOS`、`repoRef` 与当前前端，并按照主题支持的模式选择安装模式
- 使用 `/api/setting/setTheme` 切换主题，不再重载界面
- 使用思源提供的本地化主题名称，并在列表中隐藏与当前前端不兼容的主题

---

Adapt to SiYuan 3.7+ and the latest marketplace API:

- Fix `Fields [mode] and [modeOS] must be provided together` when installing a theme on SiYuan 3.8.0+
- Show the kernel error when installation fails instead of reporting success
- Send `modeOS`, `repoRef`, and the current frontend when installing, and pick an install mode supported by the theme
- Switch themes with `/api/setting/setTheme` instead of reloading the UI
- Use the localized theme names provided by SiYuan and hide themes incompatible with the current frontend

## v0.1.1

优化安装主题的功能

---

Improve the function of installing theme

## v0.1.0 支持移动端

现在你可以在移动端快速更换主题了
