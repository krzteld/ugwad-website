const ALLOWED_STATUSES = [
  "Pending",
  "Confirmed",
  "In-Progress",
  "Shipped/Ready",
  "Completed",
  "Cancelled"
];

let allOrders = [];

document.addEventListener("DOMContentLoaded", () => {
  loadOrders();

  const searchInput = document.getElementById("orderSearchInput");
  const statusFilter = document.getElementById("statusFilter");
  const searchBtn = document.getElementById("searchBtn");

  if (searchBtn) searchBtn.addEventListener("click", renderFilteredOrders);
  if (searchInput) searchInput.addEventListener("input", renderFilteredOrders);
  if (statusFilter) statusFilter.addEventListener("change", renderFilteredOrders);
});

// 1. Read orders from Supabase
async function loadOrders() {
  const container = document.getElementById("ordersList");
  container.innerHTML = "<p>Loading orders...</p>";

  try {
    const { data, error } = await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    allOrders = data || [];
    renderFilteredOrders();
  } catch (err) {
    console.error("Error loading orders:", err);
    container.innerHTML = `<p style="color:red;">Failed to load orders: ${err.message}</p>`;
  }
}

// 2. Search & Status Filter
function renderFilteredOrders() {
  const query = (document.getElementById("orderSearchInput")?.value || "")
    .trim()
    .toLowerCase();
  const selectedStatus = document.getElementById("statusFilter")?.value || "All";

  const filtered = allOrders.filter((order) => {
    const codeMatch = (order.order_code || "").toLowerCase().includes(query);
    const nameMatch = (order.customer_name || "").toLowerCase().includes(query);
    const matchesSearch = !query || codeMatch || nameMatch;
    const matchesStatus =
      selectedStatus === "All" || order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  renderOrderCards(filtered);
}

// 3. Render Order Cards with Automatic Status Lock
function renderOrderCards(orders) {
  const container = document.getElementById("ordersList");

  if (!orders.length) {
    container.innerHTML = "<p>No matching orders found.</p>";
    return;
  }

  container.innerHTML = orders
    .map((order) => {
      const isPending = order.status === "Pending";
      const totalFormatted = Number(order.total_amount || 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP"
      });

      const receiptHtml = order.receipt_url
        ? `<p><strong>GCash Receipt:</strong> <a href="${order.receipt_url}" target="_blank" rel="noopener">View Proof of Payment</a></p>`
        : `<p><strong>GCash Receipt:</strong> Not uploaded</p>`;

      const customerSection = isPending
        ? `
          <button type="button" class="btn" onclick="handleCustomerEditQuantity('${order.id}')">
            Edit Quantity
          </button>
          <button type="button" class="btn" style="background:#dc3545;color:#fff;" onclick="handleCustomerCancelOrder('${order.id}')">
            Cancel Order
          </button>
        `
        : `
          <p style="background:#f4f4f4;padding:8px 12px;border-left:4px solid #666;margin:10px 0;">
            Order <strong>${order.status}</strong> — weaving/fulfillment locked. Contact UGWAD on Messenger for changes.
          </p>
        `;

      return `
        <div class="card" style="margin-bottom: 1rem; padding: 1.25rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
            <strong>Order Code: ${order.order_code || "N/A"} — ${order.customer_name || "Customer"}</strong>
            <span style="padding:4px 10px;border-radius:12px;background:#eee;font-weight:bold;">
              ${order.status}
            </span>
          </div>

          <p><strong>Product:</strong> ${order.product || order.product_name || "Woven Item"} (Qty: ${order.quantity || 1})</p>
          <p><strong>Total Amount:</strong> ${totalFormatted}</p>
          <p><strong>Fulfillment:</strong> ${order.fulfillment_type || "Pickup"} (${order.shipping_region || "N/A"})</p>
          ${receiptHtml}

          ${!isPending ? customerSection : ""}

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            ${isPending ? customerSection : ""}
            <button type="button" class="btn" onclick="handleOfficerUpdateStatus('${order.id}')">
              Officer: Update Status
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

// 4. Customer Edit Quantity (Only while status === "Pending" + 4-digit PIN)
async function handleCustomerEditQuantity(orderId) {
  const order = allOrders.find((o) => String(o.id) === String(orderId));
  if (!order) return;

  if (order.status !== "Pending") {
    alert("This order is already confirmed and can no longer be edited.");
    return;
  }

  const enteredPin = prompt(`Enter the 4-digit Order PIN for ${order.order_code}:`);
  if (!enteredPin) return;

  if (enteredPin.trim() !== String(order.order_pin).trim()) {
    alert("Incorrect Order PIN. Update cancelled.");
    return;
  }

  const newQtyInput = prompt("Enter new quantity (minimum 1):", order.quantity);
  const newQty = parseInt(newQtyInput, 10);

  if (isNaN(newQty) || newQty < 1) {
    alert("Please enter a valid quantity of at least 1.");
    return;
  }

  const oldQty = Number(order.quantity) || 1;
  const unitPrice = Number(order.total_amount || 0) / oldQty;
  const newTotal = Number((unitPrice * newQty).toFixed(2));

  try {
    const { error } = await supabaseClient
      .from("orders")
      .update({ quantity: newQty, total_amount: newTotal })
      .eq("id", order.id);

    if (error) throw error;

    alert(`Quantity updated to ${newQty} for ${order.order_code}.`);
    await loadOrders();
  } catch (err) {
    console.error("Error updating quantity:", err);
    alert("Failed to update quantity: " + err.message);
  }
}

// 5. Customer Cancel Order (Only while status === "Pending" + PIN + Member 5's confirmDelete)
async function handleCustomerCancelOrder(orderId) {
  const order = allOrders.find((o) => String(o.id) === String(orderId));
  if (!order) return;

  if (order.status !== "Pending") {
    alert("This order is already confirmed and cannot be cancelled here.");
    return;
  }

  const enteredPin = prompt(`Enter the 4-digit Order PIN to cancel ${order.order_code}:`);
  if (!enteredPin) return;

  if (enteredPin.trim() !== String(order.order_pin).trim()) {
    alert("Incorrect Order PIN. Cancellation aborted.");
    return;
  }

  const confirmed =
    typeof confirmDelete === "function"
      ? confirmDelete(order.order_code)
      : confirm(`Are you sure you want to permanently cancel order ${order.order_code}?`);

  if (!confirmed) return;

  try {
    const { error } = await supabaseClient
      .from("orders")
      .delete()
      .eq("id", order.id);

    if (error) throw error;

    alert(`Order ${order.order_code} has been cancelled and removed.`);
    await loadOrders();
  } catch (err) {
    console.error("Error cancelling order:", err);
    alert("Failed to cancel order: " + err.message);
  }
}

// 6. Officer Status Update (Protected by Member 5's verifyOrgPasscode)
async function handleOfficerUpdateStatus(orderId) {
  const order = allOrders.find((o) => String(o.id) === String(orderId));
  if (!order) return;

  const authorized =
    typeof verifyOrgPasscode === "function"
      ? verifyOrgPasscode()
      : prompt("Enter UGWAD Officer Passcode:") === CONFIG.ORG_PASSCODE;

  if (!authorized) {
    alert("Unauthorized: Invalid officer passcode.");
    return;
  }

  const newStatus = prompt(
    `Current Status: ${order.status}\nEnter exact new status (${ALLOWED_STATUSES.join(", ")}):`,
    order.status
  );

  if (!newStatus) return;

  const trimmedStatus = newStatus.trim();
  if (!ALLOWED_STATUSES.includes(trimmedStatus)) {
    alert(`Invalid status. Please enter one of: ${ALLOWED_STATUSES.join(", ")}`);
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("orders")
      .update({ status: trimmedStatus })
      .eq("id", order.id);

    if (error) throw error;

    alert(`Order ${order.order_code} updated to "${trimmedStatus}".`);
    await loadOrders();
  } catch (err) {
    console.error("Error updating order status:", err);
    alert("Failed to update status: " + err.message);
  }
}
