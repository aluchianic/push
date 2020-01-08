import * as webPush from 'web-push'
import * as express from 'express';
import * as bodyParser from 'body-parser'

const app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname));

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log("Setting up set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
        "environment variables.");

    const { publicKey, privateKey } = webPush.generateVAPIDKeys()

    process.env.VAPID_PUBLIC_KEY = publicKey;
    process.env.VAPID_PRIVATE_KEY = privateKey;
}

// Set the keys used for encrypting the push messages.
webPush.setVapidDetails(
    'https://serviceworke.rs/',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Global array collecting all active endpoints. In real world
// application one would use a database here.

const subscriptions: { [key: string]: webPush.PushSubscription } = {};

// How often (in seconds) should the server send a notification to the
// user.
const pushInterval = 10;

// Send notification to the push service. Remove the subscription from the
// `subscriptions` array if the  push service responds with an error.
// Subscription has been cancelled or expired.
function sendNotification(subscription: webPush.PushSubscription) {
    webPush.sendNotification(subscription)
        .then(function () {
            console.log('Push Application Server - Notification sent to ' + subscription.endpoint);
        }).catch(function () {
        console.log('ERROR in sending Notification, endpoint removed ' + subscription.endpoint);
        delete subscriptions[subscription.endpoint];
    });
}

// To simulate it, server is sending a notification every `pushInterval` seconds
// to each registered endpoint.
setInterval(function () {
    Object.values(subscriptions).forEach(sendNotification);
}, pushInterval * 1000);

app.get('/vapidPublicKey', function (req: express.Request, res: express.Response) {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

// Register a subscription by adding it to the `subscriptions` array.
app.post('/register', function (req: express.Request, res: express.Response) {
    var subscription = req.body.subscription;
    if (!subscriptions[subscription.endpoint]) {
        console.log('Subscription registered ' + subscription.endpoint);
        subscriptions[subscription.endpoint] = subscription;
    }
    console.log('Subscriptions :', subscription)
    res.sendStatus(201);
});

// Unregister a subscription by removing it from the `subscriptions` array
app.post('/unregister', function (req: express.Request, res: express.Response) {
    var subscription = req.body.subscription;
    if (subscriptions[subscription.endpoint]) {
        console.log('Subscription unregistered ' + subscription.endpoint);
        delete subscriptions[subscription.endpoint];
    }
    res.sendStatus(201);
});

const server = app.listen(8081, () => {

    const host = server.address().address;
    const port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});
