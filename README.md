# Luna Log

Luna Log 是一个本地优先的移动端记录应用 Demo，用于记录亲密生活、月经周期和身体状态。项目基于 Expo SDK 57 和 React Native 开发，支持手机外观的 Web 预览，也可以构建 Android / iOS App。

## 当前版本

- 应用版本：`1.0.8`
- Android versionCode：`11`
- Android 包名：`com.anonymous.lunalog`
- GitHub 仓库：`https://github.com/cnxin/luna-log`
- Gitee 镜像：`https://gitee.com/ysjugg/luna-log`

## 主要功能

- 首页时间线：展示最近的性生活、经期、每日经期状态和症状记录。
- LifeLog 风格日历：点击日期后显示当天周期状态、性生活记录和经期信息。
- 月经周期记录：支持经期开始/结束、易孕期、排卵日和下次经期预测。
- 每日经期状态：经期内每天可记录经量、痛经程度、症状和备注，也可以删除当天状态。
- 做爱和自慰独立入口：添加按钮分开，记录类型更清晰。
- Aphrodite 风格亲密记录表单：支持次数、持续时间、保护措施、姿势、心情、高潮、道具、备注和计时器。
- 统计页：支持按周、按月、按年查看次数、持续时间和时间分布，并区分做爱 / 自慰。
- 视觉风格：支持原版、薄荷、蓝色三套主题。
- 数据管理：支持 JSON 数据导入/导出，本地备份和恢复。
- 更新检查：关于页可检查更新、查看来源诊断，并跳转到官方发布页完成下载和安装。

## 1.0.8 更新

- 优化 App 图标：缩小并内移左右月牙，避免圆角裁切后露出边界。
- 整体图案上移，让图标视觉重心更接近居中。
- 同步更新 Android 原生启动图标资源。
- 更新 Android `versionCode` 到 `9`，支持从 `1.0.7` 正常升级安装。

## 1.0.7 更新

- 修复 Android 原生启动图标未同步的问题，APK 会显示新的月相三态 App 图标。
- 保留 1.0.6 的内置更新安装流程修复，下载 APK 后直接拉起系统安装器。
- 更新 Android `versionCode` 到 `8`，支持从 `1.0.6` 正常升级安装。

## 1.0.6 更新

- 修复内置升级下载 APK 后弹出“打开方式”的问题，Android 端会直接拉起系统安装器。
- 新增安装未知应用权限配置，未授权时提示允许 Luna Log 安装未知应用。
- 更新 Android `versionCode` 到 `7`，支持从 `1.0.5` 正常升级安装。
## 1.0.5 更新

- 修复内置升级下载一直停在 0% 后失败的问题：优先读取 Gitee 国内镜像清单，APK 下载使用 GitHub Release。
- 修复日历日期和星期标题不对齐、真机上一行只显示 6 个日期的问题。
- 日历改为按周固定 7 列渲染，星期标题和日期格使用一致的列间距。
- Android `versionCode` 更新到 `6`，支持从 `1.0.4` 正常升级安装。

## 1.0.4 更新

- 新增经期内每天的经量、痛经、症状和备注记录。
- 日历中可直接编辑或删除选中日期的每日经期状态。
- 内置升级支持多来源检查、备用源重试和下载进度展示。
- 更新清单兼容 `apkUrl`、`mirrorApkUrl`、`apkName`、`apkSize`、`apkSha256` 字段。
- Android `versionCode` 更新到 `5`，支持从 `1.0.3` 正常升级安装。

## 下载

当前版本 Release：

```text
https://github.com/cnxin/luna-log/releases/tag/v1.0.8
```

Android APK：

```text
https://github.com/cnxin/luna-log/releases/download/v1.0.8/luna-log-v1.0.8-release.apk
```


APK 校验：

```text
SHA256: e76d4fef561b1eeebb37cadade0b3b0b68b287cd809b27ff6e8f9fd7ca0d34d8
Size: 76502864 bytes
```

## 开发运行

安装依赖：

```bash
npm install
```

启动手机外观 Web 预览：

```bash
npm run web:preview
```

默认访问地址：

```text
http://127.0.0.1:8090
```

常用命令：

```bash
npm run web
npm run android
npm run ios
npx tsc --noEmit
```

## Android APK 构建

首次构建前生成 Android 原生工程：

```bash
npx expo prebuild --platform android
```

构建 Release APK：

```powershell
cd android
.\gradlew.bat :app:assembleRelease
```

Release 构建必须先配置正式签名凭据，详见 `docs/release-signing.md`。

Release APK 输出位置：

```text
android/app/build/outputs/apk/release/app-release.apk
```

## 更新检查

应用内只读取官方 GitHub Release API，并只跳转到官方发布页完成下载和安装：

```text
https://api.github.com/repos/cnxin/luna-log/releases/latest
```

发布新版本时需要同步更新：

- `package.json`
- `package-lock.json`
- `app.json`
- `APP_VERSION` in `App.tsx`
- `RELEASE_NOTES` in `App.tsx`
- Android 本地构建配置中的 `versionCode` / `versionName`

## 说明

这是一个 Demo 项目，数据默认保存在本机。月经预测和周期状态仅用于记录辅助，不应作为医学判断依据。
