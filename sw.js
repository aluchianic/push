async function sendSubscription() {
    const subscription = await self.registration.pushManager.subscribe({userVisibleOnly: true})
    console.log('[SW] Subscribed after expiration', subscription.endpoint);
    return fetch('register', {
        method: 'post',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            endpoint: subscription.endpoint
        })
    })
}

async function checkClientState() {
    // Retrieve a list of the clients of this service worker.
    const clientList = await self.clients.matchAll();
    // Check if there's at least one focused client.
    const focused = clientList.some(client => client.focused);

    let notificationMessage;
    /**
     * Show a notification with title 'ServiceWorker' and body depending
     * on the state of the clients of the service worker
     * three different bodies:
     * 1. the page is focused
     * 2. the page is still open but unfocused
     * 3. the page is closed
     */
    if (focused) {
        notificationMessage = 'You\'re still here, thanks!';
    } else if (clientList.length > 0) {
        notificationMessage = 'You haven\'t closed the page, ' +
            'click here to focus it!';
    } else {
        notificationMessage = 'You have closed the page, ' +
            'click here to re-open it!';
    }

    return self.registration.showNotification('ServiceWorker', {
        body: notificationMessage,
    });
}

async function actionOnState() {
    // Retrieve a list of the clients of this service worker.
    const clientList = await self.clients.matchAll()
    // If there is at least one client, focus it.
    if (clientList.length > 0) {
        return clientList[0].focus();
    }

    // Otherwise, open a new page.
    return self.clients.openWindow('../index.html');
}

/**
 * Listen to  `pushsubscriptionchange` event which is fired when
 * subscription expires. Subscribe again and register the new subscription
 * in the server by sending a POST request with endpoint. Real world
 * application would probably use also user identification.
 */
self.addEventListener('pushsubscriptionchange', async function (event) {
    console.log('[SW] Subscription expired');
    event.waitUntil(sendSubscription())
});

/**
 * Listen for the 'push' event that represents a push message that has been
 * received.
 * It contains the information sent from an application server to a
 */
self.addEventListener('push', async function (event) {
    console.log('[SW] push event:', event);
    console.log('[SW] permission :', self.Notification.permission);
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }
    event.waitUntil(checkClientState());
});

/**
 * Register event listener for the 'notificationclick' event.
 */
self.addEventListener('notificationclick', async function (event) {
    event.waitUntil(actionOnState());
});
