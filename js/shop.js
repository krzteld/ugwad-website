const db = window.supabaseClient;

let allProducts = [];
let editingProductId = null;

// DOM Elements
const productGrid = document.getElementById('productGrid');
const productForm = document.getElementById('productForm');
const formTitle = document.getElementById('formHeading');
const submitBtn = document.getElementById('submitProductBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

// Load products as soon as the page opens
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();

  // Live search and category filtering
  if (searchInput) searchInput.addEventListener('input', filterAndRender);
  if (categoryFilter) categoryFilter.addEventListener('change', filterAndRender);

  // Form submit handler (handles both Create and Update)
  if (productForm) productForm.addEventListener('submit', handleFormSubmit);

  // Cancel edit mode
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', resetForm);
});

// ==========================================
// 1. READ: Fetch Products from Supabase
// ==========================================
async function fetchProducts() {
  if (!productGrid) return;
  productGrid.innerHTML = '<p>Loading handcrafted buri products...</p>';

  const { data, error } = await db
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    productGrid.innerHTML = '<p class="error">Failed to load products. Please check your connection.</p>';
    return;
  }

  allProducts = data || [];
  filterAndRender();
}

// Filter products by search keyword & category, then display cards
function filterAndRender() {
  const keyword = (searchInput?.value || '').toLowerCase().trim();
  const category = categoryFilter?.value || 'All';

  const filtered = allProducts.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesKeyword =
      item.name.toLowerCase().includes(keyword) ||
      (item.description && item.description.toLowerCase().includes(keyword));
    return matchesCategory && matchesKeyword;
  });

  renderProducts(filtered);
}

// Render product cards into #productGrid
function renderProducts(products) {
  if (products.length === 0) {
    productGrid.innerHTML = '<p>No buri crafts found matching your filter.</p>';
    return;
  }

  productGrid.innerHTML = products
    .map(
      (product) => `
      <div class="product-card" data-id="${product.id}">
        <img 
          src="${product.image_url || 'images/hero-buri.jpg'}" 
          alt="Handwoven ${product.name} made from buri palm leaves in Anini-y, Antique"
          class="product-img"
        />
        <div class="product-info">
          <span class="badge">${product.category}</span>
          <h3>${product.name}</h3>
          <p class="price-tag">₱${Number(product.price).toFixed(2)}</p>
          <p class="description">${product.description || ''}</p>
          
          <div class="card-actions" style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
            <a href="checkout.html?product=${encodeURIComponent(product.name)}" class="btn-primary">
              Order Now
            </a>
            <button type="button" class="btn-secondary" onclick="startEditProduct('${product.id}')">
              Edit
            </button>
            <button type="button" class="btn-danger" onclick="deleteProduct('${product.id}', '${product.name.replace(/'/g, "\\'")}')">
              Delete
            </button>
          </div>
        </div>
      </div>
    `
    )
    .join('');
}

// ==========================================
// 2 & 3. CREATE & UPDATE: Form Submission
// ==========================================
async function handleFormSubmit(e) {
  e.preventDefault();

  // Security check: Only UGWAD officers with passcode can add/edit
  if (!verifyOrgPasscode()) return;

  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const description = document.getElementById('productDescription').value.trim();
  const imageInput = document.getElementById('productImage');
  const file = imageInput?.files[0];

  // Validate inputs using Member 5's validation.js helpers
  const isFilled = validateRequiredFields({
    'Product Name': name,
    'Category': category,
    'Description': description,
  });
  if (!isFilled) return;

  if (!validateNumberRange('Price', price, 1)) return;
  if (!editingProductId && !file) { alert('Please upload a product photo.'); return; }
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = editingProductId ? 'Updating...' : 'Saving...';
  }

  try {
    let imageUrl = document.getElementById('existingImageUrl')?.value || '';

    // Upload new image to Cloudinary if a file was selected
    if (file) {
      imageUrl = await uploadImageToCloudinary(file);
    }

    const payload = {
      name,
      category,
      price,
      description,
      image_url: imageUrl,
    };

    if (editingProductId) {
      // 3. UPDATE existing product
      const { error } = await db
        .from('products')
        .update(payload)
        .eq('id', editingProductId);

      if (error) throw error;
      alert('Product updated successfully!');
    } else {
      // 2. CREATE new product
      const { error } = await db
        .from('products')
        .insert([payload]);

      if (error) throw error;
      alert('New buri product added to the catalog!');
    }

    resetForm();
    fetchProducts();
  } catch (err) {
    console.error('Save failed:', err);
    alert('Error saving product: ' + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = editingProductId ? 'Update Product' : 'Add Product';
    }
  }
}

// ==========================================
// 3. UPDATE Helper: Populate Form to Edit
// ==========================================
function startEditProduct(id) {
  if (!verifyOrgPasscode()) return;

  const product = allProducts.find((p) => String(p.id) === String(id));
  if (!product) return;

  editingProductId = product.id;

  document.getElementById('productName').value = product.name;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productDescription').value = product.description || '';
  if (document.getElementById('existingImageUrl')) {
    document.getElementById('existingImageUrl').value = product.image_url || '';
  }

  if (formTitle) formTitle.textContent = `Edit Product: ${product.name}`;
  if (submitBtn) submitBtn.textContent = 'Update Product';
  if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';

  productForm.scrollIntoView({ behavior: 'smooth' });
}

// Reset form back to "Add New Product" mode
function resetForm() {
  editingProductId = null;
  productForm.reset();
  if (document.getElementById('existingImageUrl')) {
    document.getElementById('existingImageUrl').value = '';
  }
  if (formTitle) formTitle.textContent = 'Add New Buri Product';
  if (submitBtn) submitBtn.textContent = 'Add Product';
  if (cancelEditBtn) cancelEditBtn.style.display = 'none';
}

// ==========================================
// 4. DELETE: Remove Product with Confirmation
// ==========================================
async function deleteProduct(id, productName) {
  // Check passcode first
  if (!verifyOrgPasscode()) return;

  // Trigger mandatory confirmation dialog from Member 5's validation.js
  if (!confirmDelete(productName)) return;

  const { error } = await db
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete error:', error);
    alert('Failed to delete product: ' + error.message);
    return;
  }

  alert(`"${productName}" has been deleted.`);
  fetchProducts();
}
