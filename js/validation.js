// Global Input Validation, PIN Gates & Delete Confirmation

// 1. Block blank or whitespace-only text fields
function validateRequiredFields(fieldsObj) {
  for (const [label, value] of Object.entries(fieldsObj)) {
    if (!value || value.toString().trim() === "") {
      alert(`Validation Error: "${label}" is required and cannot be blank.`);
      return false;
    }
  }
  return true;
}

// 2. Validate positive numbers (used for Price, Quantity, and 1-5 Star Rating)
function validateNumberRange(label, value, min, max = Infinity) {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    const rangeText = max === Infinity ? `at least ${min}` : `between ${min} and ${max}`;
    alert(`Validation Error: "${label}" must be a number ${rangeText}.`);
    return false;
  }
  return true;
}

// 3. Validate 4-digit numeric PIN (used for Customer Orders and Reviews)
function validatePin(pin) {
  if (!/^\d{4}$/.test(pin)) {
    alert("Validation Error: Please enter a valid 4-digit numeric PIN (e.g., 1234).");
    return false;
  }
  return true;
}

// 4. Organization Passcode Gate (protects Product CRUD & Confirmed Order updates)
function verifyOrgPasscode() {
  const entered = prompt("Enter UGWAD Organization Passcode to continue:");
  if (entered === null) return false; // User clicked Cancel
  if (entered !== CONFIG.ORG_PASSCODE) {
    alert("Access Denied: Incorrect Organization Passcode.");
    return false;
  }
  return true;
}

// 5. Delete Confirmation Pop-up
function confirmDelete(itemDescription) {
  return confirm(
    `Are you sure you want to permanently delete "${itemDescription}"? This action cannot be undone.`
  );
}
