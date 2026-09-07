 window.addEventListener("load", () => {

            const tl = gsap.timeline();

            // Animate Loader Text
            tl.from(".loader-text", {
                y: 80,
                opacity: 0,
                duration: 1,
                ease: "power4.out"
            })

                // Wait
                .to({}, {
                    duration: 0.4
                })

                // Loader Slide Up
                .to("#loader", {
                    y: "-100%",
                    duration: 1,
                    ease: "power4.inOut"
                })

                // Remove Loader
                .set("#loader", {
                    display: "none"
                })

                // Allow Scroll
                .set("body", {
                    overflow: "auto"
                })

                // Show Main
                .to("#main", {
                    opacity: 1,
                    duration: 0.1
                })

                // Hero Animation
                .from(".hero-title", {
                    y: 100,
                    opacity: 0,
                    duration: 1,
                    ease: "power4.out"
                })

                .from(".hero-text", {
                    y: 40,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.out"
                }, "-=0.6");

        });