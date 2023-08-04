import axios from "axios";
import Notiflix from "notiflix";
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

const API_KEY = "38641047-7cc1798020b4db089cf476583";
const BASE_URL = "https://pixabay.com/api/";
const ITEMS_PER_PAGE = 40;

const searchForm = document.getElementById("search-form");
const gallery = document.querySelector(".gallery");
const loadMoreBtn = document.querySelector(".load-more");

let currentPage = 1;
let currentQuery = "";
let isLoading = false;

const lightbox = new SimpleLightbox(".gallery a", {
  captions: true,
  captionsData: "alt",
  captionDelay: 250,
});

searchForm.addEventListener("submit", handleSearch);
loadMoreBtn.addEventListener("click", handleLoadMore);

async function handleSearch(e) {
  e.preventDefault();
  const searchQuery = e.target.elements.searchQuery.value.trim();
  if (!searchQuery) return;

  currentQuery = searchQuery;
  currentPage = 1;
  gallery.innerHTML = "";
  loadMoreBtn.style.display = "none";

  try {
    isLoading = true;
    const images = await fetchImages(searchQuery, currentPage);

    if (images.hits.length > 0) {
      renderImages(images);
      Notiflix.Notify.success(`Hooray! We found ${images.totalHits} images.`);
      if (images.totalHits > ITEMS_PER_PAGE) {
        loadMoreBtn.style.display = "block";
      }
    } else {
      Notiflix.Notify.failure("Sorry, there are no images matching your search query. Please try again.");
    }
  } catch (error) {
    console.error("Error fetching images:", error);
    Notiflix.Notify.failure("Failed to fetch images. Please try again later.");
  } finally {
    isLoading = false;
  }
}

async function handleLoadMore() {
  if (isLoading) return;

  try {
    isLoading = true;
    currentPage += 1;
    const images = await fetchImages(currentQuery, currentPage);
    renderImages(images);
    scrollToNextGroup();
  } catch (error) {
    console.error("Error fetching more images:", error);
    Notiflix.Notify.failure("Failed to load more images. Please try again later.");
  } finally {
    isLoading = false;
  }
}

async function fetchImages(searchQuery, page) {
  const response = await axios.get(BASE_URL, {
    params: {
      key: API_KEY,
      q: searchQuery,
      image_type: "photo",
      orientation: "horizontal",
      safesearch: true,
      page,
      per_page: ITEMS_PER_PAGE,
    },
  });

  return response.data;
}

function renderImages(images) {
  if (images.totalHits === 0) {
    Notiflix.Notify.failure("Sorry, there are no images matching your search query. Please try again.");
    return;
  }

  images.hits.forEach((image) => {
    const card = createImageCard(image);
    const link = document.createElement("a");
    link.href = image.largeImageURL;
    link.appendChild(card);
    gallery.appendChild(link);
  });

  if (gallery.children.length >= images.totalHits) {
    loadMoreBtn.style.display = "none";
    Notiflix.Notify.info("We're sorry, but you've reached the end of search results.");
  } else {
    loadMoreBtn.style.display = "block";
  }
  lightbox.refresh();
}

function createImageCard(image) {
  const card = document.createElement("div");
  card.classList.add("photo-card");

  const img = document.createElement("img");
  img.classList.add("image");
  img.src = image.webformatURL;
  img.alt = image.tags;
  img.loading = "lazy";

  card.appendChild(img);

  const infoDiv = document.createElement("div");
  infoDiv.classList.add("info");

  ["Likes", "Views", "Comments", "Downloads"].forEach((item) => {
    const p = document.createElement("p");
    p.classList.add("info-item");
    p.innerHTML = `<b>${item}</b>: ${image[item.toLowerCase()]}`;
    infoDiv.appendChild(p);
  });

  card.appendChild(infoDiv);

  return card;
}

function scrollToNextGroup() {
  const { height: cardHeight } = gallery.firstElementChild.getBoundingClientRect();
  window.scrollBy({
    top: cardHeight * 2,
    behavior: "smooth",
  });
}

