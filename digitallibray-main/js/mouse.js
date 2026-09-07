let cursor = document.querySelector("#cursor");
window.addEventListener("mousemove",function(dets){
  gsap.to("#cursor",{
    x:dets.clientX,
    y:dets.clientY,
    ease:"power2",
  })
})
