# Luna Log

Luna Log 是一个本地优先的移动端记录应用 Demo，用于记录亲密生活、月经周期和身体状态。项目基于 Expo SDK 57 和 React Native 开发，支持手机外观的 Web 预览，也可以构建 Android / iOS App。

## 当前功能

- 首页时间线：展示最近的性生活、经期和症状记录。
- LifeLog 风格日历：点击日期后显示当天状态卡片。
- 月经周期记录：支持经期、易孕期、排卵日和下次经期预测。
- 做爱和自慰独立入口：添加按钮分开，记录类型更清晰。
- Aphrodite 风格亲密记录表单：支持持续时间、保护措施、姿势、心情、高潮、道具、备注和计时器。
- 统计页：支持按周、按月、按年查看次数、持续时间和时间分布，并区分做爱 / 自慰。
- 三套视觉风格：原版、薄荷、蓝色。
- 关于与更新中心：右上角图标进入，可查看版本信息、检查更新、发布说明、下载链接和来源诊断。
- 本地存储：使用 AsyncStorage 保存数据。

## 项目信息

- GitHub 仓库：`https://github.com/cnxin/luna-log`
- 应用名称：`Luna Log`
- Expo slug：`luna-log`
- 当前版本：`1.0.0`
- Android 包名：`com.anonymous.lunalog`

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

其他常用命令：

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

```bash
cd android
.\gradlew.bat assembleRelease
```

Release APK 输出位置：

```text
android/app/build/outputs/apk/release/app-release.apk
```

构建 Debug APK：

```bash
cd android
.\gradlew.bat assembleDebug
```

Debug APK 输出位置：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## 下载

当前版本 Release：

```text
https://github.com/cnxin/luna-log/releases/tag/v1.0.0
```

Android APK：

```text
https://github.com/cnxin/luna-log/releases/download/v1.0.0/luna-log-v1.0.0-release.apk
```

## 更新清单

应用内更新中心会先读取 GitHub Raw，再读取 jsDelivr 作为备用源：

```text
https://raw.githubusercontent.com/cnxin/luna-log/master/update-manifest.json
https://cdn.jsdelivr.net/gh/cnxin/luna-log@master/update-manifest.json
```

发布新版本时，需要同步更新：

- `package.json`
- `app.json`
- `APP_VERSION` in `App.tsx`
- `update-manifest.json`

当前更新中心是轻量实现：只比较远程清单版本号，并打开 Release / APK 下载链接；暂未接入原生 OTA 或应用内安装流程。

## 说明

这是一个 Demo 项目，数据默认保存在本机。月经预测和周期状态仅用于记录辅助，不应作为医学判断依据。
