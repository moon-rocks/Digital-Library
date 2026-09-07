
let main = document.querySelector("#main");






function hoverAnimation() {

document.addEventListener('DOMContentLoaded', function () {
  var cards = document.querySelectorAll('#testimonials .test-card');

  cards.forEach(function (card) {
    card.setAttribute('tabindex', '0');

    card.addEventListener('click', function (e) {
      // If the device has real hover (mouse), let CSS :hover handle it, do nothing here
      if (window.matchMedia('(hover: hover)').matches) return;

      var isOpen = card.classList.contains('slide-open');

      // close any other open card first
      cards.forEach(function (c) {
        if (c !== card) c.classList.remove('slide-open');
      });

      card.classList.toggle('slide-open', !isOpen);
    });
  });

  // tapping anywhere outside a card closes it
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#testimonials .test-card')) {
      cards.forEach(function (c) { c.classList.remove('slide-open'); });
    }
  });
});
}
hoverAnimation();