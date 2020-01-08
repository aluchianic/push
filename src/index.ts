// @diode index.ts
const subscriptionButton = document.getElementById('subscriptionButton');

/**
 * This function is needed because Chrome doesn't accept a base64 encoded string
 * as value for applicationServerKey in pushManager.subscribe yet
 * https://bugs.chromium.org/p/chromium/issues/detail?id=802280
 *
 * @param base64String
 * @return Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    // @ts-ignore
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Get the `registration` from service worker and create a new
 * subscription using `registration.pushManager.subscribe`. Then
 * register received new subscription by sending a POST request with
 * the subscription to the server.
 *
 * @return Promise<void>
 */
async function subscribe(): Promise<void> {
    const registration = await navigator.serviceWorker.ready
    // Get the server's public key
    const response = await fetch('./vapidPublicKey');
    const vapidPublicKey = await response.text();
    // Chrome doesn't accept the base64-encoded (string) vapidPublicKey yet
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    // Subscribe the user
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey // ?optional
    });
    console.log('Subscribed', subscription.endpoint);
    await fetch('register', {
        method: 'post',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            subscription: subscription
        })
    });
    return setUnsubscribeButton()
}

/**
 * Get existing subscription from service worker, unsubscribe
 * (`subscription.unsubscribe()`) and unregister it in the server with
 * a POST request to stop sending push messages to
 * unexisting endpoint.
 *
 * @return Promise<void>
 */
async function unsubscribe(): Promise<void> {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
        console.error('[unsubscribe]' +
            ' registration.pushManager.getSubscription() return null' +
            ' subscription. Exiting...',)
        return;
    }

    await subscription.unsubscribe()
    console.log('Unsubscribed', subscription.endpoint);
    await fetch('unregister', {
        method: 'post',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            subscription: subscription
        })
    });

    return setSubscribeButton()
}

// Change the subscription button's text and action.
async function setSubscribeButton(): Promise<void> {
    subscriptionButton!.onclick = await subscribe;
    subscriptionButton!.textContent = 'Subscribe!';
}

async function setUnsubscribeButton(): Promise<void> {
    subscriptionButton!.onclick = await unsubscribe;
    subscriptionButton!.textContent = 'Unsubscribe!';
}

const app = (async () => {
    // Service Worker registration
    let swRegistration: ServiceWorkerRegistration | null = null;

    // Exit if browser doesn't have Notification API
    if (!('Notification' in window)) {
        console.log('[Notification Service] Notifications not supported in' +
            ' this browser');
        return;
    }

    if ('serviceWorker' in navigator) {
        console.log('Service Worker and Push is supported');
        // Register a Service Worker.
        swRegistration = await navigator.serviceWorker.register('sw.js');

        /**
         * When the Service Worker is ready, enable the UI (button),
         * and see if we already have a subscription set up.
         */
        const registration = await navigator.serviceWorker.ready
        console.log('service worker registered', swRegistration);
        subscriptionButton!.removeAttribute('disabled');

        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            console.log('Already subscribed', subscription.endpoint);
            await setUnsubscribeButton();
        } else {
            await setSubscribeButton();
        }
    } else {
        console.warn('Push messaging is not supported');
    }
})();
