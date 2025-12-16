let transactionId = "";

let applepay;
let applepayConfig;
let acessToken;

async function onClick() {
  const {
    isEligible,
    countryCode,
    merchantCapabilities,
    merchantCountry,
    supportedNetworks,
  } = applepayConfig;

  console.log(isEligible);

  if (!isEligible) {
    throw new Error("applepay is not eligible");
  }

  transactionId = uuidv4();
  var b64TransactionId = btoa(transactionId);
  console.log("B64 transactionId :" + b64TransactionId);

  const paymentRequest = {
    countryCode: "US",
    currencyCode: "USD",
    merchantCapabilities,
    supportedNetworks,
    requiredBillingContactFields: [
      "name",
      "phone",
      "email",
      "postalAddress",
    ],
    //no need pass for virtual goods
    requiredShippingContactFields: [
      "name",
      "phone",
      "email",
      "postalAddress",
    ],
    //no need pass for virtual goods
    
    shippingContact: {
      phoneNumber: "4104567890",
      emailAddress: "abccredit@gmail.com",
      givenName: "Jin",
      familyName: "Li",
      //phoneticGivenName;
      //phoneticFamilyName;
      //sequence <DOMString> addressLines;
      addressLines: ["11 philidelphia ave"],
      //subLocality: "The White House",
      locality: "Los Angeles",
      postalCode: "90001",
      //subAdministrativeArea:"",
      administrativeArea: "CA",
      //country: "",
      countryCode: "US"
    },
    /*
    billingContact: {
      phoneNumber: "2407808080",
      emailAddress: "crosswen5@gmail.com",
      givenName: "Crossba",
      familyName: "Wenba",
      //phoneticGivenName;
      //phoneticFamilyName;
      //sequence <DOMString> addressLines;
      addressLines: ["The White House BA"],
      //subLocality: "The White House",
      locality: "Washington",
      postalCode: "20500",
      //subAdministrativeArea:"",
      administrativeArea: "DC",
      //country: "",
      countryCode: "US"
    },
    */

    
    total: {
      label: "Jin China Store",
      amount: "230.00",
      type: "final"
    },
    lineItems: [
      {
        label: "Subtotal",
        type: "final",
        amount: "220.00"
      },
      {
        label: "Shipping",
        amount: "10.00",
        type: "final"
      }
    ],   
    shippingType: "shipping", //no need pass in virtual goods
    //shippingContactEditingMode: "storePickup",
    //applicationData: b64TransactionId
    //applicationData is base64 encoded. Decode it first and SHA-256 will get the string same as ApplePayPaymentAuthorizedEvent.payment.token.paymentData.header.applicationData in onpaymentauthorized event
  };

  // eslint-disable-next-line no-undef
  let session = new ApplePaySession(4, paymentRequest);

  session.onvalidatemerchant = (event) => {
    console.log("in onvalidatemerchant print event");
    console.log(event);
    paypalPaymentSession
      .validateMerchant({
        validationUrl: event.validationURL,
      })
      .then((payload) => {
        console.log("in onvalidatemerchant after validateMerchant print payload");
        console.log(payload);
        session.completeMerchantValidation(payload.merchantSession);
      })
      .catch((err) => {
        console.error(err);
        session.abort();
      });
  };

  session.onpaymentmethodselected = () => {
    console.log("in onpaymentmethodselected");
    session.completePaymentMethodSelection({
      newTotal: paymentRequest.total,
    });
  };

  session.onpaymentauthorized = async (event) => {
    console.log("in onpaymentauthorized print event");
    console.log(event);
    console.log("printing paymentRequest object");
    console.log(paymentRequest);
    try {
      /* Create Order on the Server Side */
      //get acess token
      
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
        });

      const createOrderResult = await orderResponse.json();
      console.log(createOrderResult);
      const id = createOrderResult.id;

      console.log({ id });
      /**
       * Confirm Payment 
       */
      const confirmPaymentResult = await applepay.confirmOrder({ orderId: id, token: event.payment.token, billingContact: event.payment.billingContact, shippingContact: event.payment.shippingContact });
      console.log("print call back event object: ");
      console.log(event);  
      console.log("print applepay token:");
      console.log(event.payment.token);
      console.log("print confirm order result:");
      console.log(confirmPaymentResult);

      const status = confirmPaymentResult.approveApplePayPayment.status;
      if (status === "APPROVED") {
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

        session.completePayment({
          status: window.ApplePaySession.STATUS_SUCCESS,
        });
      } else {
        session.completePayment({
          status: window.ApplePaySession.STATUS_FAILURE,
        });
      }

    } catch (err) {
      console.error(err);
      session.completePayment({
        status: window.ApplePaySession.STATUS_FAILURE,
      });
    }
  };

  session.oncancel = () => {
    console.log("Apple Pay Cancelled !!")
  }

  session.begin();
}



function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

async function onPayPalWebSdkLoaded() {
    try {
        const clientToken = await getClientToken();
        const sdkInstance = await window.paypal.createInstance({
            clientToken,
            components: ["applepay-payments"],
            pageType: "checkout",
            testBuyerCountry: 'US'
        });

        const paymentMethods = await sdkInstance.findEligibleMethods({
            currencyCode: "USD",
        });

        setupApplePayButton(sdkInstance);
    } catch (error) {
        console.error(error);
    }
}

async function setupApplePayButton(sdkInstance) {
    console.log("setup apple pay button");
    const paypalPaymentSession = sdkInstance.createApplePayOneTimePaymentSession();

    applepayConfig = await paypalPaymentSession.config();

    //applepayConfig.merchantCapabilities = merchantCapabilities;
    //applepayConfig.supportedNetworks = supportedNetworks;

    console.log(applepayConfig);

    document.getElementById("apple-pay-button-container").innerHTML =
    '<apple-pay-button id="btn-appl" buttonstyle="black" type="buy" locale="en">';

  document.getElementById("btn-appl").addEventListener("click", onClick);
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