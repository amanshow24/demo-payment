document.addEventListener("DOMContentLoaded", () => {
  const plans = document.querySelectorAll(".plan");
  plans.forEach((planDiv) => {
    planDiv.addEventListener("click", () => {
      const plan = planDiv.getAttribute("data-plan");
      subscribe(plan);
    });
  });
});

async function subscribe(plan) {
  try {
    const res = await fetch("/payment/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });

    const data = await res.json();

    const options = {
      key: data.razorpayKey,
      subscription_id: data.subscription_id,
      name: "Premium Demo App",
      description: "Unlock exclusive features",
      theme: { color: "#3399cc" },
      handler: async function (response) {
        const verifyRes = await fetch("/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response)
        });

        const result = await verifyRes.json();
        if (result.success) {
          window.location.href = "/premium";
        } else {
          alert("❌ Payment verification failed. Please try again.");
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to create Razorpay subscription.");
  }
}
