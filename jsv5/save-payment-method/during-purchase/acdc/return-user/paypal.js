async function vaultPayment() {
  progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    console.log(progressBar);
    const progressInterval = setInterval(() => {
        const currentWidth = parseFloat(progressBar.style.width) || 0;
        if (currentWidth < 90) {
            // 在完成前只更新到90%，最后10%在API完成时更新
            const increment = Math.random() * 15 + 5; // 5-20%的随机增量
            const newWidth = Math.min(90, currentWidth + increment);
            progressBar.style.width = newWidth + '%';
        }
    }, 12000 / 20);
    const result = await createOrder();
    jsonOutput.innerHTML = syntaxHighlight(JSON.stringify(result, null, 2));
    currentJson = result;
    var transaction = result.purchase_units[0].payments.captures[0];
    document.getElementById('right-panel-para').innerHTML = '<p>PayPal Transaction ID: <b>' + transaction.id + "</b> Transaction Status: <b>" + transaction.status + "</b></p>";
    progressContainer.style.display = 'none';
    progressBar.style.width = '0%';
    showNotification("Transaction Completed!");
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
    myHeaders.append("PayPal-Request-Id", uuidv4());

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
    return orderResult;
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}