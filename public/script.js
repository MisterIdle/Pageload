const productsList = document.getElementById('products');
const loadingIndicator = document.getElementById('loading');
const paginationContainers = document.querySelectorAll('.pagination');
const errorContainer = document.getElementById('error');
const urlParams = new URLSearchParams(window.location.search);

let page = parseInt(urlParams.get('page')) || 1;
let totalProducts = 0;
let totalPages = 0;
let currentLoadZone = 1;
let isLoading = false;

const maxLoadCardPerLoad = 20;
const maxLoadCardPerPage = 100;

async function fetchProducts(startId, endId) {
    try {
        const response = await fetch(`http://localhost:3000/get-product?startId=${startId}&endId=${endId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

function renderLoadingIndicator() {
    loadingIndicator.style.display = 'block';
}

function hideLoadingIndicator() {
    loadingIndicator.style.display = 'none';
}

function updatePageUrl() {
    window.history.pushState({}, '', `?page=${page}`);
}

function scrollToTop() {
    window.scrollTo(0, 0);
}

function createProductCard(product, delayCounter) {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product-card');
    productDiv.innerHTML = `
        <div class="product-image">
            <img src="${product.image_url}" alt="${product.name}" />
        </div>
        <div class="product-info">
            <h2 class="product-name">${product.name}</h2>
            <p class="product-description">${product.description}</p>
            <div class="product-price-rating">
                <span class="product-price">$${product.price}</span>
                <span class="product-rating"><i class="fas fa-star"></i> ${product.rating}</span>
            </div>
            <button class="add-to-cart">Add to Cart</button>
        </div>
    `;
    productsList.appendChild(productDiv);
    animateProductCard(productDiv, delayCounter);
}

function animateProductCard(productDiv, delayCounter) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delayCounter);
                delayCounter += 70;
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    observer.observe(productDiv);
}

async function renderProducts() {
    if (isLoading) return;
    isLoading = true;
    renderLoadingIndicator();

    const startId = (currentLoadZone - 1) * maxLoadCardPerLoad + 1 + (page - 1) * maxLoadCardPerPage;
    const endId = currentLoadZone * maxLoadCardPerLoad + (page - 1) * maxLoadCardPerPage;
    const maxLoadCardPerPagePlusPage = maxLoadCardPerPage * page;

    if (startId > maxLoadCardPerPagePlusPage) {
        isLoading = false;
        hideLoadingIndicator();
        renderPagination();
        return;
    }

    console.log('startId:', startId, 'endId:', endId);
    const response = await fetchProducts(startId, endId);

    if (!response || !response.products || response.products.length === 0) {
        handleNoProducts();
        return;
    }

    totalProducts = response.totalProducts;
    totalPages = Math.ceil(totalProducts / maxLoadCardPerPage);
    const products = response.products;

    let delayCounter = 0;

    products.forEach(product => createProductCard(product, delayCounter));

    hideLoadingIndicator();
    isLoading = false;
    renderPagination();
}

function handleNoProducts() {
    isLoading = false;
    if (page > totalPages) {
        page = 1;
        updatePage();
    }
}

function renderPagination() {
    const pagination = document.createElement('div');
    pagination.classList.add('pagination');

    const { startPage, endPage } = getPaginationRange();

    pagination.innerHTML = `
        <button onclick="page = 1; updatePage();" ${page === 1 ? 'disabled' : ''}>First</button>
        <button onclick="page = Math.max(1, page - 1); updatePage();" ${page === 1 ? 'disabled' : ''}>Previous</button>
        ${createPageLinks(startPage, endPage)}
        <button onclick="page = Math.min(totalPages, page + 1); updatePage();" ${page === totalPages ? 'disabled' : ''}>Next</button>
        <button onclick="page = totalPages; updatePage();" ${page === totalPages ? 'disabled' : ''}>Last</button>
    `;

    // A FIX LA PAGINATION
    paginationContainers.forEach(container => {
        container.innerHTML = '';
        container.appendChild(pagination);
    });
}

function createPageLinks(startPage, endPage) {
    let links = '';
    for (let i = startPage; i <= endPage; i++) {
        links += `
            <button 
                class="page-link ${i === page ? 'active' : ''}" 
                onclick="page = ${i}; updatePage();">
                ${i}
            </button>
        `;
    }
    return links;
}


function getPaginationRange() {
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);

    if (page <= 2) {
        startPage = 1;
        endPage = Math.min(5, totalPages);
    }

    if (page >= totalPages - 1) {
        endPage = totalPages;
        startPage = Math.max(1, totalPages - 4);
    }

    return { startPage, endPage };
}

function createPageLinks(startPage, endPage) {
    let pageLinks = '';
    for (let i = startPage; i <= endPage; i++) {
        pageLinks += `
            <button onclick="page = ${i}; updatePage();" class="${i === page ? 'active' : ''}">
                ${i}
            </button>
        `;
    }
    return pageLinks;
}

function updatePage() {
    updatePageUrl();
    scrollToTop();
    renderProducts();
    window.location.reload();
}

function checkScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        currentLoadZone++;
        renderProducts();
    }
}

function createFooter() {
    const footer = document.createElement('footer');
    footer.innerHTML = `
        <p>&copy; 2021 Fake Store, Inc.</p>
    `;
    document.body.appendChild(footer);
}

window.addEventListener('scroll', checkScroll);

renderProducts();
