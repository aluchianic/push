/*
Copyright 2018 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
const webPush = require('web-push');

const pushSubscription = {
    "endpoint": "https://fcm.googleapis.com/fcm/send/fg22v_j6CXc:APA91bGD-txGYI0Ds4irIxXVOlMfpxGfI-XT--FeutwCaWEz2F_TcnbmlSMZnnHPh12KnV3C1zYrrnogKmxv3zMIBm5zkk-3oETEAvKrZH4gM_xidRdwrcGjDsL6I0LzrrG31deSKtbS",
    "expirationTime": null,
    "keys": {
        "p256dh": "BLp-U0Xc5rH0Gbdn1mBv07jNzC3DerHXKuV48-0Fi8CDQH5NaYA3uoKO30vu-BLho8EAYcWH2dnHExNVRiXgtrY",
        "auth": "EXZRKiiF5WzDiTsURl17aw"
    }
};

const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';
const vapidPrivateKey = 'YOUR_VAPID_PRIVATE_KEY';

const payload = 'Here is a payload!';

function generateVAPIDKeys() {
    const vapidKeys = webPush.generateVAPIDKeys();

    return {
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey,
    };
}

const {publicKey, privateKey} = generateVAPIDKeys()
const options = {
    // gcmAPIKey: 'YOUR_SERVER_KEY',
    TTL: 60,
    vapidDetails: {
        subject: 'mailto:YOUR_EMAIL_ADDRESS',
        publicKey,
        privateKey
    }
};

webPush.sendNotification(
    pushSubscription,
    payload,
    options
);
