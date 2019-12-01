#!/bin/bash
ng build --eval-source-map --plugin ~build-customization-plugin.js
cordova build android
native-run android --app platforms/android/app/build/outputs/apk/debug/app-debug.apk
