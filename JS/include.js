document.addEventListener("DOMContentLoaded", () => {
  // Check if we are inside the HTML/ folder or at the root
  const isInHtmlFolder = window.location.pathname.includes("/HTML/");
  const headerPath = isInHtmlFolder ? "header.html" : "./HTML/header.html";

  fetch(headerPath)
    .then((response) => response.text())
    .then((data) => {
      const headerDiv = document.getElementById("header");
      headerDiv.innerHTML = data;

      // Fix paths for images and links if we are at the root
      if (!isInHtmlFolder) {
        const images = headerDiv.querySelectorAll('img[src^="../"]');
        images.forEach((img) => {
          img.src = img.getAttribute("src").replace("../", "./");
        });

        const links = headerDiv.querySelectorAll('a[href^="../"]');
        links.forEach((link) => {
          link.href = link.getAttribute("href").replace("../", "./");
        });
      }
    })
    .catch((error) => console.error("Error loading header:", error));
});
