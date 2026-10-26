# Android APK 만들기 (Windows)

기존 게임을 Capacitor 8.5.3의 Android WebView 안에서 실행합니다. 앱 이름은 **오늘의 한 방**, 패키지 이름은 `com.diplegames.onlyai`입니다. Node.js 22 이상과 Android Studio, Android SDK 36, JDK 21이 필요합니다. JDK는 Android Studio에 포함된 것을 사용할 수 있습니다.

## 1. 게임 폴더 업데이트

VS Code에서 Git으로 복제한 `OnlyAI` 폴더를 열고 **Git: Pull**을 실행합니다. Android Studio에서 새 프로젝트를 만들지 않습니다.

## 2. Node.js 확인

VS Code에서 **터미널 → 새 터미널**을 열어 실행합니다.

```powershell
node --version
npm --version
```

Node.js가 없거나 22 미만이면 https://nodejs.org/ 에서 LTS 버전을 설치하고 VS Code를 다시 여세요. 터미널 경로가 `package.json`이 있는 게임 폴더인지 확인합니다.

## 3. 패키지 설치와 게임 복사

```powershell
npm ci
npm run android:sync
```

첫 번째 명령은 잠금 파일대로 도구를 설치합니다. 두 번째 명령은 게임을 `www`에 만들고 `android` 프로젝트로 복사합니다. `www`와 Android 내부의 웹 파일 복사본은 생성물이므로 직접 수정하지 마세요.

## 4. Android Studio에서 열기

시작 화면의 **Open**을 눌러 **OnlyAI 폴더 안의 `android` 폴더**를 선택합니다. `index.html`이나 저장소 최상위 폴더를 선택하지 않습니다.

처음 열면 Gradle과 필요한 Android 구성 요소를 다운로드합니다. SDK 설치 안내가 나오면 Android SDK Platform 36 및 요청된 Build Tools를 설치합니다. Gradle JDK는 JDK 21을 사용합니다. Android Studio의 기본 JDK가 21이면 그대로 사용하고, 다르면 Gradle JDK 설정에서 JDK 21을 선택하거나 다운로드합니다. SDK 경로는 개인 PC에서 자동 설정되며 `local.properties`를 Git에 올리지 않습니다.

아래 명령으로도 설치된 Android Studio를 열 수 있습니다.

```powershell
npm run android:open
```

## 5. 휴대폰 테스트

에뮬레이터를 생성하거나 개발자 옵션/USB 디버깅을 켠 Android 기기를 연결한 뒤 Android Studio의 실행 버튼을 누릅니다. 기기에서 터치, 타이밍 게이지 ON/OFF, 효과음, 화면 회전, 항공뷰 복귀 뒤 투구 준비 동작을 확인합니다. WebGL 2를 지원하는 Android System WebView와 GPU가 필요합니다. 게임 파일은 앱에 포함되므로 실행 중 CDN 연결은 필요 없습니다.

## 6. 테스트용 APK 만들기

프로젝트 동기화가 끝난 뒤 VS Code의 PowerShell에서 실행할 수 있습니다.

```powershell
cd android
.\gradlew.bat assembleDebug
```

생성 위치:

```text
OnlyAI/android/app/build/outputs/apk/debug/app-debug.apk
```

Android Studio의 Build 메뉴에서 APK 생성 기능을 사용해도 됩니다. 테스트용 APK는 디버그 키로 서명됩니다.

## 7. 배포용 APK 또는 Play 스토어 AAB

Android Studio의 **Build → Generate Signed App Bundle or APK**에서 APK 또는 Android App Bundle을 선택합니다. 서명 키를 만들고 `release`로 빌드합니다. 키 파일과 비밀번호는 본인이 안전하게 보관하고 Git에는 올리지 마세요. 같은 앱을 업데이트할 때 같은 서명 키를 사용합니다. 배포 버전을 올릴 때 `android/app/build.gradle`의 `versionCode`와 `versionName`을 갱신합니다. 기본 프로젝트는 배포용 서명 비밀번호를 저장하지 않습니다.

## 게임 업데이트 후

VS Code에서 Git Pull을 받은 뒤 저장소 최상위 폴더에서 실행합니다.

```powershell
npm ci
npm run android:sync
```

이후 Android Studio에서 다시 실행하거나 APK를 빌드합니다. 웹 게임만 테스트할 때는 기존 Live Server를 계속 사용할 수 있습니다.
