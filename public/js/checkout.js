const stripe = Stripe("pk_test_51OYhqrSCkQxJQLtNrGtJXz3HqtnTvdiCPM6CzfCvZ3DWfoMC3LoB81OST8m4GsQG8rcIPXV7kNlBmdWzhqBWbJhi00lVEhRQpL");

let elements;
document.querySelector("#payment-form").addEventListener("submit", handleSubmit);

async function initialize(newOrderId) {
	try {
		console.log("inside");

		const response = await fetch("/create-payment-intent", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body:JSON.stringify({newOrderId})
		});

		if (!response.ok) {
			throw new Error("couldnt fetch client secret")
		}else{
			const { clientSecret } = await response.json();
			const appearance = {
				theme: "stripe",
				variables: {
					borderRadius: "0px"
				}
			}

			elements = stripe.elements({ appearance, clientSecret });

			const paymentElement = elements.create("payment");
			paymentElement.mount("#payment-element");

			$('#stripe-modal').modal('show');
		}

	} catch (error) {
		console.log(error.message)
	}
}

async function handleSubmit(e) {
	e.preventDefault();
	setLoading(true);
	
	const { error , paymentIntent } = await stripe.confirmPayment({
		elements,
		confirmParams:{},
		redirect:"if_required"
	});
	
	if (error) {
		showMessage(error.message);
	}
	
	setLoading(false);
}


// ------- UI helpers -------

function showMessage(messageText) {
	const messageContainer = document.querySelector("#payment-message");
	
	messageContainer.classList.remove("hidden");
	messageContainer.textContent = messageText;
	
	setTimeout(function () {
		messageContainer.classList.add("hidden");
		messageContainer.textContent = "";
		$('#stripe-modal').modal('hide');
	}, 5000);
}

// Show a spinner on payment submission
function setLoading(isLoading) {
    const spinner = document.getElementById("spinner");
	const submitButton = document.querySelector("#payment-form button[id='submit']");

    if (isLoading) {
        submitButton.disabled = true;
        spinner.style.display="block";
    } else {
		submitButton.disabled = false;
        spinner.style.display="none";
    }
}


// Fetches the payment intent status after payment submission
// async function checkStatus() {

// 	if (!intent) {
// 		return;
// 	}

// 	const { paymentIntent } = await stripe.retrievePaymentIntent(intent);

// 	switch (paymentIntent.status) {
// 		case "succeeded":
// 			showMessage("Payment succeeded!");
// 			break;
// 		case "processing":
// 			showMessage("Your payment is processing.");
// 			break;
// 		case "requires_payment_method":
// 			showMessage("Your payment was not successful, please try again.");
// 			break;
// 		default:
// 			showMessage("Something went wrong.");
// 			break;
// 	}
// }