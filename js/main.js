// === Mochidog — Main JS ===
// Shopping cart, product loading, UI interactions

const CART_KEY = 'mochidog_cart';
const PRODUCTS_URL = '/data/products.json';

// ============ Cart ============
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function cartCount() { return getCart().reduce((s,i) => s + i.qty, 0); }
function cartTotal() { return getCart().reduce((s,i) => s + i.price * i.qty, 0); }

function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) { existing.qty += qty; }
  else { cart.push({ ...product, qty }); }
  saveCart(cart);
  updateCartUI();
  showToast(`${product.name} added to cart! 🐾`);
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  updateCartUI();
  renderCartItems();
}

function clearCart() { saveCart([]); updateCartUI(); renderCartItems(); }

function updateCartUI() {
  const count = cartCount();
  document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

// ============ Toast ============
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ============ Cart Sidebar ============
function toggleCart() {
  document.querySelector('.cart-sidebar').classList.toggle('active');
  document.querySelector('.cart-overlay').classList.toggle('active');
  if (document.querySelector('.cart-sidebar').classList.contains('active')) {
    renderCartItems();
  }
}

function renderCartItems() {
  const container = document.querySelector('.cart-items');
  const cart = getCart();
  if (!container) return;
  if (cart.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">🛒</div><h3>Your cart is empty</h3><p>Find a puppy to adopt!</p></div>';
  } else {
    container.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">🐕</div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="item-price">$${item.price.toFixed(2)} × ${item.qty}</div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
      </div>
    `).join('');
  }
  document.querySelector('.cart-total-amount').textContent = `$${cartTotal().toFixed(2)}`;
}

// ============ Load Products ============
async function loadProducts() {
  if (window.__products) return window.__products;
  try {
    const resp = await fetch(PRODUCTS_URL);
    window.__products = await resp.json();
    return window.__products;
  } catch(e) { console.error('Failed to load products:', e); return []; }
}

// ============ Home Page: Featured Products ============
async function renderFeatured() {
  const grid = document.querySelector('#featured-grid');
  if (!grid) return;
  const products = await loadProducts();
  const featured = products.filter(p => p.type === 'puppy').slice(0, 6);
  grid.innerHTML = featured.map(p => productCardHTML(p)).join('');
}

// ============ Shop Page ============
async function renderShop(filter = 'all') {
  const grid = document.querySelector('#shop-grid');
  if (!grid) return;
  const products = await loadProducts();
  let filtered = products;
  if (filter === 'puppies') filtered = products.filter(p => p.type === 'puppy');
  else if (filter === 'outfits') filtered = products.filter(p => p.category === 'Outfits');
  else if (filter === 'accessories') filtered = products.filter(p => p.category === 'Accessories');
  else if (filter === 'bundles') filtered = products.filter(p => p.type === 'bundle');
  grid.innerHTML = filtered.map(p => productCardHTML(p)).join('');
}

// ============ Product Card HTML ============
function productCardHTML(p) {
  const badgeHTML = p.badge ? `<span class="badge">${p.badge}</span>` : '';
  const typeLabel = p.type === 'puppy' ? 'Plush Toy' : p.type === 'bundle' ? 'Adoption Bundle' : p.category || 'Accessory';
  const imgPath = `/assets/products/${p.slug || p.id}.jpg`;
  
  return `
    <div class="product-card"${p.slug ? ` onclick="location.href='/products/${p.slug}.html'"` : ''}>
      ${badgeHTML}
      <div class="product-image">
        <img src="${imgPath}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="placeholder" style="display:none">
          <span class="emoji">🐾</span>
          <span class="label">${p.breed || p.name}</span>
          <span class="sku">${p.id}</span>
        </div>
      </div>
      <div class="product-body">
        <div class="product-type">${typeLabel}</div>
        <h3>${p.name}</h3>
        ${p.personality ? `<div class="product-personality">${p.personality}</div>` : ''}
        <div class="product-footer">
          <div>
            <span class="product-price">$${p.price.toFixed(2)}</span>
            ${p.compareAt ? `<span class="product-compare">$${p.compareAt.toFixed(2)}</span>` : ''}
          </div>
          <button class="add-to-cart" onclick="event.stopPropagation(); addToCart({id:'${p.id}',name:'${p.name.replace(/'/g,"\\'")}',price:${p.price},image:'${imgPath}'})">
            Adopt →
          </button>
        </div>
      </div>
    </div>`;
}

// ============ Product Detail Page ============
async function renderProductDetail() {
  const container = document.querySelector('#product-detail');
  if (!container) return;
  
  const slug = window.location.pathname.split('/').pop().replace('.html','');
  const products = await loadProducts();
  const p = products.find(x => x.slug === slug);
  if (!p) { container.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><h3>Puppy not found</h3></div>'; return; }
  
  const emoji = p.type === 'puppy' ? '🐕' : p.category === 'Outfits' ? '👗' : '🕶️';
  
  document.title = `${p.name} — Plush Toy — Mochidog`;
  container.innerHTML = `
    <div class="product-detail">
      <div class="product-gallery">${emoji}</div>
      <div class="product-info">
        ${p.badge ? `<span class="badge" style="position:static;display:inline-block;margin-bottom:12px">${p.badge}</span>` : ''}
        <h1>${p.name}</h1>
        <div class="personality">${p.personality || p.description?.slice(0,60) || ''}</div>
        <div class="price-block">
          <span class="price">$${p.price.toFixed(2)}</span>
          ${p.compareAt ? `<span class="compare">$${p.compareAt.toFixed(2)}</span>` : ''}
        </div>
        <p class="description">${p.description}</p>
        ${p.features ? `
        <h4 style="margin-bottom:8px">✨ What You'll Receive</h4>
        <ul class="feature-list">
          ${p.features.map(f => `<li>${f}</li>`).join('')}
        </ul>` : ''}
        ${p.weight ? `<p style="color:var(--text-light);font-size:0.85rem;margin-bottom:12px">📦 Weight: ${p.weight}kg</p>` : ''}
        <div class="quantity-selector">
          <button onclick="changeQty(-1)">−</button>
          <span id="qty-display">1</span>
          <button onclick="changeQty(1)">+</button>
        </div>
        <button class="btn btn-primary btn-large" onclick="addToCartFromDetail('${p.id}')">
          🐾 Adopt Now — $${p.price.toFixed(2)}
        </button>
        ${p.story_preview ? `
        <div class="story-block">
          <h3>📖 Story Preview</h3>
          <p>"${p.story_preview}"</p>
          <p style="margin-top:8px;color:var(--coral);font-size:0.9rem">💡 Full story unlocked with your code!</p>
        </div>` : ''}
      </div>
    </div>
  `;
}

let detailQty = 1;
function changeQty(delta) {
  detailQty = Math.max(1, detailQty + delta);
  const display = document.getElementById('qty-display');
  if (display) display.textContent = detailQty;
  const btn = document.querySelector('.btn-large');
  if (btn) {
    const price = parseFloat(btn.textContent.match(/[\d.]+/)?.[0] || 0) / detailQty;
    btn.textContent = `🐾 Adopt Now — $${(price * detailQty).toFixed(2)}`;
  }
}

async function addToCartFromDetail(id) {
  const products = await loadProducts();
  const p = products.find(x => x.id === id);
  if (p) addToCart({id: p.id, name: p.name, price: p.price, image: p.images?.[0] || '🐕'}, detailQty);
  detailQty = 1;
}

// ============ Adoption Page ============
function renderAdoption() {
  const container = document.querySelector('#identity-reveal');
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code') || 'Unknown';
  container.innerHTML = `
    <div class="identity-reveal">
      <div class="celebration">🎉</div>
      <h2>Congratulations!</h2>
      <p>You've adopted...</p>
      <div class="puppy-name">✨ Your Puppy ✨</div>
      <div class="story">
        <h3>📖 The Story of #${code}</h3>
        <p>Your puppy's unique AI-generated story will appear here. Each Mochidog puppy has a one-of-a-kind identity — name, personality, birth story, and special quirks — all generated uniquely for them.</p>
        <p style="margin-top:12px;color:var(--coral)">💡 Scan the code on your identity card to unlock this plush dog's full identity!</p>
      </div>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
        <a href="/shop.html" class="btn btn-primary">🐕 Adopt Another</a>
        <a href="/shop.html?filter=outfits" class="btn btn-outline">👗 Shop Outfits</a>
      </div>
    </div>`;
}

// ============ Init ============
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  renderFeatured();
  renderShop();
  renderProductDetail();
  renderAdoption();

  // Cart toggle listeners
  document.querySelectorAll('[data-cart-toggle]').forEach(el => {
    el.addEventListener('click', toggleCart);
  });
  document.querySelector('.cart-overlay')?.addEventListener('click', toggleCart);
  document.querySelector('.cart-close')?.addEventListener('click', toggleCart);

  // Mobile menu
  document.querySelector('.mobile-menu-btn')?.addEventListener('click', function() {
    document.querySelector('.nav-links').classList.toggle('mobile-open');
  });

  // Checkout button
  document.querySelector('.checkout-btn')?.addEventListener('click', () => {
    const cart = getCart();
    if (cart.length === 0) return showToast('Your cart is empty! 🛒');
    alert(`Checkout coming soon!\n\n${cart.length} items — Total: $${cartTotal().toFixed(2)}\n\nFor now, email your order to hello@mochidog.store`);
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderShop(this.dataset.filter);
    });
  });
});
