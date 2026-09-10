const grid = document.querySelector('#catalog-grid');
const search = document.querySelector('#catalog-search');
const collection = document.querySelector('#catalog-collection');
const status = document.querySelector('#catalog-status');
const loadButton = document.querySelector('#catalog-load');
const catalogLightbox = document.querySelector('.image-lightbox');
const catalogLightboxImage = catalogLightbox?.querySelector('img');
const catalogLightboxCaption = catalogLightbox?.querySelector('p');
const orderLink = catalogLightbox?.querySelector('.lightbox-order');

const PAGE_SIZE = 48;
let allItems = [];
let filteredItems = [];
let visibleCount = PAGE_SIZE;

function normalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
}

function render() {
  const visible = filteredItems.slice(0, visibleCount);
  grid.innerHTML = visible.map((item) => `
    <figure class="catalog-item">
      <button class="catalog-image-button" type="button" data-id="${item.id}" aria-label="Ampliar ${escapeHtml(item.colecao)} — ${escapeHtml(item.titulo)}">
        <img src="${item.src}" alt="Arte ${escapeHtml(item.titulo)}, coleção ${escapeHtml(item.colecao)}" width="720" height="520" loading="lazy">
      </button>
      <figcaption><strong>${escapeHtml(item.colecao)}</strong><span>${escapeHtml(item.titulo)}</span></figcaption>
    </figure>
  `).join('');
  status.textContent = `${filteredItems.length.toLocaleString('pt-BR')} imagens encontradas — exibindo ${visible.length.toLocaleString('pt-BR')}`;
  loadButton.hidden = visible.length >= filteredItems.length;
}

function filterCatalog() {
  const term = normalize(search.value.trim());
  const selectedCollection = collection.value;
  filteredItems = allItems.filter((item) => {
    const matchesTerm = !term || normalize(`${item.titulo} ${item.colecao}`).includes(term);
    const matchesCollection = !selectedCollection || item.colecao === selectedCollection;
    return matchesTerm && matchesCollection;
  });
  visibleCount = PAGE_SIZE;
  render();
}

fetch('catalogo.json')
  .then((response) => {
    if (!response.ok) throw new Error('Não foi possível carregar o catálogo.');
    return response.json();
  })
  .then((items) => {
    allItems = items;
    filteredItems = items;
    [...new Set(items.map((item) => item.colecao))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .forEach((name) => collection.add(new Option(name, name)));
    render();
  })
  .catch(() => {
    status.textContent = 'Não foi possível carregar o catálogo. Tente novamente em instantes.';
  });

search.addEventListener('input', filterCatalog);
collection.addEventListener('change', filterCatalog);
loadButton.addEventListener('click', () => {
  visibleCount += PAGE_SIZE;
  render();
});

grid.addEventListener('click', (event) => {
  const trigger = event.target.closest('.catalog-image-button');
  if (!trigger || !catalogLightbox || !catalogLightboxImage) return;
  const item = allItems.find((candidate) => String(candidate.id) === trigger.dataset.id);
  if (!item) return;
  catalogLightboxImage.src = item.src;
  catalogLightboxImage.alt = `Arte ${item.titulo}, coleção ${item.colecao}`;
  catalogLightboxCaption.textContent = `${item.colecao} — ${item.titulo}`;
  if (orderLink) {
    const message = `Olá, World Arte! Gostei da arte ${item.id} — ${item.colecao} / ${item.titulo}. Quero um orçamento.`;
    orderLink.href = `https://wa.me/5584999131802?text=${encodeURIComponent(message)}`;
  }
  catalogLightbox.showModal();
});
