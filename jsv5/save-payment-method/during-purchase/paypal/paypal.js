//paypal payments
const clientId = "AT-iG-3i_Mw2lGtqH32Kn8QULpN8PBF5sLIvBTcU3wC8Ek_0EDklc_aK2cgTKsHF40PsHr7nicQPMIrf";



async function loadScript() {
    var btnScript = document.createElement("script");
            btnScript.type = "text/javascript";
            btnScript.src =
                "https://www.paypal.com/sdk/js?client-id=" +
                clientId +
                "&currency=USD&buyer-country=US&components=buttons,messages&commit=true&locale=en_US&vault=true&disable-funding=credit,card";
            btnScript.id = "PAYPAL-SCRIPT";
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Basic QVQtaUctM2lfTXcybEd0cUgzMktuOFFVTHBOOFBCRjVzTEl2QlRjVTN3QzhFa18wRURrbGNfYUsyY2dUS3NIRjQwUHNIcjduaWNRUE1JcmY6RURzTVQ2M01yU2tJQ2pxQmlDTEFaTHFjN3hrNk5pTEFaN3ZjS1FHZWZkS1M0U1VOOW9UbDFOTXNqTVdIdi05b2xOTjUydzBhTFVZcV9UOHI=");

    const urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");
    urlencoded.append("response_type", "id_token");

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow"
    };

    fetch("https://api.sandbox.paypal.com/v1/oauth2/token", requestOptions)
    .then((res) => res.json())
    .then((data)=>{
        const idToken = data.id_token
        btnScript.setAttribute("data-user-id-token", idToken);
        console.log(idToken);
        btnScript.onload = function() {
        paypal.Buttons({
                createOrder:createOrder,

        // Call your server to finalize the transaction
                onApprove: function (data, actions) {
                    captureOrder(data.orderID).then(function (captureResult) {
                    console.log(captureResult);
                    jsonOutput.innerHTML = syntaxHighlight(JSON.stringify(captureResult, null, 2));
                    currentJson = captureResult;
                    var transaction = captureResult.purchase_units[0].payments.captures[0];
                    document.getElementById('right-panel-para').innerHTML = '<p>PayPal Transaction ID: <b>' + transaction.id + "</b> Transaction Status: <b>" + transaction.status + "</b></p>";
                    showNotification("Transaction Completed!");
                });
            }
        }).render('#paypal-button-container');
    }
    document.getElementsByTagName("head")[0].appendChild(btnScript);
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
async function createOrder() {
    const myHeaders = new Headers();
    const token = await getAccessToken();
    const bearer = "Bearer " + token;
    console.log(bearer);
    myHeaders.append("Authorization", bearer);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify(generatePayload());

    console.log(raw);

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    const orderResponse = await fetch("https://api.sandbox.paypal.com/v2/checkout/orders", requestOptions);
    const orderResult = await orderResponse.json();
    const orderId = orderResult.id;
    console.log(orderResult);
    console.log(orderResult.id);
    return orderId;
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
