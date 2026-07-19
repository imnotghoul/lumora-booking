# Lumora Mobile

Нативное приложение онлайн-записи для Android и iOS на React Native + Expo Router. Оно использует общий Next.js API из корня репозитория; веб-интерфейс остаётся административной панелью.

## Запуск на физическом телефоне

Требуются Node.js 20.19+ и приложение **Expo Go** на телефоне. Компьютер и телефон должны находиться в одной Wi-Fi сети.

В первом PowerShell-окне из корня проекта запустите API, доступный локальной сети:

```powershell
npm.cmd run dev:api
```

Во втором PowerShell-окне запустите Metro/Expo:

```powershell
npm.cmd run mobile:start
```

Откройте Expo Go и отсканируйте QR-код из терминала. Мобильный клиент автоматически получает IP компьютера из Expo и подключается к порту `3000`.

Если API не обнаружился автоматически:

1. Узнайте IPv4 компьютера командой `ipconfig`.
2. Создайте `mobile/.env`:

   ```powershell
   Copy-Item mobile/.env.example mobile/.env
   ```

3. Замените адрес в файле на IP компьютера, например:

   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
   ```

4. Перезапустите Expo с очисткой кэша: `cd mobile; npx.cmd expo start -c`.

Windows может один раз запросить разрешение брандмауэра для Node.js — разрешите доступ в частной сети.

## Проверки

```powershell
npm.cmd run mobile:lint
npm.cmd run mobile:typecheck
cd mobile
npx.cmd expo export --platform android
```

## APK / App Store

Конфигурация EAS находится в `mobile/eas.json`, package identifiers — в `mobile/app.json`.

```powershell
cd mobile
npx.cmd eas-cli@latest build --platform android --profile preview
npx.cmd eas-cli@latest build --platform all --profile production
```

Для опубликованного приложения укажите HTTPS-адрес production API в `EXPO_PUBLIC_API_URL`; локальный HTTP предназначен только для разработки в одной сети.
