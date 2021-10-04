# angular-simple-pdf-reader

## 개요

웹 클라이언트 프레임워크인 Angular를 이용해, 국제 표준 전자 문서 형식인 PDF를 읽기, 저장, 공유 가능한 웹 서비스를 개발.

## 환경설정

| name | version |
|---|---|
| Angular | 12.2.9 |
| Node | v14.17.3 |
| Npm | 6.14.13 |

## 실행

```
ng serve
```

![image](https://user-images.githubusercontent.com/91445932/146306759-729e253b-12e8-4c4f-b36f-84630571575c.png)

#### 파일 업로드

Open File 클릭, PDF 업로드

![image](https://user-images.githubusercontent.com/91445932/146306807-0acc58d5-c162-4bb3-8e8d-9203ae8496df.png)


#### 줌 기능

Fab Button 클릭, 버튼에 따라 너비,길이,비율에 맞게 이미지 썸네일 렌더링

![image](https://user-images.githubusercontent.com/91445932/146307747-3d05ec56-bb00-4e11-8cb0-b1c61e776d61.png)


{
  "name": "client",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "remote": "ng serve --host 0.0.0.0",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "~12.2.0",
    "@angular/cdk": "^12.2.9",
    "@angular/common": "~12.2.0",
    "@angular/compiler": "~12.2.0",
    "@angular/core": "~12.2.0",
    "@angular/flex-layout": "^11.0.0-beta.33",
    "@angular/forms": "~12.2.0",
    "@angular/material": "^12.2.9",
    "@angular/platform-browser": "~12.2.0",
    "@angular/platform-browser-dynamic": "~12.2.0",
    "@angular/router": "~12.2.0",
    "pdfjs-dist": "^2.10.377",
    "rxjs": "~6.6.0",
    "socket.io": "^4.3.1",
    "socket.io-client": "^4.3.2",
    "tslib": "^2.3.0",
    "zone.js": "~0.11.4"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "~12.2.8",
    "@angular/cli": "~12.2.8",
    "@angular/compiler-cli": "~12.2.0",
    "@types/jasmine": "~3.8.0",
    "@types/node": "^12.11.1",
    "codelyzer": "^6.0.0",
    "jasmine-core": "~3.8.0",
    "karma": "~6.3.0",
    "karma-chrome-launcher": "~3.1.0",
    "karma-coverage": "~2.0.3",
    "karma-jasmine": "~4.0.0",
    "karma-jasmine-html-reporter": "~1.7.0",
    "protractor": "~7.0.0",
    "ts-node": "~8.3.0",
    "tslint": "~6.1.0",
    "typescript": "~4.3.5"
  }
}
