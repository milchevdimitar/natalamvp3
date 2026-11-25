# Natala 2027 — локална среда

Checkout `natala_merge_pr4/natalamvp3`, клон `feature/natala-atlas-2027`. Пускането на локалната версия използва отделна база `natala_dev_2027`. Процесите могат да вървят в отделни PowerShell терминали.

## MongoDB и API

При наличен MongoDB Community Server стартирай `mongod.exe` с отделна локална директория за данните и `--bind_ip 127.0.0.1 --port 27017`. [MongoDB Community за Windows](https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-windows-zip/)

От `BACKEND/server`:

```powershell
$env:MONGODB_URI = 'mongodb://127.0.0.1:27017/natala_dev_2027'
$env:NODE_ENV = 'development'
$env:PORT = '5000'
npm.cmd run dev
```

Провери `http://localhost:5000/api/health`. Очакваният отговор съдържа `dbConnected: true` и `databaseName: natala_dev_2027`. Създавай само фиктивни акаунти, например с домейн `example.test`. Ако се използва чиста локална конфигурация, `GET /api/account/methods` показва дали се очаква имейл код.

## Expo Go и web

От `APP`:

```powershell
$env:EXPO_PUBLIC_NATALA_LOCAL_ONLY = '1'
npx.cmd expo start --go --lan --web --port 8082
```

Отвори `http://localhost:8082` за web. За Expo Go използвай QR от този процес. Web ползва localhost за API, а телефонът използва LAN адреса от Expo. Ако Expo рекламира друг мрежов адаптер, задай `EXPO_PUBLIC_NATALA_LOCAL_IP` с IPv4 адрес на лаптопа и по желание порт, преди рестарт на Metro. Тази променлива има смисъл само за local-only dev build. При превключване между dev режими рестартирай Metro и презареди клиента.

На Login статусът трябва да бъде **Local**. Спрян API води до недостъпен Local статус при следващо зареждане. Сесиите се съхраняват по API адрес. В Network проверявай /health, /account/email, /account/me, /users/profile и /account/tab-activity.

## Проверки за тази итерация

- Локалната база потвърди името си през localhost и LAN адреса на API. Два фиктивни акаунта преминаха register, login, session restore, profile и tab-activity през HTTP.

- APP `npm.cmd run typecheck` има 62 съществуващи TypeScript диагностики преди и след промяната: TS2551 (19), TS2305 (8), TS2561 (1), TS7053 (14), TS2322 (6), TS2769 (1), TS2559 (13).
- Backend `npm.cmd run typecheck` преминава. `node --import tsx --test tests/natal.test.js` преминава с три теста. При Windows sandbox грешка `uv_os_get_passwd` тестовете работят извън sandbox.
- Expo на 8082 обслужи обновения web bundle и Android manifest. Проверка с подменени зависимости установи, че boot от web и Android изпраща само локалния /health при недостъпен API и игнорира запазен override в local-only режим.
- Сценарии за приемане в билет 01: Today → детайл → назад, Atlas → система → назад, Atlas → Watch → назад, Circle → Messages → разговор → профил → същия разговор, Dating → детайл → назад, QR → споделен профил и камбанка → известие → точния екран. Провери UI Back и Android Back, както и маркирания таб.
