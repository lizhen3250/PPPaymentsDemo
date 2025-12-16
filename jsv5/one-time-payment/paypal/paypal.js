//paypal payments
var PAYPAL_FUNDING_SOURCE = [
    paypal.FUNDING.PAYPAL
]
// Loop over each payment method
PAYPAL_FUNDING_SOURCE.forEach(function (fundingSource) {
    // Initialize the buttons
    var button = paypal.Buttons({
        fundingSource: fundingSource,
        async createOrder(data, actions) {
            const payload = generatePayload();
            console.log(payload);
            return actions.order.create(
                payload
            )
            // return fetch('/demo/checkout/api/paypal/order/create/', {
            //     method: 'post'
            // }).then(function (res) {
            //     return res.json();
            // }).then(function (orderData) {
            //     return orderData.id;
            // });
        },

        // Call your server to finalize the transaction
        onApprove: function (data, actions) {
            return actions.order.capture().then(function(orderData){
                 var errorDetail = Array.isArray(orderData.details) && orderData.details[0];

                if (errorDetail && errorDetail.issue === 'INSTRUMENT_DECLINED') {
                    return actions.restart(); // Recoverable state, per:
                    // https://developer.paypal.com/docs/checkout/integration-features/funding-failure/
                }

                if (errorDetail) {
                    var msg = 'Sorry, your transaction could not be processed.';
                    if (errorDetail.description) msg += '\n\n' + errorDetail.description;
                    if (orderData.debug_id) msg += ' (' + orderData.debug_id + ')';
                    return alert(msg); // Show a failure message (try to avoid alerts in production environments)
                }

                // Successful capture! For demo purposes:
                console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));
                document.getElementById('right-panel-title-text').innerText = 'Capture Order Response';
                
                jsonOutput.innerHTML = syntaxHighlight(JSON.stringify(orderData, null, 2));
                currentJson = orderData;
                var transaction = orderData.purchase_units[0].payments.captures[0];
                document.getElementById('right-panel-para').innerHTML = '<p>PayPal Transaction ID: <b>' + transaction.id + "</b> Transaction Status: <b>" + transaction.status + "</b></p>";
                showNotification("Transaction Completed!")
                //alert('Transaction ' + transaction.status + ': ' + transaction.id + '\n\nSee console for all available details');

                // Replace the above to show a success message within this page, e.g.
                // const element = document.getElementById('paypal-button-container');
                // element.innerHTML = '';
                // element.innerHTML = '<h3>Thank you for your payment!</h3>';
                // Or go to another URL:  actions.redirect('thank_you.html');
            })
        }
    })
    // Check if the button is eligible
    if (button.isEligible()) {
        // Render the standalone button for that payment method
        button.render('#paypal-button-container')
    }
})

var PAYPAL_PAYLATER_FUNDING_SOURCE = [
    paypal.FUNDING.PAYLATER
]
// Loop over each payment method
PAYPAL_PAYLATER_FUNDING_SOURCE.forEach(function (fundingSource) {
    // Initialize the buttons
    var button = paypal.Buttons({
        fundingSource: fundingSource,
        message: {
            amount: 230, // Update to your cart or product total amount
            align: 'center',
            color: 'white',
        },
        async createOrder(data, actions) {
            const payload = generatePayload();
            console.log(payload);
            return actions.order.create(
                payload
            )
            // return fetch('/demo/checkout/api/paypal/order/create/', {
            //     method: 'post'
            // }).then(function (res) {
            //     return res.json();
            // }).then(function (orderData) {
            //     return orderData.id;
            // });
        },

        // Call your server to finalize the transaction
        onApprove: function (data, actions) {
            return actions.order.capture().then(function(orderData){
                 var errorDetail = Array.isArray(orderData.details) && orderData.details[0];

                if (errorDetail && errorDetail.issue === 'INSTRUMENT_DECLINED') {
                    return actions.restart(); // Recoverable state, per:
                    // https://developer.paypal.com/docs/checkout/integration-features/funding-failure/
                }

                if (errorDetail) {
                    var msg = 'Sorry, your transaction could not be processed.';
                    if (errorDetail.description) msg += '\n\n' + errorDetail.description;
                    if (orderData.debug_id) msg += ' (' + orderData.debug_id + ')';
                    return alert(msg); // Show a failure message (try to avoid alerts in production environments)
                }

                // Successful capture! For demo purposes:
                console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));
                document.getElementById('right-panel-title-text').innerText = 'Capture Order Response';
                
                jsonOutput.innerHTML = syntaxHighlight(JSON.stringify(orderData, null, 2));
                currentJson = orderData;
                var transaction = orderData.purchase_units[0].payments.captures[0];
                document.getElementById('right-panel-para').innerHTML = '<p>PayPal Transaction ID: <b>' + transaction.id + "</b> Transaction Status: <b>" + transaction.status + "</b></p>";
                showNotification("Transaction Completed!")
                //alert('Transaction ' + transaction.status + ': ' + transaction.id + '\n\nSee console for all available details');

                // Replace the above to show a success message within this page, e.g.
                // const element = document.getElementById('paypal-button-container');
                // element.innerHTML = '';
                // element.innerHTML = '<h3>Thank you for your payment!</h3>';
                // Or go to another URL:  actions.redirect('thank_you.html');
            })
        }
    })
    // Check if the button is eligible
    if (button.isEligible()) {
        // Render the standalone button for that payment method
        button.render('#paypal-paylater-button-container')
    }
})

var CREDIT_FUNDING_SOURCE = [
    paypal.FUNDING.CARD
]
// Loop over each payment method
CREDIT_FUNDING_SOURCE.forEach(function (fundingSource) {
    // Initialize the buttons
    var button = paypal.Buttons({
        fundingSource: fundingSource,
        expandCardForm: true,
        async createOrder(data, actions) {
            const payload = generatePayload();
            console.log(payload);
            return actions.order.create(
                payload
            )
            // return fetch('/demo/checkout/api/paypal/order/create/', {
            //     method: 'post'
            // }).then(function (res) {
            //     return res.json();
            // }).then(function (orderData) {
            //     return orderData.id;
            // });
        },

        // Call your server to finalize the transaction
        onApprove: function (data, actions) {
            return actions.order.capture().then(function(orderData){
                 var errorDetail = Array.isArray(orderData.details) && orderData.details[0];

                if (errorDetail && errorDetail.issue === 'INSTRUMENT_DECLINED') {
                    return actions.restart(); // Recoverable state, per:
                    // https://developer.paypal.com/docs/checkout/integration-features/funding-failure/
                }

                if (errorDetail) {
                    var msg = 'Sorry, your transaction could not be processed.';
                    if (errorDetail.description) msg += '\n\n' + errorDetail.description;
                    if (orderData.debug_id) msg += ' (' + orderData.debug_id + ')';
                    return alert(msg); // Show a failure message (try to avoid alerts in production environments)
                }

                // Successful capture! For demo purposes:
                console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));
                document.getElementById('right-panel-title-text').innerText = 'Capture Order Response';
                
                jsonOutput.innerHTML = syntaxHighlight(JSON.stringify(orderData, null, 2));
                currentJson = orderData;
                var transaction = orderData.purchase_units[0].payments.captures[0];
                document.getElementById('right-panel-para').innerHTML = '<p>PayPal Transaction ID: <b>' + transaction.id + "</b> Transaction Status: <b>" + transaction.status + "</b></p>";
                showNotification("Transaction Completed!");
                //alert('Transaction ' + transaction.status + ': ' + transaction.id + '\n\nSee console for all available details');

                // Replace the above to show a success message within this page, e.g.
                // const element = document.getElementById('paypal-button-container');
                // element.innerHTML = '';
                // element.innerHTML = '<h3>Thank you for your payment!</h3>';
                // Or go to another URL:  actions.redirect('thank_you.html');
            })
        }
    })
    // Check if the button is eligible
    if (button.isEligible()) {
        // Render the standalone button for that payment method
        button.render('#paypal-bcdc-button-container')
    }
})
