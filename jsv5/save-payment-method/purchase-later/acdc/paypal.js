

const paypalRequestId = uuidv4();
//paypal ACDC
const cardField = paypal.CardFields({
    createVaultSetupToken : createVaultSetupToken,

    // Call your server to finalize the transaction
    onApprove: function (data) {
        createPaymentToken(data.vaultSetupToken).then(function (captureResult) {
            console.log(captureResult);
            jsonOutput.innerHTML = syntaxHighlight(JSON.stringify(captureResult, null, 2));
            currentJson = captureResult;
            //var transaction = captureResult.purchase_units[0].payments.captures[0];
            //document.getElementById('right-panel-para').innerHTML = '<p>PayPal Transaction ID: <b>' + transaction.id + "</b> Transaction Status: <b>" + transaction.status + "</b></p>";
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            showNotification("Transaction Completed!");
        });
    },
    onError: function (error) {
        console.log(error);
    },
    onCancel: function (data) {
        console.log("3DS canceled");
    }
});

if (cardField.isEligible()) {
    const numberField = cardField.NumberField({
        inputEvents: {
            onChange: (event) => {
                console.log("returns a stateObject", event);
            },
            onfocus: (event) => {
                console.log(event)
            }
        }
    });
    numberField.render('#card-number-field-container');

    const cvvField = cardField.CVVField();
    cvvField.render('#card-cvv-field-container');

    const expiryField = cardField.ExpiryField();
    expiryField.render('#card-expiry-field-container');

    document
        .getElementById('card-field-submit-button')
        .addEventListener("click", () => {
            cardField.submit().catch((err) => {
                console.log("There was an error with card fields: ", err);
                if (err == "Error: INVALID_NUMBER") {
                    console.log("invaild: ");
                    numberField.focus();
                }
            })
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

//create order
async function createVaultSetupToken() {
    progressContainer.style.display = 'block';
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
    console.log(bearer);
    myHeaders.append("Authorization", bearer);
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("PayPal-Request-Id", paypalRequestId);

    const raw = JSON.stringify(generatePayload());

    console.log(raw);

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    const orderResponse = await fetch("https://api-m.sandbox.paypal.com/v3/vault/setup-tokens", requestOptions);
    const orderResult = await orderResponse.json();
    const orderId = orderResult.id;
    console.log(orderResult);
    console.log(orderResult.id);
    return orderId;
}

//capture order

async function createPaymentToken(vaultSetupToken) {
    const myHeaders = new Headers();
    const token = await getAccessToken();
    const bearer = "Bearer " + token;
    myHeaders.append("Authorization", bearer);
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("PayPal-Request-Id", paypalRequestId);

    const raw = JSON.stringify({
        "payment_source": {
        "token": {
            "id": vaultSetupToken,
            "type": "SETUP_TOKEN"
            }
        }
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        redirect: "follow",
        body: raw
    };

    const paymentTokenResponse = await fetch("https://api-m.sandbox.paypal.com/v3/vault/payment-tokens", requestOptions);
    const paymentTokenResult = await paymentTokenResponse.json();
    return paymentTokenResult;
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}