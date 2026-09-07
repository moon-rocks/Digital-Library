const newsletters = [
  {
    image: "./images/image (5).jpg",
    title: "LazyLearn: A Smart Gamified Learning and Productivity Application",
    pdf: "Publication/A smart Gamified Learning and Productivity Application.pdf",
  },
  {
    image: "images/Screenshot 2026-09-04 143525_page-0001.jpg",
    title:
      "MealMend: A Web-Based Platform for Surplus Food Redistribution and Sustainable Food Waste Management",
    pdf: "Publication/A Web-Based Platform for Surplus  Food Redistribution and Sustainable Food Waste  Management .pdf",
  },
];

// Container
const newsletterContainer =
  document.getElementById("publicationGrid") ||
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
                    object-contain
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

                Read Publication

            </a>

        </div>

    `;

  newsletterContainer.appendChild(card);
});
