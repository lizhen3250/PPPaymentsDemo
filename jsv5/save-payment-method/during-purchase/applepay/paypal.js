let transactionId = "";

let applepay;
let applepayConfig;
let acessToken;

async function onClick() {
  const {
    isEligible,
    countryCode,
    currencyCode,
    merchantCapabilities,
    merchantCountry,
    supportedNetworks,
  } = applepayConfig;
  console.log("printing individual applepay config......");
  console.log("isEligible: ");
  console.log(isEligible);

  if (!isEligible) {
    throw new Error("applepay is not eligible");
  }
  transactionId = uuidv4();
  console.log("transactionId :" + transactionId);
  var b64TransactionId = btoa(transactionId);
  console.log("B64 transactionId :" + b64TransactionId);
  const currentDate = new Date();
    const isoFormattedCurrentDate = currentDate.toISOString();

    const sevenDaysLaterDate = new Date(isoFormattedCurrentDate);
    sevenDaysLaterDate.setDate(sevenDaysLaterDate.getDate() + 7);
    const isoSevenDaysLaterDate = sevenDaysLaterDate.toISOString();

  /**
   * https://developer.apple.com/documentation/apple_pay_on_the_web/applepaypaymentrequest
   * 
   * dictionary ApplePayPaymentRequest {
        required sequence <ApplePayMerchantCapability> merchantCapabilities;
        required sequence <DOMString> supportedNetworks;
        required DOMString countryCode;
        sequence <ApplePayContactField> requiredBillingContactFields;
        ApplePayPaymentContact billingContact;
        sequence <ApplePayContactField> requiredShippingContactFields;
        ApplePayPaymentContact shippingContact;
        DOMString applicationData;
        sequence <DOMString> supportedCountries;
        boolean supportsCouponCode;
        DOMString couponCode;
        ApplePayShippingContactEditingMode shippingContactEditingMode;
        required ApplePayLineItem total;
        sequence <ApplePayLineItem> lineItems;
        required DOMString currencyCode;
        ApplePayShippingType shippingType;
        sequence <ApplePayShippingMethod> shippingMethods;
        sequence <ApplePayPaymentTokenContext> multiTokenContexts;
        ApplePayAutomaticReloadPaymentRequest automaticReloadPaymentRequest;
        ApplePayRecurringPaymentRequest recurringPaymentRequest;
        ApplePayDeferredPaymentRequest deferredPaymentRequest;
      };
   * 
   */

    const paymentRequest = {
      countryCode,
      currencyCode: "USD",
      merchantCapabilities,
      supportedNetworks,
      requiredBillingContactFields: ["name", "phone", "email", "postalAddress"],

      requiredShippingContactFields: ["email"],

      lineItems: [
        {
          label: "7 Days Trial 5000USD",
          amount: "10.00",
          paymentTiming: "recurring",
          recurringPaymentIntervalUnit: "day",
          recurringPaymentIntervalCount: 7,
          recurringPaymentStartDate: isoSevenDaysLaterDate,
          //recurringPaymentEndDate: "2029-08-12T16:00:00.000Z"
        },
        {
          label: "Recurring 6000USD",
          amount: "20.00",
          paymentTiming: "recurring",
          recurringPaymentIntervalUnit: "day",
          recurringPaymentIntervalCount: 7,
          recurringPaymentStartDate: isoFormattedCurrentDate,
          recurringPaymentEndDate: isoSevenDaysLaterDate,
        },
      ],
      recurringPaymentRequest: {
        paymentDescription:
          "A description of the recurring payment to display to the user in the payment sheet.",
        regularBilling: {
          label: "Recurring",
          amount: "20.00",
          paymentTiming: "recurring",
          recurringPaymentIntervalUnit: "day",
          recurringPaymentIntervalCount: 7,
          recurringPaymentStartDate: isoSevenDaysLaterDate,
          //recurringPaymentEndDate: "2029-08-12T16:00:00.000Z"
        },
        trialBilling: {
          label: "7 Days Trial",
          amount: "10.00",
          paymentTiming: "recurring",
          recurringPaymentIntervalUnit: "day",
          recurringPaymentIntervalCount: 7,
          recurringPaymentStartDate: isoFormattedCurrentDate,
          recurringPaymentEndDate: isoSevenDaysLaterDate,
        },
        billingAgreement:
          "A localized billing agreement displayed to the user in the payment sheet prior to the payment authorization.",
        managementURL: "https://applepaydemo.apple.com",
        //"tokenNotificationURL": "https://applepaydemo.apple.com"
      },
      total: {
        label: "Recurring Demo (Card is not charged)",
        amount: "10.00",
      },

      //shippingType: "shipping",
      //shippingContactEditingMode: "storePickup",
      //applicationData: b64TransactionId
      //applicationData is base64 encoded. Decode it first and SHA-256 will get the string same as ApplePayPaymentAuthorizedEvent.payment.token.paymentData.header.applicationData in onpaymentauthorized event
    };

    // eslint-disable-next-line no-undef
    let session = new ApplePaySession(4, paymentRequest);

  session.onvalidatemerchant = (event) => {
    console.log("in onvalidatemerchant print event");
    console.log(event);
    applepay
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
    //const transactionIdentifier = event.payment.token.transactionIdentifier;
    //const billingAddress = event.payment.billingContact;
    //const shippingAddress = event.payment.shippingContact;
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

      //create order
      //const orderResponse = await fetch(createOrderApplePayEcmPpcpC2, {
        //method: 'POST',
        //headers: {
          //"Content-Type": "application/json",
        //},
        //body: JSON.stringify({ currency: currentCurrency, invoice_id: b64TransactionId }),
      //})
      //if (!orderResponse.ok) {
        //throw new Error("error creating order")
      //}

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
      /**
       * Confirm Payment 
       */
      const confirmPaymentResult = await applepay.confirmOrder({ 
        orderId: id, 
        token: event.payment.token,
        billingContact: event.payment.billingContact,
        shippingContact: event.payment.shippingContact,
    });
      console.log("print call back event object: ");
      console.log(event);  
      console.log("print applepay token:");
      console.log(event.payment.token);
      console.log("print confirm order result:");
      console.log(confirmPaymentResult);

      const status = confirmPaymentResult.approveApplePayPayment.status;
      if (status === "APPROVED") {
        /*
                * Capture order (must currently be made on server)
                */
        //const captureResponse = await fetch(captureOrderApplePayEcmPpcpC2, {
          //method: 'POST',
          //headers: {
            ///"Content-Type": "application/json",
          //},
          //body: JSON.stringify({ orderId: id }),
        //}).then((res) => res.json());
        //console.log(captureResponse);
        //const orderData = captureResponse;
        //console.log(
         // "Capture result",
          //orderData,
          //JSON.stringify(orderData, null, 2),
        //);
        //console.log(" ===== Order Capture Completed ===== ")
        //modal.style.display = "block";
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

async function setupApplepay() {

  console.log("create applepay object from paypal.Applepay()");
  applepay = paypal.Applepay();

  console.log("getting applepay config from applepay.config()");
  applepayConfig = await applepay.config();
  console.log("got applepay config......printing....");
  console.log(applepayConfig);

  document.getElementById("apple-pay-button-container").innerHTML =
    '<apple-pay-button id="btn-appl" buttonstyle="black" type="buy" locale="en">';

  document.getElementById("btn-appl").addEventListener("click", onClick);

}

document.addEventListener("DOMContentLoaded", () => {

  if (!window.ApplePaySession) {
    console.error('This device does not support Apple Pay');
  }

  // eslint-disable-next-line no-undef
  if (ApplePaySession?.supportsVersion(4) && ApplePaySession?.canMakePayments()) {
    setupApplepay().catch(console.error);
  }
});

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function loadApplePayWithCustomizedButton() {
  console.log("loadApplePayWithCustomizedButton");
  onClick();
}