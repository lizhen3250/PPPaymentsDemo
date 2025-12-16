async function onPayPalWebSdkLoaded() {
    try {
        const clientToken = await getBrowserSafeClientToken();
        const sdkInstance = await window.paypal.createInstance({
            clientToken,
            components: ["paypal-payments"],
            pageType: "checkout",
            testBuyerCountry: "US"
        });
        const paymentMethods = await sdkInstance.findEligibleMethods({
            currencyCode: "USD",
        });
        const paypalPaymentSession = sdkInstance.createPayPalOneTimePaymentSession(
            paymentSessionOptions,
        );

        if (paypalPaymentSession.hasReturned()) {
            showNotification("Returned from APP!");
            await paypalPaymentSession.resume();
        } else {
            setupPayPalButton(paypalPaymentSession);
            if (paymentMethods.isEligible("paylater")) {
                const paylaterPaymentMethodDetails =
                    paymentMethods.getDetails("paylater");
                setupPayLaterButton(sdkInstance, paylaterPaymentMethodDetails);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function setupPayLaterButton(sdkInstance, paylaterPaymentMethodDetails) {
    const paylaterPaymentSession =
        sdkInstance.createPayLaterOneTimePaymentSession(paymentSessionOptions);

    const { productCode, countryCode } = paylaterPaymentMethodDetails;
    showNotification("product code & countryCode: " + `${productCode} ${countryCode}`);
    const paylaterButton = document.querySelector("#paylater-button");

    paylaterButton.productCode = productCode;
    paylaterButton.countryCode = countryCode;
    paylaterButton.removeAttribute("hidden");

    paylaterButton.addEventListener("click", async () => {
        showNotification("clicked pay later");
        const enableAutoRedirect = document.querySelector("#enable-auto-redirect");
        const createRedirectOrderPromise = createRedirectOrder();

        try {
            const { redirectURL } = await paylaterPaymentSession.start(
                {
                    presentationMode: "direct-app-switch",//"direct-app-switch",
                    autoRedirect: {
                        enabled: enableAutoRedirect.checked,
                    },
                },
                createRedirectOrderPromise,
            );
            console.log("redirect url: ", redirectURL);
            if (redirectURL) {
                console.log(`redirectURL: ${redirectURL}`);
                window.location.assign(redirectURL);
            }
        } catch (error) {
            console.error(error);
        }
    });
}

const paymentSessionOptions = {
    async onApprove(data) {
        console.log("onApprove", data);
        //get order details to confirm order status whether completed or not
        //if (order status == completed)
        //redirect thank you page.
        //else capture
        const orderStatus = await getOrderDetails({
            orderId: data.orderId
        });
        showNotification(orderStatus);
        if (orderStatus == 'APPROVED') {
            showNotification("Order Approved!");
            const orderData = await captureOrder({
            orderId: data.orderId,
            });
            console.log("Capture result", orderData);
        } else if (orderStatus == 'COMPLETED') {
            showNotification("Order already captured!");
        }

        
    },
    onCancel(data) {
        showNotification("Cancel payment");
        console.log("onCancel", data);
    },
    onError(error) {
        console.log("onError", error);
    },
};

async function setupPayPalButton(paypalPaymentSession) {
    const enableAutoRedirect = document.querySelector("#enable-auto-redirect");
    const paypalButton = document.querySelector("#paypal-button");
    paypalButton.removeAttribute("hidden");

    paypalButton.addEventListener("click", async () => {
        // get the promise reference by invoking createRedirectOrder()
        // do not await this async function since it can cause transient activation issues
        const createRedirectOrderPromise = createRedirectOrder();

        try {
            const { redirectURL } = await paypalPaymentSession.start(
                {
                    presentationMode: "direct-app-switch",//"direct-app-switch",
                    autoRedirect: {
                        enabled: enableAutoRedirect.checked,
                    },
                },
                createRedirectOrderPromise,
            );
            console.log("redirect url: ", redirectURL);
            if (redirectURL) {
                console.log(`redirectURL: ${redirectURL}`);
                window.location.assign(redirectURL);
            }
        } catch (error) {
            console.error(error);
        }
    });
}

async function getBrowserSafeClientToken() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Basic QVpRQk1VTEh6dEtOTV9VNl92VlQ5MXBXYVk1QkVYNXdPMzdwR1RNMGhzdFI2UGpKQ2xoWHB2cEotWHpvTmJkemRCSnRqaGlaZWtTQWpUYUg6RUtWREoxd3pnVU9pVlAyZ1ZwZDFnMDA4U1FmT3Q4b3RDTEMyVHBSNjAyejNuRXRHQ2o0Q0RnYWtGSXdyaUc2b0ZhSVpqVG93UzctamtlaE4=");
    const urlencoded = new URLSearchParams();
    urlencoded.append("response_type", "client_token");
    urlencoded.append("grant_type", "client_credentials");
    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow"
    };
    return fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", requestOptions).then(function (response) {
        return response.json();
    }).then(function (data) {
        console.log(data.access_token);
        return data.access_token;
    })
}

async function getAccessToken() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Basic QVpRQk1VTEh6dEtOTV9VNl92VlQ5MXBXYVk1QkVYNXdPMzdwR1RNMGhzdFI2UGpKQ2xoWHB2cEotWHpvTmJkemRCSnRqaGlaZWtTQWpUYUg6RUtWREoxd3pnVU9pVlAyZ1ZwZDFnMDA4U1FmT3Q4b3RDTEMyVHBSNjAyejNuRXRHQ2o0Q0RnYWtGSXdyaUc2b0ZhSVpqVG93UzctamtlaE4=");
    const urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");
    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow"
    };
    const tokenResponse = await fetch("https://api.sandbox.paypal.com/v1/oauth2/token", requestOptions);
    const tokenResult = await tokenResponse.json();
    const accessToken = tokenResult.access_token;
    return accessToken;
}

async function createRedirectOrder() {
    const token = await getAccessToken();
    const bearer = "Bearer " + token;
    console.log(token);
    const myHeaders = new Headers();
    myHeaders.append("Authorization", bearer);
    myHeaders.append("Content-Type", "application/json");
    console.log("href: ", window.location.href);
    const payload = generatePayload();
    const raw = JSON.stringify(payload);
    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };
    return fetch("https://api.sandbox.paypal.com/v2/checkout/orders", requestOptions).then(function (response) {
        return response.json();
    }).then(function (data) {
        console.log(data);
        console.log(data.id);
        showNotification("Order Created!");
        return { orderId: data.id };
    })
}

async function getOrderDetails({ orderId }) {
    const token = await getAccessToken();
    const orderDetailsResponse = await fetch("https://api-3t.sandbox.paypal.com/v2/checkout/orders/" + orderId, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });
    const orderDetailsResult = await orderDetailsResponse.json();
    return orderDetailsResult.status;
}

async function captureOrder({ orderId }) {
    const token = await getAccessToken();
    const captureResponse = await fetch("https://api.sandbox.paypal.com/v2/checkout/orders/" + orderId + "/capture", {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    const captureResult = await captureResponse.json();
    jsonOutput.innerHTML = syntaxHighlight(JSON.stringify(captureResult, null, 2));
    currentJson = captureResult;
    var transaction = captureResult.purchase_units[0].payments.captures[0];
    document.getElementById('right-panel-para').innerHTML = '<p>PayPal Transaction ID: <b>' + transaction.id + "</b> Transaction Status: <b>" + transaction.status + "</b></p>";
    showNotification("Transaction Completed!");
}