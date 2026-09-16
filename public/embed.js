(function () {
  // Vangt de hoogte-berichtjes op van elke Kwotio-aanvraagwidget-iframe op
  // deze pagina (zie de postMessage in PublicOrgPageView, embed=true) en
  // zet de bijbehorende iframe-hoogte gelijk aan de werkelijke inhoud --
  // zonder dit blijft een iframe altijd op zijn opgegeven (of standaard
  // 150px) hoogte staan, met een scrollbalkje of afgesneden inhoud tot gevolg.
  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "kwotio-embed-resize") return;
    var iframes = document.querySelectorAll('iframe[src*="/embed/"]');
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow === event.source) {
        iframes[i].style.height = event.data.height + "px";
        break;
      }
    }
  });
})();
