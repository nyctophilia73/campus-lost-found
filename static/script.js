/**
 * Campus Lost & Found - Client-Side Application Script
 * ====================================================
 * Modern, clean, and beginner-friendly JavaScript for 3rd-Semester CSE.
 * Handles Fetch API asynchronous calls, multi-field search and filter combining,
 * client-side form validation, mobile navigation toggle, modal controls,
 * and toast notification alerts.
 */

// ============================================================================
// GLOBAL APPLICATION STATE
// ============================================================================
let allItems = [];
let currentDetailItem = null;

// ============================================================================
// DOM ELEMENTS REFERENCE
// ============================================================================
const listingsContainer = document.getElementById('listingsContainer');
const emptyState = document.getElementById('emptyState');
const emptyTitle = document.getElementById('emptyTitle');
const emptyDescription = document.getElementById('emptyDescription');
const resultsCount = document.getElementById('resultsCount');

// Statistics elements
const statTotal = document.getElementById('statTotal');
const statLost = document.getElementById('statLost');
const statFound = document.getElementById('statFound');
const statResolved = document.getElementById('statResolved');

// Search & Filter elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const emptyResetBtn = document.getElementById('emptyResetBtn');

// Modals
const modalLost = document.getElementById('modalLost');
const modalFound = document.getElementById('modalFound');
const modalDetails = document.getElementById('modalDetails');
const modalEdit = document.getElementById('modalEdit');

// Forms
const formLost = document.getElementById('formLost');
const formFound = document.getElementById('formFound');
const formEdit = document.getElementById('formEdit');

// Toast container
const toastContainer = document.getElementById('toastContainer');

// Navigation & Dropdown
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const btnReportDropdown = document.getElementById('btnReportDropdown');
const reportDropdownWrapper = document.querySelector('.report-dropdown-wrapper');

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Set default max date to today on all date pickers
  const today = new Date().toISOString().split('T')[0];
  ['lostDate', 'foundDate', 'editDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.max = today;
  });

  // Attach event listeners
  setupEventListeners();

  // Load items from Flask backend
  loadItemsFromBackend();
});

// ============================================================================
// EVENT LISTENERS CONFIGURATION
// ============================================================================
function setupEventListeners() {
  // Mobile Navigation Toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  // Report Dropdown Toggle
  if (btnReportDropdown && reportDropdownWrapper) {
    btnReportDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = reportDropdownWrapper.classList.toggle('is-open');
      btnReportDropdown.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!reportDropdownWrapper.contains(e.target)) {
        reportDropdownWrapper.classList.remove('is-open');
        btnReportDropdown.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Navigation Links & Buttons to Open Modals
  const bindModalOpener = (btnId, modalEl) => {
    const el = document.getElementById(btnId);
    if (el) {
      el.addEventListener('click', () => {
        closeAllDropdowns();
        openModal(modalEl);
      });
    }
  };

  bindModalOpener('navLinkLost', modalLost);
  bindModalOpener('navLinkFound', modalFound);
  bindModalOpener('heroReportLostBtn', modalLost);
  bindModalOpener('heroReportFoundBtn', modalFound);
  bindModalOpener('dropdownReportLost', modalLost);
  bindModalOpener('dropdownReportFound', modalFound);
  bindModalOpener('footerReportLost', modalLost);
  bindModalOpener('footerReportFound', modalFound);

  // Modal Close Buttons
  document.getElementById('closeModalLostBtn').addEventListener('click', () => closeModal(modalLost));
  document.getElementById('cancelLostBtn').addEventListener('click', () => closeModal(modalLost));

  document.getElementById('closeModalFoundBtn').addEventListener('click', () => closeModal(modalFound));
  document.getElementById('cancelFoundBtn').addEventListener('click', () => closeModal(modalFound));

  document.getElementById('closeModalDetailsBtn').addEventListener('click', () => closeModal(modalDetails));
  document.getElementById('detailsCloseBtn').addEventListener('click', () => closeModal(modalDetails));

  document.getElementById('closeModalEditBtn').addEventListener('click', () => closeModal(modalEdit));
  document.getElementById('cancelEditBtn').addEventListener('click', () => closeModal(modalEdit));

  // Close modals clicking on background overlay
  [modalLost, modalFound, modalDetails, modalEdit].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [modalLost, modalFound, modalDetails, modalEdit].forEach(closeModal);
      closeAllDropdowns();
    }
  });

  // Search input with real-time filtering
  searchInput.addEventListener('input', () => {
    clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
    applyFiltersAndRender();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    applyFiltersAndRender();
    searchInput.focus();
  });

  // Filter change handlers
  filterType.addEventListener('change', applyFiltersAndRender);
  filterCategory.addEventListener('change', applyFiltersAndRender);
  filterStatus.addEventListener('change', applyFiltersAndRender);

  // Reset filter handlers
  resetFiltersBtn.addEventListener('click', resetAllFilters);
  emptyResetBtn.addEventListener('click', resetAllFilters);

  // Form submit handlers
  formLost.addEventListener('submit', handleReportLostSubmit);
  formFound.addEventListener('submit', handleReportFoundSubmit);
  formEdit.addEventListener('submit', handleEditFormSubmit);

  // Details Modal Action handlers
  document.getElementById('detailsResolveBtn').addEventListener('click', handleDetailsResolve);
  document.getElementById('detailsEditBtn').addEventListener('click', handleDetailsEdit);
  document.getElementById('detailsDeleteBtn').addEventListener('click', handleDetailsDelete);
}

function closeAllDropdowns() {
  if (reportDropdownWrapper) {
    reportDropdownWrapper.classList.remove('is-open');
    if (btnReportDropdown) btnReportDropdown.setAttribute('aria-expanded', 'false');
  }
  if (navMenu && navMenu.classList.contains('is-open')) {
    navMenu.classList.remove('is-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }
}

// ============================================================================
// BACKEND API COMMUNICATION (FETCH API)
// ============================================================================

/**
 * Fetch all items from Flask endpoint GET /api/items
 */
async function loadItemsFromBackend() {
  try {
    resultsCount.textContent = 'Fetching latest items...';
    const response = await fetch('/api/items');
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data.success && Array.isArray(data.items)) {
      allItems = data.items;
      updateStatistics();
      applyFiltersAndRender();
    } else {
      showToast('Could not load listings from server.', 'error');
    }
  } catch (error) {
    console.error('Error loading items from backend:', error);
    showToast('Failed to connect to backend server.', 'error');
    resultsCount.textContent = 'Error loading items.';
  }
}

/**
 * Sends a POST request to /api/items to add a new item
 */
async function createItemOnServer(itemData) {
  try {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    const result = await response.json();
    return { ok: response.ok, status: response.status, data: result };
  } catch (err) {
    console.error('Network error creating item:', err);
    return { ok: false, data: { error: 'Network error communicating with server.' } };
  }
}

/**
 * Sends a PUT request to /api/items/<id> to update an item
 */
async function updateItemOnServer(id, itemData) {
  try {
    const response = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (err) {
    console.error('Network error updating item:', err);
    return { ok: false, data: { error: 'Network error updating listing.' } };
  }
}

/**
 * Sends a PUT request to /api/items/<id>/resolve to mark as resolved
 */
async function resolveItemOnServer(id) {
  try {
    const response = await fetch(`/api/items/${id}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (err) {
    console.error('Network error resolving item:', err);
    return { ok: false, data: { error: 'Network error resolving item.' } };
  }
}

/**
 * Sends a DELETE request to /api/items/<id> to remove an item
 */
async function deleteItemOnServer(id) {
  try {
    const response = await fetch(`/api/items/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    return { ok: response.ok, data: result };
  } catch (err) {
    console.error('Network error deleting item:', err);
    return { ok: false, data: { error: 'Network error deleting listing.' } };
  }
}

// ============================================================================
// FORM VALIDATION & SUBMISSION
// ============================================================================

function validateField(inputEl, errorEl, fieldLabel, customValidation = null) {
  const val = inputEl.value.trim();
  errorEl.textContent = '';
  inputEl.classList.remove('is-invalid');

  if (!val) {
    errorEl.textContent = `${fieldLabel} is required.`;
    inputEl.classList.add('is-invalid');
    return false;
  }

  if (customValidation) {
    const err = customValidation(val);
    if (err) {
      errorEl.textContent = err;
      inputEl.classList.add('is-invalid');
      return false;
    }
  }

  return true;
}

function validateContact(val) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9+()-\s]{7,15}$/;
  if (!emailRegex.test(val) && !phoneRegex.test(val)) {
    return 'Enter a valid email address or phone number.';
  }
  return null;
}

function validatePastOrPresentDate(val) {
  const chosenDate = new Date(val);
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  if (chosenDate > now) {
    return 'Date cannot be in the future.';
  }
  return null;
}

/**
 * Handler for Report Lost Item form submission
 */
async function handleReportLostSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('lostItemName');
  const catInput = document.getElementById('lostCategory');
  const locInput = document.getElementById('lostLocation');
  const dateInput = document.getElementById('lostDate');
  const descInput = document.getElementById('lostDescription');
  const idenInput = document.getElementById('lostIdentifyingDetails');
  const studentInput = document.getElementById('lostStudentName');
  const contactInput = document.getElementById('lostContact');

  let isValid = true;
  isValid &= validateField(nameInput, document.getElementById('err-lostItemName'), 'Item name');
  isValid &= validateField(catInput, document.getElementById('err-lostCategory'), 'Category');
  isValid &= validateField(locInput, document.getElementById('err-lostLocation'), 'Location');
  isValid &= validateField(dateInput, document.getElementById('err-lostDate'), 'Date', validatePastOrPresentDate);
  isValid &= validateField(descInput, document.getElementById('err-lostDescription'), 'Description');
  isValid &= validateField(idenInput, document.getElementById('err-lostIdentifyingDetails'), 'Identifying details');
  isValid &= validateField(studentInput, document.getElementById('err-lostStudentName'), 'Your name');
  isValid &= validateField(contactInput, document.getElementById('err-lostContact'), 'Contact info', validateContact);

  if (!isValid) return;

  const newItem = {
    type: 'lost',
    item_name: nameInput.value.trim(),
    category: catInput.value.trim(),
    location: locInput.value.trim(),
    date: dateInput.value.trim(),
    description: descInput.value.trim(),
    identifying_details: idenInput.value.trim(),
    student_name: studentInput.value.trim(),
    contact: contactInput.value.trim(),
    status: 'Active'
  };

  const submitBtn = document.getElementById('submitLostBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const res = await createItemOnServer(newItem);
  submitBtn.disabled = false;
  submitBtn.textContent = 'Submit Lost Item';

  if (res.ok) {
    showToast('✓ Lost item reported successfully!', 'success');
    formLost.reset();
    closeModal(modalLost);
    allItems.unshift(res.data.item);
    updateStatistics();
    applyFiltersAndRender();
  } else {
    showToast(res.data.error || 'Failed to submit lost item report.', 'error');
  }
}

/**
 * Handler for Report Found Item form submission
 */
async function handleReportFoundSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('foundItemName');
  const catInput = document.getElementById('foundCategory');
  const locInput = document.getElementById('foundLocation');
  const dateInput = document.getElementById('foundDate');
  const descInput = document.getElementById('foundDescription');
  const idenInput = document.getElementById('foundIdentifyingDetails');
  const studentInput = document.getElementById('foundStudentName');
  const contactInput = document.getElementById('foundContact');

  let isValid = true;
  isValid &= validateField(nameInput, document.getElementById('err-foundItemName'), 'Item name');
  isValid &= validateField(catInput, document.getElementById('err-foundCategory'), 'Category');
  isValid &= validateField(locInput, document.getElementById('err-foundLocation'), 'Location');
  isValid &= validateField(dateInput, document.getElementById('err-foundDate'), 'Date', validatePastOrPresentDate);
  isValid &= validateField(descInput, document.getElementById('err-foundDescription'), 'Description');
  isValid &= validateField(idenInput, document.getElementById('err-foundIdentifyingDetails'), 'Identifying details');
  isValid &= validateField(studentInput, document.getElementById('err-foundStudentName'), 'Finder name');
  isValid &= validateField(contactInput, document.getElementById('err-foundContact'), 'Contact info', validateContact);

  if (!isValid) return;

  const newItem = {
    type: 'found',
    item_name: nameInput.value.trim(),
    category: catInput.value.trim(),
    location: locInput.value.trim(),
    date: dateInput.value.trim(),
    description: descInput.value.trim(),
    identifying_details: idenInput.value.trim(),
    student_name: studentInput.value.trim(),
    contact: contactInput.value.trim(),
    status: 'Active'
  };

  const submitBtn = document.getElementById('submitFoundBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const res = await createItemOnServer(newItem);
  submitBtn.disabled = false;
  submitBtn.textContent = 'Submit Found Item';

  if (res.ok) {
    showToast('✓ Found item reported successfully!', 'success');
    formFound.reset();
    closeModal(modalFound);
    allItems.unshift(res.data.item);
    updateStatistics();
    applyFiltersAndRender();
  } else {
    showToast(res.data.error || 'Failed to submit found item report.', 'error');
  }
}

/**
 * Handler for Edit Listing form submission
 */
async function handleEditFormSubmit(e) {
  e.preventDefault();

  const id = parseInt(document.getElementById('editItemId').value, 10);
  const nameInput = document.getElementById('editItemName');
  const typeSelect = document.getElementById('editType');
  const catSelect = document.getElementById('editCategory');
  const statusSelect = document.getElementById('editStatus');
  const locInput = document.getElementById('editLocation');
  const dateInput = document.getElementById('editDate');
  const descInput = document.getElementById('editDescription');
  const idenInput = document.getElementById('editIdentifyingDetails');
  const studentInput = document.getElementById('editStudentName');
  const contactInput = document.getElementById('editContact');

  let isValid = true;
  isValid &= validateField(nameInput, document.getElementById('err-editItemName'), 'Item name');
  isValid &= validateField(catSelect, document.getElementById('err-editCategory'), 'Category');
  isValid &= validateField(locInput, document.getElementById('err-editLocation'), 'Location');
  isValid &= validateField(dateInput, document.getElementById('err-editDate'), 'Date', validatePastOrPresentDate);
  isValid &= validateField(descInput, document.getElementById('err-editDescription'), 'Description');
  isValid &= validateField(idenInput, document.getElementById('err-editIdentifyingDetails'), 'Identifying details');
  isValid &= validateField(studentInput, document.getElementById('err-editStudentName'), 'Name');
  isValid &= validateField(contactInput, document.getElementById('err-editContact'), 'Contact info', validateContact);

  if (!isValid) return;

  const updatedData = {
    type: typeSelect.value,
    item_name: nameInput.value.trim(),
    category: catSelect.value,
    status: statusSelect.value,
    location: locInput.value.trim(),
    date: dateInput.value.trim(),
    description: descInput.value.trim(),
    identifying_details: idenInput.value.trim(),
    student_name: studentInput.value.trim(),
    contact: contactInput.value.trim()
  };

  const saveBtn = document.getElementById('saveEditBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const res = await updateItemOnServer(id, updatedData);
  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Changes';

  if (res.ok) {
    showToast('✓ Listing updated successfully!', 'success');
    closeModal(modalEdit);

    const index = allItems.findIndex(i => i.id === id);
    if (index !== -1) {
      allItems[index] = res.data.item;
    }

    if (currentDetailItem && currentDetailItem.id === id) {
      currentDetailItem = res.data.item;
      renderItemDetails(currentDetailItem);
    }

    updateStatistics();
    applyFiltersAndRender();
  } else {
    showToast(res.data.error || 'Failed to update listing.', 'error');
  }
}

// ============================================================================
// LISTING ACTIONS (RESOLVE, EDIT, DELETE)
// ============================================================================

async function markItemAsResolved(id) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;

  if (item.status === 'Resolved') {
    showToast('Item is already marked as resolved.', 'info');
    return;
  }

  const res = await resolveItemOnServer(id);
  if (res.ok) {
    showToast('✓ Item marked as resolved.', 'success');
    item.status = 'Resolved';
    updateStatistics();
    applyFiltersAndRender();

    if (currentDetailItem && currentDetailItem.id === id) {
      currentDetailItem.status = 'Resolved';
      renderItemDetails(currentDetailItem);
    }
  } else {
    showToast(res.data.error || 'Failed to resolve item.', 'error');
  }
}

async function deleteItemListing(id) {
  const confirmed = window.confirm('Are you sure you want to delete this listing?');
  if (!confirmed) return;

  const res = await deleteItemOnServer(id);
  if (res.ok) {
    showToast('🗑 Listing deleted successfully.', 'info');
    allItems = allItems.filter(i => i.id !== id);
    updateStatistics();
    applyFiltersAndRender();

    if (currentDetailItem && currentDetailItem.id === id) {
      closeModal(modalDetails);
      currentDetailItem = null;
    }
  } else {
    showToast(res.data.error || 'Unable to delete listing.', 'error');
  }
}

function handleDetailsResolve() {
  if (currentDetailItem) {
    markItemAsResolved(currentDetailItem.id);
  }
}

function handleDetailsEdit() {
  if (currentDetailItem) {
    closeModal(modalDetails);
    openEditModal(currentDetailItem);
  }
}

function handleDetailsDelete() {
  if (currentDetailItem) {
    deleteItemListing(currentDetailItem.id);
  }
}

// ============================================================================
// DYNAMIC SEARCH, FILTERING, & RENDERING
// ============================================================================

function applyFiltersAndRender() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedType = filterType.value;
  const selectedCategory = filterCategory.value;
  const selectedStatus = filterStatus.value;

  const filtered = allItems.filter(item => {
    const typeMatch = (selectedType === 'all') || (item.type && item.type.toLowerCase() === selectedType.toLowerCase());
    const catMatch = (selectedCategory === 'all') || (item.category === selectedCategory);
    const statusMatch = (selectedStatus === 'all') || (item.status === selectedStatus);

    let queryMatch = true;
    if (query) {
      const combined = [
        item.item_name || '',
        item.category || '',
        item.location || '',
        item.description || '',
        item.identifying_details || '',
        item.student_name || ''
      ].join(' ').toLowerCase();

      queryMatch = combined.includes(query);
    }

    return typeMatch && catMatch && statusMatch && queryMatch;
  });

  renderListings(filtered);
}

function renderListings(itemsToRender) {
  listingsContainer.innerHTML = '';
  resultsCount.textContent = `Showing ${itemsToRender.length} of ${allItems.length} items`;

  if (itemsToRender.length === 0) {
    listingsContainer.style.display = 'none';
    emptyState.style.display = 'block';

    if (allItems.length === 0) {
      emptyTitle.textContent = 'No listings yet';
      emptyDescription.textContent = 'Be the first person to report an item.';
    } else {
      emptyTitle.textContent = 'No matching items found';
      emptyDescription.textContent = 'Try adjusting your search keywords or clearing active filters.';
    }
    return;
  }

  listingsContainer.style.display = 'grid';
  emptyState.style.display = 'none';

  itemsToRender.forEach(item => {
    const card = document.createElement('article');
    const isResolved = item.status === 'Resolved';
    card.className = `item-card ${isResolved ? 'is-resolved' : ''}`;
    card.setAttribute('data-id', item.id);

    const isLost = item.type === 'lost';
    const typeBadgeClass = isLost ? 'badge-lost' : 'badge-found';
    const typeLabel = isLost ? '● LOST' : '● FOUND';

    const statusBadgeClass = isResolved ? 'badge-resolved' : 'badge-active';
    const statusLabel = isResolved ? '✓ RESOLVED' : '● ACTIVE';

    card.innerHTML = `
      <div>
        <div class="card-top-row">
          <div class="badge-group">
            <span class="badge ${typeBadgeClass}">${typeLabel}</span>
            <span class="badge ${statusBadgeClass}">${statusLabel}</span>
          </div>
          <span class="category-chip">${escapeHtml(item.category)}</span>
        </div>

        <h3 class="card-item-title">${escapeHtml(item.item_name)}</h3>

        <div class="card-meta-list">
          <div class="meta-item">
            <svg class="meta-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${escapeHtml(item.location)}</span>
          </div>
          <div class="meta-item">
            <svg class="meta-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${escapeHtml(item.date)}</span>
          </div>
        </div>

        <p class="card-desc-snippet">${escapeHtml(item.description)}</p>
      </div>

      <div class="card-footer-bar">
        <button type="button" class="btn btn-secondary btn-card-action btn-view-details">
          View Details
        </button>

        <div class="card-action-group">
          ${!isResolved ? `
            <button type="button" class="btn btn-success btn-card-action btn-card-resolve" title="Mark as Resolved">
              ✓ Resolve
            </button>
          ` : ''}
          <button type="button" class="btn btn-secondary btn-card-action btn-card-edit" title="Edit Listing">
            ✎
          </button>
          <button type="button" class="btn btn-danger btn-card-action btn-card-delete" title="Delete Listing">
            🗑
          </button>
        </div>
      </div>
    `;

    // Button event listeners
    card.querySelector('.btn-view-details').addEventListener('click', () => openDetailsModal(item));
    card.querySelector('.btn-card-edit').addEventListener('click', () => openEditModal(item));
    card.querySelector('.btn-card-delete').addEventListener('click', () => deleteItemListing(item.id));

    const resolveBtn = card.querySelector('.btn-card-resolve');
    if (resolveBtn) {
      resolveBtn.addEventListener('click', () => markItemAsResolved(item.id));
    }

    listingsContainer.appendChild(card);
  });
}

function updateStatistics() {
  const total = allItems.length;
  const lost = allItems.filter(i => i.type === 'lost').length;
  const found = allItems.filter(i => i.type === 'found').length;
  const resolved = allItems.filter(i => i.status === 'Resolved').length;

  statTotal.textContent = total;
  statLost.textContent = lost;
  statFound.textContent = found;
  statResolved.textContent = resolved;
}

function resetAllFilters() {
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  filterType.value = 'all';
  filterCategory.value = 'all';
  filterStatus.value = 'all';
  applyFiltersAndRender();
  showToast('Filters reset to default.', 'info');
}

// ============================================================================
// MODAL CONTROLS & POPULATION
// ============================================================================

function openModal(modalEl) {
  modalEl.classList.add('is-active');
  modalEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalEl) {
  modalEl.classList.remove('is-active');
  modalEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function openDetailsModal(item) {
  currentDetailItem = item;
  renderItemDetails(item);
  openModal(modalDetails);
}

function renderItemDetails(item) {
  const detailsBadges = document.getElementById('detailsBadges');
  const detailsTitle = document.getElementById('detailsTitle');
  const detailsBody = document.getElementById('detailsBody');
  const detailsResolveBtn = document.getElementById('detailsResolveBtn');

  const isLost = item.type === 'lost';
  const typeBadgeClass = isLost ? 'badge-lost' : 'badge-found';
  const isResolved = item.status === 'Resolved';
  const statusBadgeClass = isResolved ? 'badge-resolved' : 'badge-active';

  detailsBadges.innerHTML = `
    <span class="badge ${typeBadgeClass}">${isLost ? '● LOST ITEM' : '● FOUND ITEM'}</span>
    <span class="badge ${statusBadgeClass}">${isResolved ? '✓ RESOLVED' : '● ACTIVE'}</span>
    <span class="category-chip">${escapeHtml(item.category)}</span>
  `;

  detailsTitle.textContent = item.item_name;

  if (isResolved) {
    detailsResolveBtn.style.display = 'none';
  } else {
    detailsResolveBtn.style.display = 'inline-flex';
  }

  const roleLabel = isLost ? 'Reported By' : 'Finder Name';
  const contactHref = item.contact.includes('@') ? `mailto:${encodeURIComponent(item.contact)}` : `tel:${encodeURIComponent(item.contact)}`;

  detailsBody.innerHTML = `
    <div class="detail-row-block">
      <span class="detail-label-tag">Location</span>
      <p class="detail-value-text">📍 ${escapeHtml(item.location)}</p>
    </div>

    <div class="detail-row-block">
      <span class="detail-label-tag">Date Reported / Discovered</span>
      <p class="detail-value-text">📅 ${escapeHtml(item.date)}</p>
    </div>

    <div class="detail-row-block">
      <span class="detail-label-tag">Description</span>
      <p class="detail-value-text">${escapeHtml(item.description)}</p>
    </div>

    <div class="identifying-proof-box">
      <span class="detail-label-tag">🔑 Identifying Details &amp; Verification Proof</span>
      <p class="detail-value-text">${escapeHtml(item.identifying_details)}</p>
    </div>

    <div class="contact-card-box">
      <div class="contact-info-col">
        <span class="detail-label-tag">${roleLabel}</span>
        <span class="contact-person-name">${escapeHtml(item.student_name)}</span>
      </div>
      <div>
        <a href="${contactHref}" class="contact-direct-link" target="_blank" rel="noopener">
          ✉ / 📞 ${escapeHtml(item.contact)}
        </a>
      </div>
    </div>
  `;
}

function openEditModal(item) {
  document.getElementById('editItemId').value = item.id;
  document.getElementById('editItemName').value = item.item_name;
  document.getElementById('editType').value = item.type;
  document.getElementById('editCategory').value = item.category;
  document.getElementById('editStatus').value = item.status;
  document.getElementById('editLocation').value = item.location;
  document.getElementById('editDate').value = item.date;
  document.getElementById('editDescription').value = item.description;
  document.getElementById('editIdentifyingDetails').value = item.identifying_details;
  document.getElementById('editStudentName').value = item.student_name;
  document.getElementById('editContact').value = item.contact;

  formEdit.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  formEdit.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

  openModal(modalEdit);
}

// ============================================================================
// TOAST NOTIFICATIONS UTILITY
// ============================================================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '✓',
    error: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span>${icons[type] || 'ℹ️'}</span>
    <span>${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function escapeHtml(str) {
  if (typeof str !== 'string') return str || '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
