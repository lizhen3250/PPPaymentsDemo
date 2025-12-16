//paypal googlepay

const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
};
let    allowedPaymentMethods = null,
    merchantInfo = null;

// --- 定义 Google Pay 支付配置 ---
const baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
    }
};

let paymentsClient = null;
let googlePayConfig = null; // Cache the config

// 获取 Google PaymentsClient 实例
function getGooglePaymentsClient() {
    if (paymentsClient === null) {
        paymentsClient = new google.payments.api.PaymentsClient({
            environment: 'TEST', // 生产环境请改为 'PRODUCTION'
             paymentDataCallbacks: {
                onPaymentAuthorized: onPaymentAuthorized,
            },
        });
    }
    return paymentsClient;
}

// ----------------------------------------------------
// 1. 启动流程：Google SDK 加载完成时调用此函数
// ----------------------------------------------------
function onGooglePayLoaded() {

		if (typeof paypal === 'undefined' || !paypal.Googlepay) {
        setTimeout(onGooglePayLoaded, 100);
        return;
    }

    // 获取 PayPal 提供的 Google Pay 配置对象
    paypal.Googlepay().config().then(function(config) {
        googlePayConfig = config;

        // --- Google Pay 按钮逻辑 ---
        const isReadyToPayRequest = {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: config.allowedPaymentMethods 
        };

        const paymentsClient = getGooglePaymentsClient();
        paymentsClient.isReadyToPay(isReadyToPayRequest)
            .then(function(response) {
                if (response.result) {
                    addGooglePayButton();
                }
            })
            .catch(function(err) {
                console.error("Google Pay isReadyToPay error:", err);
            });
            
        // --- 核心修改：在这里渲染 PayPal 按钮，确保 SDK 已加载 ---
        // 我们将原 window.onload 中的内容移动到此处
        //renderPayPalButtons();
        // -------------------------------------------------------------
        
    });
}


// ----------------------------------------------------
// 2. 渲染 Google Pay 按钮
// ----------------------------------------------------
function addGooglePayButton() {
    const paymentsClient = getGooglePaymentsClient();
    const button = paymentsClient.createButton({
        onClick: onGooglePaymentButtonClicked
    });
    // 确保 'google-pay-button-container' 存在于您的 HTML 中
    document.getElementById('google-pay-button-container').appendChild(button);
}

//当点击google pay页面的pay now的时候触发
function onPaymentAuthorized(paymentData) {
    console.log("onPaymentAuthorized()  -- inside");
    console.log("buyer approved from gpay UI");
    return new Promise(function (resolve, reject) {
        console.log("calling processPayment()");
        processPayment(paymentData)
            .then(function (data) {
                resolve({ transactionState: "SUCCESS" });
            })
            .catch(function (errDetails) {
                resolve({ transactionState: "ERROR" });
            });
    });
}
// ----------------------------------------------------
// 3. 按钮点击时触发的逻辑 (Google Pay)
// ----------------------------------------------------
async function onGooglePaymentButtonClicked() {
    // *** 步骤 1: 运行与 PayPal 按钮相同的地址检查逻辑 ***
    // 1. Safety Check: Ensure config is loaded
    if (!googlePayConfig) {
        console.error("Google Pay config not yet loaded");
        return;
    }

    const paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = googlePayConfig.allowedPaymentMethods;
    paymentDataRequest.merchantInfo = googlePayConfig.merchantInfo;
    //to see more cards comment below
    paymentDataRequest.callbackIntents = ["PAYMENT_AUTHORIZATION"];

   paymentDataRequest.transactionInfo = {
	    totalPriceStatus: 'FINAL',
	    totalPrice: "230.00", 
	    currencyCode: 'USD', 
	    countryCode:'US',
	        //countryCode: googlePayConfig.countryCode || 'US',
	    checkoutOption:'COMPLETE_IMMEDIATE_PURCHASE',
        totalPriceLabel: 'Amount',
        displayItems: [
        {
            label: "Item_total",
            type: "SUBTOTAL",
            price: "220.00",
            status: "FINAL"
        },
        {
            label: "Shipping",
            type: "LINE_ITEM",
            price: "10.00",
            status: "FINAL"
        }
    ]
};
    const paymentsClient = getGooglePaymentsClient();

    //paymentsClient.loadPaymentData(paymentDataRequest);
    paymentsClient.loadPaymentData(paymentDataRequest);
}

function onPaymentAuthorized(paymentData) {
    console.log("onPaymentAuthorized()  -- inside");
    return new Promise(function (resolve, reject) {
        console.log("calling processPayment()");
        processPayment(paymentData)
            .then(function (data) {
                resolve({ transactionState: "SUCCESS" });
            })
            .catch(function (errDetails) {
                resolve({ transactionState: "ERROR" });
            });
    });
}

async function processPayment(paymentData) {
    console.log("processPayment()  -- inside");
    try {
        const urlencoded = new URLSearchParams();
        urlencoded.append('grant_type','client_credentials');
        const accessTokenResponse = await fetch("https://api.sandbox.paypal.com/v1/oauth2/token", {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic QVQtaUctM2lfTXcybEd0cUgzMktuOFFVTHBOOFBCRjVzTEl2QlRjVTN3QzhFa18wRURrbGNfYUsyY2dUS3NIRjQwUHNIcjduaWNRUE1JcmY6RURzTVQ2M01yU2tJQ2pxQmlDTEFaTHFjN3hrNk5pTEFaN3ZjS1FHZWZkS1M0U1VOOW9UbDFOTXNqTVdIdi05b2xOTjUydzBhTFVZcV9UOHI='
            },
            body: urlencoded
        })
        const token = await accessTokenResponse.json();
        const accessToken = token.access_token;
        console.log({accessToken});
        const payload = generatePayload();
        console.log(payload);

        const orderResponse = await fetch("https://api.sandbox.paypal.com/v2/checkout/orders", {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        const createOrderResult = await orderResponse.json();
        console.log(createOrderResult);
        const id = createOrderResult.id;

        console.log({ id });

        const confirmPaymentResult = await paypal.Googlepay().confirmOrder({
            orderId: id,
            paymentMethodData: paymentData.paymentMethodData,
        });
        const status = confirmPaymentResult.status;
        if (status === "APPROVED") {
            /* Capture the Order */
            const captureResponse = await fetch("https://api.sandbox.paypal.com/v2/checkout/orders/"+id+"/capture", {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                }
            })
            const captureResult = await captureResponse.json();
            jsonOutput.innerHTML = syntaxHighlight(JSON.stringify(captureResult, null, 2));
            currentJson = captureResult;
            var transaction = captureResult.purchase_units[0].payments.captures[0];
            document.getElementById('right-panel-para').innerHTML = '<p>PayPal Transaction ID: <b>' + transaction.id + "</b> Transaction Status: <b>" + transaction.status + "</b></p>";
            showNotification("Transaction Completed!");
            return { transactionState: "SUCCESS" };
        } else {
            return { transactionState: "ERROR" };
        }
    } catch (err) {
        return {
            transactionState: "ERROR",
            error: {
                message: err.message,
            },
        };
    }
}