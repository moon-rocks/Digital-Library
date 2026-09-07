
        /*
        =========================================
        CHEAT SHEET DATA
        =========================================

        Just add a new object here whenever
        you want a new cheatsheet.
        */

        const cheatSheets = [

            {
                title: "Python CheatSheet",

                image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",

                description:
                    "Quick Python syntax and programming reference.",

                link: "cheetsheet/Python Cheatsheet.pdf",

                category: "Programming"
            },


            {
                title: "C Language CheatSheet",

                image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg",

                description:
                    "Important C syntax, functions and concepts.",

                link: "cheetsheet/C Language CheatSheet.pdf",

                category: "Programming"
            },


            {
                title: "C++ CheatSheet",

                image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",

                description:
                    "Quick reference for C++ syntax and STL.",

                link: "cheetsheet/C++ CheatSheet.pdf",

                category: "Programming"
            },


            {
                title: "Java CheatSheet",

                image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",

                description:
                    "Java syntax, OOP concepts and useful methods.",

                link: "cheetsheet/Java CheatSheet.pdf",

                category: "Programming"
            },


            {
                title: "HTML CheatSheet",

                image:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
                description:
                    "Essential HTML tags and document structure.",

                link: "cheetsheet/HTML Cheatsheet.pdf",

                category: "Web Development"
            },


            {
                title: "CSS CheatSheet",

                image:  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",

                description:
                    "CSS properties, layouts and responsive design.",

                link: "cheetsheet/CSS Cheatsheet.pdf",

                category: "Web Development"
            },


            {
                title: "Flask CheatSheet",

                image:  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg",
                description:
                    "Useful Flask commands and routing reference.",

                link: "cheetsheet/Flask CheatSheet.pdf",

                category: "Framework"
            },


            {
                title: "JavaScript CheatSheet",

                image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",

                description:
                    "JavaScript syntax, methods and DOM reference.",

                link: "cheetsheet/JavaScript CheatSheet.pdf",

                category: "Web Development"
            },


            {
                title: "PHP CheatSheet",

                image:   "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",

                description:
                    "PHP syntax, functions and common operations.",

                link: "cheetsheet/PHP CheatSheet.pdf",

                category: "Backend"
            },


            {
                title: "MySQL CheatSheet",

                image:  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",

                description:
                    "Important SQL commands and database queries.",

                link: "cheetsheet/MySQL CheatSheet.pdf",

                category: "Database"
            },


            {
                title: "Django CheatSheet",

                image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg",

                description:
                    "Django commands, models, views and URLs.",

                link: "cheetsheet/Django CheatSheet.pdf",

                category: "Framework"
            },


            {
                title: "MongoDB CheatSheet",

                image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",

                description:
                    "MongoDB commands and frequently used queries.",

                link: "cheetsheet/MongoDB CheatSheet.pdf",

                category: "Database"
            }

        ];



        /*
        =========================================
        GET CONTAINER
        =========================================
        */

        const container =
            document.getElementById("cheatsheetContainer");



        /*
        =========================================
        CREATE CARDS
        =========================================
        */

        function renderCheatSheets() {

            container.innerHTML = cheatSheets.map((sheet, index) => {

                return `

                <article
                    class="
                        card-shine
                        group
                        relative
                        overflow-hidden
                        rounded-2xl
                        border
                        border-slate-800
                        bg-slate-900/70
                        p-4
                        shadow-lg
                        shadow-black/10
                        backdrop-blur-sm

                        transition-all
                        duration-500
                        hover:-translate-y-2
                        hover:border-blue-500/40
                        hover:shadow-2xl
                        hover:shadow-blue-500/10
                    "
                >

                    <!-- Top Gradient -->
                    <div
                        class="
                            absolute
                            inset-x-0
                            top-0
                            h-1
                            bg-gradient-to-r
                            from-blue-500
                            via-cyan-400
                            to-purple-500
                            opacity-0
                            transition-opacity
                            duration-500
                            group-hover:opacity-100
                        "
                    ></div>


                    <!-- Card Header -->
                    <div
                        class="
                            relative
                            flex
                            items-center
                            justify-between
                            gap-3
                        "
                    >

                        <!-- Category -->
                        <span
                            class="
                                rounded-full
                                border
                                border-slate-700
                                bg-slate-800/80
                                px-3
                                py-1
                                text-[11px]
                                font-semibold
                                uppercase
                                tracking-wider
                                text-slate-400
                            "
                        >
                            ${sheet.category}
                        </span>


                        <!-- Number -->
                        <span
                            class="
                                text-xs
                                font-semibold
                                text-slate-600
                            "
                        >
                            ${(index + 1)
                                .toString()
                                .padStart(2, "0")}
                        </span>

                    </div>



                    <!-- Image Area -->
                    <div
                        class="
                            relative
                            mt-4
                            flex
                            h-44
                            items-center
                            justify-center
                            overflow-hidden
                            rounded-xl
                            bg-gradient-to-br
                            from-slate-800
                            to-slate-950
                        "
                    >

                        <!-- Glow -->
                        <div
                            class="
                                absolute
                                h-28
                                w-28
                                rounded-full
                                bg-blue-500/10
                                blur-2xl
                                transition-all
                                duration-500
                                group-hover:bg-blue-500/20
                                group-hover:scale-150
                            "
                        ></div>


                        <!-- Image -->
                        <img
                            src="${sheet.image}"
                            alt="${sheet.title}"
                            loading="lazy"

                            class="
                                relative
                                z-10
                                h-28
                                w-28
                                object-contain

                                drop-shadow-2xl

                                transition-all
                                duration-500

                                group-hover:scale-110
                                group-hover:-rotate-2
                            "

                            onerror="
                                this.src =
                                'https://placehold.co/200x200/111827/ffffff?text=PDF'
                            "
                        >

                    </div>



                    <!-- Card Content -->
                    <div class="relative pt-5">


                        <!-- Title -->
                        <h3
                            class="
                                text-lg
                                font-bold
                                text-white
                                transition-colors
                                duration-300
                                group-hover:text-blue-400
                            "
                        >
                            ${sheet.title}
                        </h3>


                        <!-- Description -->
                        <p
                            class="
                                mt-2
                                min-h-[48px]
                                text-sm
                                leading-6
                                text-slate-400
                            "
                        >
                            ${sheet.description}
                        </p>



                        <!-- Download Button -->
                        <a
                            href="${sheet.link}"
                            target="_blank"
                            rel="noopener noreferrer"

                            class="
                                mt-5
                                flex
                                w-full
                                items-center
                                justify-center
                                gap-2
                                rounded-xl

                                border
                                border-slate-700

                                bg-slate-800
                                px-4
                                py-3

                                text-sm
                                font-semibold
                                text-white

                                transition-all
                                duration-300

                                hover:border-blue-500
                                hover:bg-blue-600
                                hover:shadow-lg
                                hover:shadow-blue-500/20
                            "
                        >

                            <!-- Download Icon -->
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="2"
                                stroke="currentColor"
                                class="
                                    h-4
                                    w-4
                                    transition-transform
                                    duration-300
                                    group-hover:translate-y-0.5
                                "
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12M12 16.5V3"
                                />
                            </svg>


                            Download Cheatsheet

                        </a>

                    </div>

                </article>

                `;

            }).join("");

        }



        /*
        =========================================
        INITIAL RENDER
        =========================================
        */

        renderCheatSheets();


