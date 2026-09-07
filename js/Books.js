if (!window.digitalLibraryPublic) {
  document.write('<script src="js/public-supabase.js"><\/script>');
}

// --- Data Source ---
let books = [
  {
    id: 1,
    title: "Engineering Mathematics I",
    author: "Dr. B.S. Grewal",
    semester: 1,
    subject: "Math",
    link: "#",
    color: "from-red-500 to-orange-500",
  },

  {
    id: 2,
    title: "Let us C",
    author: "Yashavant P. Kanetkar",
    semester: 1,
    subject: "Programming with C",
    link: "https://pdvpmtasgaon.edu.in/uploads/dptcomputer/Let%20us%20c%20-%20yashwantkanetkar.pdf",
    color: "from-blue-500 to-cyan-500",
  },

  {
    id: 3,
    title: "Computer Fundamentals",
    author: "Pradeep K. Sinha",
    semester: 1,
    subject: "CS",
    link: "#",
    color: "from-purple-500 to-pink-500",
  },

  {
    id: 4,
    title: "Engineering Physics",
    author: "R.K. Gaur",
    semester: 1,
    subject: "Physics",
    link: "#",
    color: "from-green-500 to-teal-500",
  },

  {
    id: 5,
    title: "Operating System Concepts",
    author: "Silberschatz, Galvin, Gagne",
    semester: 2,
    subject: "Operating Systems",
    link: "https://www.mbit.edu.in/wp-content/uploads/2020/05/Operating_System_Concepts_8th_EditionA4.pdf",
    color: "from-red-500 to-orange-500",
  },

  {
    id: 6,
    title: "Programming in C",
    author: "E. Balagurusamy",
    semester: 2,
    subject: "Programming",
    link: "#",
    color: "from-gray-700 to-gray-900",
  },

  {
    id: 7,
    title: "Digital Electronics",
    author: "Morris Mano",
    semester: 3,
    subject: "Electronics",
    link: "#",
    color: "from-indigo-500 to-blue-600",
  },
  {
    id: 8,
    title: "Data Structures",
    author: "Seymour Lipschutz",
    semester: 3,
    subject: "CS",
    link: "#",
    color: "from-yellow-500 to-amber-600",
  },

  {
    id: 9,
    title: "Object Oriented Programming",
    author: "E. Balagurusamy",
    semester: 3,
    subject: "Programming",
    link: "#",
    color: "from-blue-400 to-blue-600",
  },

  {
    id: 10,
    title: "Operating Systems",
    author: "Galvin",
    semester: 4,
    subject: "CS",
    link: "#",
    color: "from-slate-600 to-slate-800",
  },

  {
    id: 11,
    title: "Database Management",
    author: "Raghu Ramakrishnan",
    semester: 4,
    subject: "CS",
    link: "#",
    color: "from-emerald-500 to-green-600",
  },

  {
    id: 12,
    title: "Computer Networks",
    author: "Andrew S. Tanenbaum",
    semester: 5,
    subject: "Networking",
    link: "#",
    color: "from-cyan-500 to-blue-500",
  },

  {
    id: 13,
    title: "Java Programming",
    author: "Herbert Schildt",
    semester: 5,
    subject: "Programming",
    link: "#",
    color: "from-orange-500 to-red-500",
  },

  {
    id: 14,
    title: "Software Engineering",
    author: "Pressman",
    semester: 5,
    subject: "SE",
    link: "#",
    color: "from-purple-600 to-indigo-700",
  },

  {
    id: 15,
    title: "Cryptography & Security",
    author: "William Stallings",
    semester: 6,
    subject: "Security",
    link: "#",
    color: "from-pink-500 to-rose-600",
  },

  {
    id: 16,
    title: "Cloud Computing",
    author: "Kai Hwang",
    semester: 6,
    subject: "Advanced CS",
    link: "#",
    color: "from-sky-400 to-indigo-500",
  },

  {
    id: 17,
    title: "Web Technologies",
    author: "Martin Bates",
    semester: 6,
    subject: "Web",
    link: "#",
    color: "from-teal-400 to-green-500",
  },
];

// --- State ---
let currentSemester = "all";
let searchQuery = "";

// --- DOM Elements ---
const bookGrid = document.getElementById("bookGrid");
const searchInput = document.getElementById("heroSearch");
const filterBtns = document.querySelectorAll(".filter-btn");
const noResults = document.getElementById("noResults");

// --- Render Function ---
function renderBooks() {
  // Clear grid
  bookGrid.innerHTML = "";

  // Filter Data
  const filteredBooks = books.filter((book) => {
    const matchesSem =
      currentSemester === "all" || book.semester.toString() === currentSemester;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      book.title.toLowerCase().includes(searchLower) ||
      book.author.toLowerCase().includes(searchLower) ||
      book.subject.toLowerCase().includes(searchLower);
    return matchesSem && matchesSearch;
  });

  // Handle No Results
  if (filteredBooks.length === 0) {
    noResults.classList.remove("hidden");
  } else {
    noResults.classList.add("hidden");

    // Generate Cards
    filteredBooks.forEach((book) => {
      const card = document.createElement("div");
      card.className =
        "book-card group bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-700 hover:border-brand-accent/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col h-full opacity-0 translate-y-4"; // Start hidden for GSAP
      card.innerHTML = `
                        <div class="h-32 bg-gradient-to-r ${book.color} relative p-6 flex items-end">
                            <div class="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
                                Sem ${book.semester}
                            </div>
                            <i class="fa-solid fa-book text-white/20 text-6xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-500"></i>
                            <h3 class="relative z-10 text-xl font-bold text-white leading-tight w-3/4">${book.title}</h3>
                        </div>
                        <div class="p-6 flex-1 flex flex-col">
                            <p class="text-brand-accent text-sm font-semibold mb-1">${book.subject}</p>
                            <p class="text-gray-400 text-sm mb-6">by ${book.author}</p>
                            
                            <div class="mt-auto flex items-center justify-between border-t border-gray-700 pt-4">
                                <span class="text-gray-500 text-xs uppercase tracking-wider">PDF Resource</span>
                                <a href="${book.link}" onclick="showToast('Opening download link...')" class="text-gray-300 hover:text-white transition-colors">
                                    <div class="w-10 h-10 rounded-full bg-gray-700 hover:bg-brand-accent hover:text-brand-dark flex items-center justify-center transition-all">
                                        <i class="fa-solid fa-download"></i>
                                    </div>
                                </a>
                            </div>
                        </div>
                    `;
      bookGrid.appendChild(card);
    });

    // GSAP Stagger Animation for Cards
    gsap.to(".book-card", {
      y: 0,
      opacity: 1,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out",
    });
  }
}

// --- Event Listeners ---

// Search Input
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderBooks();
});

// Keyboard Shortcut for Search (Ctrl+K)
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    searchInput.focus();
  }
});

// Semester Filters
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Update UI classes
    filterBtns.forEach((b) => {
      b.classList.remove("bg-brand-accent", "text-brand-dark", "active");
      b.classList.add("text-gray-400", "hover:text-white");
    });
    btn.classList.remove("text-gray-400", "hover:text-white");
    btn.classList.add("bg-brand-accent", "text-brand-dark", "active");

    // Update Logic
    currentSemester = btn.getAttribute("data-sem");

    // Animation out before re-rendering
    gsap.to(".book-card", {
      y: 20,
      opacity: 0,
      duration: 0.3,
      onComplete: renderBooks,
    });
  });
});

// --- Modal Logic ---
function toggleUploadModal() {
  const modal = document.getElementById("uploadModal");
  const content = document.getElementById("modalContent");

  if (modal.classList.contains("hidden")) {
    modal.classList.remove("hidden");
    // Animate In
    setTimeout(() => {
      content.classList.remove("scale-95", "opacity-0");
      content.classList.add("scale-100", "opacity-100");
    }, 10);
  } else {
    // Animate Out
    content.classList.remove("scale-100", "opacity-100");
    content.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 300);
  }
}

function handleUpload(e) {
  e.preventDefault();
  toggleUploadModal();
  showToast("Book link uploaded successfully!");
  // In a real app, you would send data to backend here
}

// --- Toast Notification ---
function showToast(message) {
  const toast = document.getElementById("toast");
  const msgSpan = document.getElementById("toastMessage");

  msgSpan.innerText = message;
  toast.classList.remove("translate-y-24");

  setTimeout(() => {
    toast.classList.add("translate-y-24");
  }, 3000);
}

// --- Initial Animations on Load ---
window.addEventListener("load", async () => {
  // Hero Content Entrance
  const tl = gsap.timeline();

  tl.from(".hero-content > div", {
    y: -20,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
  })
    .from(
      ".hero-content h1",
      { y: 50, opacity: 0, duration: 1, ease: "power3.out" },
      "-=0.4",
    )
    .from(
      ".hero-content p",
      { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" },
      "-=0.6",
    );

  if (window.digitalLibraryPublic?.configured) {
    try {
      const published = await window.digitalLibraryPublic.fetchResources("Book");
      const existingBookTitles = new Set(books.map((book) => book.title.toLowerCase()));
      const supabaseBooks = (published || []).filter(
        (resource) => !existingBookTitles.has(String(resource.title || "").toLowerCase()),
      ).map((resource) => ({
        id: resource.id,
        title: resource.title,
        author: resource.branch || "Digital Library",
        semester: resource.semester || 1,
        subject: resource.subject || resource.resource_type,
        link: window.digitalLibraryPublic.fileUrl(resource) || "#",
        color: "from-blue-500 to-cyan-500",
      }));
      books = books.concat(supabaseBooks);
      console.log("Fetched published books:", published);
    } catch (error) {
      console.error("RESOURCE FETCH ERROR:", error);
    }
  }

  // Initial Render
  renderBooks();
});
