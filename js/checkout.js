// ==========================================
// UGWAD CHECKOUT
// Member 3 - checkout.js
// ==========================================

const db = window.supabaseClient;

// Replace with the real UGWAD Messenger page.
const MESSENGER_URL = "https://www.facebook.com/share/14wfY7CDgED/?mibextid=wwXIfr";

// Shipping fees
const shippingRates = {
    "Antique / Panay": 80,
    "Visayas": 120,
    "Luzon": 180,
    "Mindanao": 200
};


// HTML elements
const checkoutForm = document.getElementById("checkoutForm");
const productSelected = document.getElementById("productSelected");
const productDisplay = document.getElementById("productDisplay");
const quantityInput = document.getElementById("quantity");

const shippingSection = document.getElementById("shippingSection");
const shippingRegion = document.getElementById("shippingRegion");

const subtotalDisplay = document.getElementById("productSubtotal");
const shippingDisplay = document.getElementById("shippingFee");
const totalDisplay = document.getElementById("totalAmount");

const orderResult = document.getElementById("orderResult");


// ==========================================
// 1. GET PRODUCT PRICE
// ==========================================

function getProductPrice() {
    return Number(productSelected.dataset.price) || 0;
}


// ==========================================
// 2. GET FULFILLMENT TYPE
// ==========================================

function getFulfillmentType() {

    const selected = document.querySelector(
        'input[name="fulfillmentType"]:checked'
    );

    return selected ? selected.value : "Pickup";
}


// ==========================================
// 3. CALCULATE ORDER TOTAL
// ==========================================

function calculateTotal() {

    const price = getProductPrice();
    const quantity = Number(quantityInput.value) || 0;

    const fulfillmentType = getFulfillmentType();

    const subtotal = price * quantity;

    let shippingFee = 0;

    if (fulfillmentType === "Delivery") {
        shippingFee = shippingRates[shippingRegion.value] || 0;
    }

    const total = subtotal + shippingFee;

    subtotalDisplay.textContent = "₱" + subtotal.toFixed(2);
    shippingDisplay.textContent = "₱" + shippingFee.toFixed(2);
    totalDisplay.textContent = "₱" + total.toFixed(2);

    return {
        subtotal,
        shippingFee,
        total
    };
}


// ==========================================
// 4. SHOW DELIVERY REGION
// ==========================================

document.querySelectorAll(
    'input[name="fulfillmentType"]'
).forEach(radio => {

    radio.addEventListener("change", function() {

        if (this.value === "Delivery") {

            shippingSection.classList.remove("hidden");
            shippingRegion.required = true;

        } else {

            shippingSection.classList.add("hidden");
            shippingRegion.required = false;
            shippingRegion.value = "";

        }

        calculateTotal();

    });

});


// Update total automatically
productSelected.addEventListener("change", calculateTotal);
quantityInput.addEventListener("input", calculateTotal);
shippingRegion.addEventListener("change", calculateTotal);


// ==========================================
// 5. GENERATE UNIQUE ORDER CODE
// ==========================================

async function generateOrderCode() {

    for (let attempt = 0; attempt < 20; attempt++) {

        const number = Math.floor(Math.random() * 900) + 100;

        const code = "UGWAD-" + number;

        const { data, error } = await db
            .from("orders")
            .select("order_code")
            .eq("order_code", code)
            .maybeSingle();

        if (error) throw error;

        if (!data) return code;
    }

    throw new Error("Could not generate an order code. Try again.");
}


// ==========================================
// 6. CHECKOUT SUBMISSION
// ==========================================

checkoutForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (!db) {
        alert("Supabase connection is missing.");
        return;
    }

    const button = document.getElementById("placeOrderBtn");

    try {

        const customerName =
            document.getElementById("customerName").value.trim();

        const product = productSelected.value;

        const quantity = Number(quantityInput.value);

        const fulfillmentType = getFulfillmentType();

        const orderPin =
            document.getElementById("orderPin").value;

        const receiptFile =
            document.getElementById("receiptFile").files[0];


        // Required field validation
      if (typeof validateRequiredFields === "function") {
    if (!validateRequiredFields({
        "Customer Name": customerName,
        "Product": product
    })) return;
}

        if (!customerName || !product || !receiptFile) {
            alert("Please complete all required fields.");
            return;
        }


        // Quantity validation
        if (
            typeof validateNumberRange === "function" &&
            validateNumberRange("Quantity", quantity, 1) === false
        ) {
            return;
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            alert("Quantity must be at least 1.");
            return;
        }


        // PIN validation
        if (typeof validatePin === "function") {

            if (validatePin(orderPin) === false) return;

        } else if (!/^\d{4}$/.test(orderPin)) {

            alert("Enter a valid 4-digit PIN.");
            return;
        }


        // Receipt validation
        if (!receiptFile.type.startsWith("image/")) {
            alert("Please upload an image receipt.");
            return;
        }


        // Shipping validation
        let region = "N/A (Pickup)";

        if (fulfillmentType === "Delivery") {

            if (!shippingRates.hasOwnProperty(shippingRegion.value)) {
                alert("Please select a valid shipping region.");
                return;
            }

            region = shippingRegion.value;
        }


        const amounts = calculateTotal();

        if (amounts.subtotal <= 0) {
            alert("Please select a product.");
            return;
        }


        button.disabled = true;
        button.textContent = "Processing Order...";


        // ==================================
        // UPLOAD RECEIPT
        // ==================================

        if (typeof uploadImageToCloudinary !== "function") {
            throw new Error("Cloudinary upload function is missing.");
        }

        const receiptUrl =
            await uploadImageToCloudinary(receiptFile);

        if (typeof receiptUrl !== "string" ||
            !/^https:\/\//i.test(receiptUrl)) {
            throw new Error("Receipt upload did not return a valid URL.");
        }


        // ==================================
        // GENERATE ORDER CODE
        // ==================================

        const orderCode = await generateOrderCode();


        // ==================================
        // SAVE ORDER TO SUPABASE
        // ==================================

        const orderData = {

            customer_name: customerName,
            product_name: product,
            quantity: quantity,
            fulfillment_type: fulfillmentType,
            shipping_region: region,
            total_amount: amounts.total,
            receipt_url: receiptUrl,
            order_code: orderCode,
            order_pin: orderPin,
            status: "Pending"

        };

        const { error } = await db
            .from("orders")
            .insert([orderData]);

        if (error) throw error;


        // ==================================
        // SUCCESS MESSAGE
        // ==================================

        const result = document.createElement("div");

        result.className = "success-box";

        const heading = document.createElement("h2");
        heading.textContent = "Your Order Has Been Submitted!";

        const message = document.createElement("p");
        message.textContent =
            "Thank you for supporting UGWAD's local weavers.";

        const code = document.createElement("p");
        code.className = "order-code";
        code.textContent = "Order Code: " + orderCode;

        const pinReminder = document.createElement("p");
        pinReminder.textContent =
            "Remember your order code and 4-digit PIN. Keep them safe.";

        const status = document.createElement("p");
        status.textContent = "Order Status: Pending";

        const total = document.createElement("p");
        total.textContent =
            "Total Amount: ₱" + amounts.total.toFixed(2);

        result.append(
            heading,
            message,
            code,
            pinReminder,
            status,
            total
        );


        if (fulfillmentType === "Delivery") {

            const divider = document.createElement("hr");

            const privacyHeading = document.createElement("h3");
            privacyHeading.textContent = "Delivery Instructions";

            const privacyMessage = document.createElement("p");
            privacyMessage.textContent =
                "To protect your privacy, your exact home address is not collected in our public order database. Please privately send your delivery address and order code to our weavers through Facebook Messenger.";

            const messengerLink = document.createElement("a");

            messengerLink.href = MESSENGER_URL;
            messengerLink.target = "_blank";
            messengerLink.rel = "noopener noreferrer";
            messengerLink.className = "messenger-btn";
            messengerLink.textContent = "Message UGWAD on Messenger";

            result.append(
                divider,
                privacyHeading,
                privacyMessage,
                messengerLink
            );
        }


        orderResult.replaceChildren(result);
        orderResult.classList.remove("hidden");


        // Reset the form
        checkoutForm.reset();

        shippingSection.classList.add("hidden");
        shippingRegion.required = false;

        calculateTotal();

        orderResult.scrollIntoView({ behavior: "smooth" });

    } catch (error) {

        console.error("Checkout error:", error);

        alert("Unable to submit order: " + error.message);

    } finally {

        button.disabled = false;
        button.textContent = "Place Order";

    }

});


// ==========================================
// 7. PRODUCT FROM URL
// ==========================================

async function loadSelectedProduct() {
    const name = new URLSearchParams(window.location.search).get("product");

    if (!name) {
        alert("No product selected. Please choose an item from the shop.");
        window.location.href = "shop.html";
        return;
    }

    const { data, error } = await db
        .from("products")
        .select("name, price")
        .eq("name", name)
        .maybeSingle();

    if (error || !data) {
        alert("Product not found. Please choose an item from the shop.");
        window.location.href = "shop.html";
        return;
    }

    productSelected.value = data.name;
    productSelected.dataset.price = data.price;
    productDisplay.value = data.name + " (₱" + Number(data.price).toFixed(2) + ")";
    calculateTotal();
}

loadSelectedProduct();

// Initial calculation
calculateTotal();
