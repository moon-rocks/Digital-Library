const newsletters = [
  {
    image: "./images/image!2024.jpg",
    title: "Newsletter Jan–June 2024 (Vol I)",
    pdf: "./newsletter/Newsletter-jan-june-2024-1.pdf",
  },
  {
    image: "./images/image vol2 july -dec.jpg",
    title: "Newsletter July–December 2024 (Vol II)",
    pdf: "./newsletter/Newsletter-July-Dec-2024-1_compressed.pdf",
  },
  {
    image: "./images/image (2).jpg",
    title: "Newsletter Jan–June 2025 (Vol I)",
    pdf: "./newsletter/BYTEBUZZ-jan-jun-2025-newsletter-3_compressed_compressed.pdf",
  },

  {
    image: "./images/image (3).jpg",
    title: "Newsletter July–December 2025 (Vol II)",
    pdf: "./newsletter/NewsLetter-July-dec-2025-1_compressed.pdf",
  },
  {
    image: "./images//image (4).jpg",
    title: "Newsletter Jan–June 2026 (Vol I)",
    pdf: "./newsletter/ByteBuzz-—-Jan–June-2026-1_compressed.pdf",
  },
];

// Container
const newsletterContainer =
  document.getElementById("newsletterGrid") ||
  document.getElementById("newsletter-container");

// Create cards
newsletters.forEach((newsletter) => {
  const card = document.createElement("div");

  card.className = `
        bg-white
        rounded-2xl
        overflow-hidden
        shadow-xl
        hover:shadow-2xl
        hover:-translate-y-2
        transition-all
        duration-300
        group
    `;

  card.innerHTML = `

        <!-- Newsletter Cover -->
        <a
            href="${newsletter.pdf}"
            target="_blank"
            rel="noopener noreferrer"
            class="block overflow-hidden"
        >

            <img
                src="${newsletter.image}"
                alt="${newsletter.title}"
                class="
                    w-full
                    h-[380px]
                    object-cover
                    group-hover:scale-105
                    transition-transform
                    duration-500
                "
            >

        </a>


        <!-- Content -->
        <div class="p-5 text-center">

            <h3 class="
                text-xl
                font-bold
                text-gray-900
            ">
                ${newsletter.title}
            </h3>


            <!-- Read Button -->
            <a
                href="${newsletter.pdf}"
                target="_blank"
                rel="noopener noreferrer"
                class="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    mt-5
                    w-full
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    py-3
                    px-5
                    rounded-xl
                    font-semibold
                    transition
                "
            >

                <i class="fa-solid fa-newspaper"></i>

                Read Newsletter

            </a>

        </div>

    `;

  newsletterContainer.appendChild(card);
});
