async function onPayPalWebSdkLoaded() {
    try {
        const clientToken = await getClientToken();
        const sdkInstance = await window.paypal.createInstance({
            clientToken,
            components: ["paypal-payments", "paypal-guest-payments"],
            pageType: "checkout",
            testBuyerCountry: 'US'
        });

        const paymentMethods = await sdkInstance.findEligibleMethods({
            currencyCode: "USD",
        });

        console.log(paymentMethods);

        if (paymentMethods.isEligible("paypal")) {
            setupPayPalButton(sdkInstance);
        }

        if (paymentMethods.isEligible("paylater")) {
            const paylaterPaymentMethodDetails =
                paymentMethods.getDetails("paylater");
            setupPayLaterButton(sdkInstance, paylaterPaymentMethodDetails);
        }

        if (paymentMethods.isEligible("credit")) {
            const paypalCreditPaymentMethodDetails =
                paymentMethods.getDetails("credit");
            setupPayPalCreditButton(sdkInstance, paypalCreditPaymentMethodDetails);
        }
         setupGuestPaymentButton(sdkInstance);
    } catch (error) {
        console.error(error);
    }
}

const paymentSessionOptions = {
    async onApprove(data) {
        console.log("onApprove", data);
        const captureResult = await captureOrder(data.orderId);
        console.log("Capture result", captureResult);
        jsonOutput.innerHTML = syntaxHighlight(JSON.stringify(captureResult, null, 2));
        currentJson = captureResult;
        var transaction = captureResult.purchase_units[0].payments.captures[0];
        document.getElementById('right-panel-para').innerHTML = '<p>PayPal Transaction ID: <b>' + transaction.id + "</b> Transaction Status: <b>" + transaction.status + "</b></p>";
        showNotification("Transaction Completed!");
    },
    onCancel(data) {
        console.log("onCancel", data);
    },
    onError(error) {
        console.log("onError", error);
    },
};

async function setupPayPalButton(sdkInstance) {
    const paypalPaymentSession = sdkInstance.createPayPalOneTimePaymentSession(
        paymentSessionOptions,
    );

    const paypalButton = document.querySelector("#paypal-button-container");
    paypalButton.removeAttribute("hidden");

    paypalButton.addEventListener("click", async () => {
        try {
            await paypalPaymentSession.start(
                { presentationMode: "modal" },
                createOrder(),
            );
        } catch (error) {
            console.error(error);
        }
    });
}

async function setupPayLaterButton(sdkInstance, paylaterPaymentMethodDetails) {
    const paylaterPaymentSession =
        sdkInstance.createPayLaterOneTimePaymentSession(paymentSessionOptions);

    const { productCode, countryCode } = paylaterPaymentMethodDetails;
    const paylaterButton = document.querySelector("#paypal-paylater-button-container");

    paylaterButton.productCode = productCode;
    paylaterButton.countryCode = countryCode;
    paylaterButton.removeAttribute("hidden");

    paylaterButton.addEventListener("click", async () => {
        try {
            await paylaterPaymentSession.start(
                { presentationMode: "auto" },
                createOrder(),
            );
        } catch (error) {
            console.error(error);
        }
    });
}

// 2. Setup the payment session
async function setupGuestPaymentButton(sdkInstance) {
  // Create payment session with callbacks
  const paypalGuestPaymentSession = sdkInstance.createPayPalGuestOneTimePaymentSession(paymentSessionOptions);

  const paypalGuestPaymentButton = document.querySelector("#paypal-basic-card-button");

  paypalGuestPaymentButton.addEventListener("click", async () => {
        try {
            await paypalGuestPaymentSession.start(
                { presentationMode: "auto" },
                createOrder(),
            );
        } catch (error) {
            console.error(error);
        }
    });
}

async function setupPayPalCreditButton(
    sdkInstance,
    paypalCreditPaymentMethodDetails,
) {
    const paypalCreditPaymentSession =
        sdkInstance.createPayPalCreditOneTimePaymentSession(paymentSessionOptions);

    const { countryCode } = paypalCreditPaymentMethodDetails;
    const paypalCreditButton = document.querySelector("#paypal-credit-button");

    paypalCreditButton.countryCode = countryCode;
    paypalCreditButton.removeAttribute("hidden");

    paypalCreditButton.addEventListener("click", async () => {
        try {
            await paypalCreditPaymentSession.start(
                { presentationMode: "auto" },
                createOrder(),
            );
        } catch (error) {
            console.error(error);
        }
    });
}

async function getClientToken() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Basic QVQtaUctM2lfTXcybEd0cUgzMktuOFFVTHBOOFBCRjVzTEl2QlRjVTN3QzhFa18wRURrbGNfYUsyY2dUS3NIRjQwUHNIcjduaWNRUE1JcmY6RURzTVQ2M01yU2tJQ2pxQmlDTEFaTHFjN3hrNk5pTEFaN3ZjS1FHZWZkS1M0U1VOOW9UbDFOTXNqTVdIdi05b2xOTjUydzBhTFVZcV9UOHI=");

    const urlencoded = new URLSearchParams();
    urlencoded.append("response_type", "client_token");
    urlencoded.append("grant_type", "client_credentials");

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow"
    };

    return fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", requestOptions).then(function(response){
        return response.json();
    }).then(function(data){
        console.log(data.access_token);
        return data.access_token;
    })
}

//get access token
async function getAccessToken() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Basic QVQtaUctM2lfTXcybEd0cUgzMktuOFFVTHBOOFBCRjVzTEl2QlRjVTN3QzhFa18wRURrbGNfYUsyY2dUS3NIRjQwUHNIcjduaWNRUE1JcmY6RURzTVQ2M01yU2tJQ2pxQmlDTEFaTHFjN3hrNk5pTEFaN3ZjS1FHZWZkS1M0U1VOOW9UbDFOTXNqTVdIdi05b2xOTjUydzBhTFVZcV9UOHI=");

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

async function createOrder() {

    const myHeaders = new Headers();
    const token = await getAccessToken();
    const bearer = "Bearer " + token;
    myHeaders.append("Authorization", bearer);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify(generatePayload());
    console.log(generatePayload());

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    return fetch("https://api.sandbox.paypal.com/v2/checkout/orders", requestOptions).then(function(response){
        return response.json();
    }).then(function(data){
        console.log(data);
        console.log(data.id);
        return {orderId: data.id};
    })
}

//capture order

async function captureOrder(orderId) {
    const myHeaders = new Headers();
    const token = await getAccessToken();
    const bearer = "Bearer " + token;
    myHeaders.append("Authorization", bearer);
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        redirect: "follow"
    };

    const captureResponse = await fetch("https://api.sandbox.paypal.com/v2/checkout/orders/" + orderId + "/capture", requestOptions);
    const captureResult = await captureResponse.json();;
    return captureResult;
}
