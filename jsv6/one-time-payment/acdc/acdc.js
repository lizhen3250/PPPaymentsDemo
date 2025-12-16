
async function onPayPalWebSdkLoaded() {
    try {
        const clientToken = await getClientToken();
        const sdkInstance = await window.paypal.createInstance({
            clientToken,
            components: ["card-fields"],
            pageType: "checkout",
            testBuyerCountry: 'US'
        });

        const paymentMethods = await sdkInstance.findEligibleMethods({
            currencyCode: "USD",
        });

        if (paymentMethods.isEligible("advanced_cards")) {
            setupCardFields(sdkInstance);
        }
    } catch (error) {
        console.error(error);
    }
}

async function setupCardFields(sdkInstance) {
    const cardSession = sdkInstance.createCardFieldsOneTimePaymentSession();
    
    const numberField = cardSession.createCardFieldsComponent({
        type: 'number',
        placeholder: 'Card Number'
    });

    const expiryField = cardSession.createCardFieldsComponent({
        type: 'expiry',
        placeholder: 'MM/YY'
    });

    const cvvField = cardSession.createCardFieldsComponent({
        type: 'cvv',
        placeholder: 'CVV'
    });

    document.querySelector('#paypal-card-fields-number').appendChild(numberField);
    document.querySelector('#paypal-card-fields-expiry').appendChild(expiryField);
    document.querySelector('#paypal-card-fields-cvv').appendChild(cvvField);

    document.querySelector('#card-field-submit-button').addEventListener('click', () => onPayClick(cardSession));
}

async function onPayClick(cardSession) {
    try {
        console.log(document.querySelector('#paypal-card-fields-number').vaule);
        const order = await createOrder();
        const {data, state} = await cardSession.submit(order.orderId);
        console.log(data);
        console.log(state);

        switch (state) {
            case 'succeeded': {
                const {orderId, liabilityShift} = data;
                console.log(data);
                if (data.liabilityShift == 'POSSIBLE') {

                }
                const captureResult = await captureOrder(data.orderId);
                console.log("Capture result", captureResult);
                jsonOutput.innerHTML = syntaxHighlight(JSON.stringify(captureResult, null, 2));
                currentJson = captureResult;
                var transaction = captureResult.purchase_units[0].payments.captures[0];
                document.getElementById('right-panel-para').innerHTML = '<p>PayPal Transaction ID: <b>' + transaction.id + "</b> Transaction Status: <b>" + transaction.status + "</b></p>";
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
                loadingDots.style.display = 'none';
                showNotification("Transaction Completed!");
                break;
            }
            case 'canceled': {
                console.log("canceled");
                break
            }
            case 'failed': {
                console.log("failed");
                break;
            }
        }
    } catch(err) {
        console.log(err);
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
    progressContainer.style.display = 'block';
    loadingDots.style.display = 'flex';
    progressBar.style.width = '0%';
    const progressInterval = setInterval(() => {
        const currentWidth = parseFloat(progressBar.style.width) || 0;
        if (currentWidth < 90) {
            // 在完成前只更新到90%，最后10%在API完成时更新
            const increment = Math.random() * 15 + 5; // 5-20%的随机增量
            const newWidth = Math.min(90, currentWidth + increment);
            progressBar.style.width = newWidth + '%';
        }
    }, 12000 / 20);
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
