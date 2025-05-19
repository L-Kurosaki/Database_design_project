const prices = {
  "Unibo-Megacity": 30,
  "Unibo-Morena Mall": 40,
  "Unibo-The Crossing": 50,
  "Megacity-Morena Mall": 35,
  "Megacity-The Crossing": 45,
  "Morena Mall-The Crossing": 60,
};

document.getElementById("bookingForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const contact = document.getElementById("contact").value;
  const pickup = document.getElementById("pickup").value;
  const destination = document.getElementById("destination").value;
  const ticketType = document.getElementById("ticketType").value;
  const quantity = parseInt(document.getElementById("quantity").value);
  const paymentMethod = document.getElementById("paymentMethod").value;

  if (pickup === destination) {
    alert("Pickup and destination can't be the same!");
    return;
  }

  let routeKey = `${pickup}-${destination}`;
  if (!prices[routeKey]) routeKey = `${destination}-${pickup}`;
  const basePrice = prices[routeKey] || 30;
  const total = (ticketType === "Child" ? basePrice * 0.5 : basePrice) * quantity;

  let paymentSuccess = false;
  if (paymentMethod === "Card") {
    const cardNumber = document.getElementById("cardNumber").value;
    const expiry = document.getElementById("expiryDate").value;
    const cvv = document.getElementById("cvv").value;

    if (cardNumber && expiry && cvv) {
      paymentSuccess = true;
    } else {
      alert("Card details are incomplete!");
      return;
    }
  } else {
    paymentSuccess = true; // cash assumed successful
  }

  const result = document.getElementById("result");
  if (paymentSuccess) {
    result.innerHTML = `<p>✅ Payment Successful! Total: R${total.toFixed(2)}</p>`;
    const ticket = `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Contact:</strong> ${contact}</p>
      <p><strong>From:</strong> ${pickup}</p>
      <p><strong>To:</strong> ${destination}</p>
      <p><strong>Ticket Type:</strong> ${ticketType}</p>
      <p><strong>Quantity:</strong> ${quantity}</p>
      <p><strong>Total Paid:</strong> R${total.toFixed(2)}</p>
      <p><strong>Payment Method:</strong> ${paymentMethod}</p>
      <p><em>Thank you for booking with Kasi Bus! 🚌</em></p>
    `;
    document.getElementById("ticketContent").innerHTML = ticket;
    document.getElementById("ticket").style.display = "block";
  } else {
    result.innerHTML = `<p>❌ Sorry, payment failed.</p>`;
  }
});

function toggleCardDetails() {
  const method = document.getElementById("paymentMethod").value;
  document.getElementById("cardDetails").style.display = method === "Card" ? "block" : "none";
}
