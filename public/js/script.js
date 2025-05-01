// Bootstrap form validation (as is)
(() => {
  'use strict'
  const forms = document.querySelectorAll('.needs-validation')
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }
      form.classList.add('was-validated')
    }, false)
  })
})();

// --- Airbnb Searchbar Autocomplete & Price Range ---

const searchInput = document.getElementById('searchInput');
const autocompleteBox = document.getElementById('autocompleteResults');
const priceRange = document.getElementById('priceRange');
const priceVal = document.getElementById('priceVal');

if (priceRange && priceVal) {
  priceRange.addEventListener('input', function() {
    priceVal.textContent = `₹${this.value}`;
  });
}

if (searchInput && autocompleteBox) {
  let currentFocus = -1;

  searchInput.addEventListener('input', function() {
    const val = this.value;
    if (!val) {
      autocompleteBox.innerHTML = '';
      return;
    }
    fetch(`/suggest?q=${encodeURIComponent(val)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.length) {
          autocompleteBox.innerHTML = '<li class="text-muted px-3 py-2">No suggestions</li>';
          return;
        }
        autocompleteBox.innerHTML = data.map((item, idx) =>
          `<li tabindex="0" data-idx="${idx}" class="autocomplete-item">${item}</li>`
        ).join('');
        currentFocus = -1;

        // Add click event for each suggestion
        Array.from(autocompleteBox.children).forEach(li => {
          li.addEventListener('mousedown', function(e) {
            searchInput.value = this.textContent;
            autocompleteBox.innerHTML = '';
            document.getElementById('searchForm').submit();
          });
        });
      });
  });

  // Keyboard navigation for suggestions
  searchInput.addEventListener('keydown', function(e) {
    let items = autocompleteBox.querySelectorAll('.autocomplete-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      currentFocus++;
      if (currentFocus >= items.length) currentFocus = 0;
      setActive(items, currentFocus);
    } else if (e.key === 'ArrowUp') {
      currentFocus--;
      if (currentFocus < 0) currentFocus = items.length - 1;
      setActive(items, currentFocus);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentFocus > -1) {
        items[currentFocus].dispatchEvent(new Event('mousedown'));
      }
    }
  });

  function setActive(items, idx) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === idx);
      if (i === idx) item.scrollIntoView({ block: 'nearest' });
    });
  }

  // Hide dropdown on blur (with delay for click)
  searchInput.addEventListener('blur', () => {
    setTimeout(() => autocompleteBox.innerHTML = '', 150);
  });
}

