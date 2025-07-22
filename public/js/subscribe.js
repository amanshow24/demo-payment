document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".plan button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const plan = button.parentElement.getAttribute("data-plan");
      subscribe(plan);
    });
  });
});

async function subscribe(plan) {
  const button = document.querySelector(`.plan[data-plan="${plan}"] button`);
  button.disabled = true;
  button.textContent = "Processing...";

  try {
    const csrfToken = document.querySelector("#csrfToken")?.value;
    if (!csrfToken) {
      throw new Error("CSRF token missing. Please refresh the page.");
    }

    const res = await fetch("/payment/create-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      credentials: "include",
      body: JSON.stringify({ plan })
    });

    const data = await res.json();

    if (!res.ok || !data.razorpayKey || !data.subscription_id) {
      throw new Error(data.message || "Failed to initiate subscription.");
    }

    const options = {
      key: data.razorpayKey,
      subscription_id: data.subscription_id,
      name: "Premium Demo App",
      description: "Unlock exclusive features",
      theme: { color: "#3399cc" },
      handler: async function (response) {
        try {
          const verifyRes = await fetch("/payment/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken
            },
            credentials: "include",
            body: JSON.stringify(response)
          });

          const result = await verifyRes.json();
          if (result.success) {
            window.location.href = "/premium";
          } else {
            showError("Payment verification failed. Please try again.");
            console.error("Verification error:", result.message);
          }
        } catch (verifyErr) {
          showError("Verification process failed. Contact support.");
          console.error("Verification error:", verifyErr);
        }
      },
      prefill: {
        name: data.userName || "User",
        email: data.userEmail || "user@example.com"
      },
      modal: {
        ondismiss: function () {
          showError("Payment was canceled. You can try again.");
          console.log("Payment modal dismissed");
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    showError(`Failed to create subscription: ${err.message}.`);
    console.error("Subscription error:", err.message);
  } finally {
    button.disabled = false;
    button.textContent = "Select Plan";
  }
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-banner";
  errorDiv.textContent = message;
  document.querySelector(".plans-container").prepend(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}