const subscriptionButton = document.getElementById('subscriptionButton');

// This function is needed because Chrome doesn't accept a base64 encoded string
// as value for applicationServerKey in pushManager.subscribe yet
// https://bugs.chromium.org/p/chromium/issues/detail?id=802280
function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Get the `registration` from service worker and create a new
// subscription using `registration.pushManager.subscribe`. Then
// register received new subscription by sending a POST request with
// the subscription to the server.
function subscribe() {
    navigator.serviceWorker.ready
        .then(async registration => {
            // Get the server's public key
            const response = await fetch('./vapidPublicKey');
            const vapidPublicKey = await response.text();
            // Chrome doesn't accept the base64-encoded (string) vapidPublicKey yet
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            // Subscribe the user
            return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
        })
        .then(subscription => {
            console.log('Subscribed', subscription.endpoint);
            return fetch('register', {
                method: 'post',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: subscription
                })
            });
        })
        .then(setUnsubscribeButton);
}

// Get existing subscription from service worker, unsubscribe
// (`subscription.unsubscribe()`) and unregister it in the server with
// a POST request to stop sending push messages to
// unexisting endpoint.
function unsubscribe() {
    navigator.serviceWorker.ready
        .then(registration => registration.pushManager.getSubscription())
        .then(subscription => {
            return subscription.unsubscribe().then(function () {
                console.log('Unsubscribed', subscription.endpoint);
                return fetch('unregister', {
                    method: 'post',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        subscription: subscription
                    })
                });
            });
        })
        .then(setSubscribeButton);
}

// Change the subscription button's text and action.
function setSubscribeButton() {
    subscriptionButton.onclick = subscribe;
    subscriptionButton.textContent = 'Subscribe!';
}

function setUnsubscribeButton() {
    subscriptionButton.onclick = unsubscribe;
    subscriptionButton.textContent = 'Unsubscribe!';
}

const app = (async () => {
    // Service Worker registration
    let swRegistration = null;

    // Exit if browser doesn't have Notification API
    if (!('Notification' in window)) {
        console.log('[Notification Service] Notifications not supported in' +
            ' this browser');
        return;
    }

    if ('serviceWorker' in navigator) {
        console.log('Service Worker and Push is supported');
        // Register a Service Worker.
        swRegistration = await navigator.serviceWorker.register('service-worker.js');

        // When the Service Worker is ready, enable the UI (button),
        // and see if we already have a subscription set up.
        navigator.serviceWorker.ready
            .then(function (registration) {
                console.log('service worker registered', swRegistration);
                subscriptionButton.removeAttribute('disabled');

                return registration.pushManager.getSubscription();
            })
            .then(function (subscription) {
                if (subscription) {
                    console.log('Already subscribed', subscription.endpoint);
                    setUnsubscribeButton();
                } else {
                    setSubscribeButton();
                }
            });
    } else {
        console.warn('Push messaging is not supported');
    }
})();
