(function () {
  // 1) Geeft een paar parameters van de ADRES-balk van de hostpagina door aan de
  //    iframe, zodat een link als
  //      https://www.jouwsite.nl/offerte-aanvragen/?template=sloepengame
  //    direct die offerte opent (diepe link vanaf een knop op je eigen site).
  //    Alleen deze vaste lijst wordt doorgegeven, nooit zomaar alles.
  var FORWARD = ["template", "arrangement"];
  try {
    var hostParams = new URLSearchParams(window.location.search);
    var iframes = document.querySelectorAll('iframe[src*="/embed/"]');
    for (var i = 0; i < iframes.length; i++) {
      var url = new URL(iframes[i].src, window.location.href);
      var changed = false;
      for (var k = 0; k < FORWARD.length; k++) {
        var value = hostParams.get(FORWARD[k]);
        if (value && url.searchParams.get(FORWARD[k]) !== value) {
          url.searchParams.set(FORWARD[k], value);
          changed = true;
        }
      }
      if (changed) iframes[i].src = url.toString();
    }
  } catch (e) {
    // Oude browser zonder URL/URLSearchParams: embed werkt dan gewoon zonder diepe link.
  }

  // 2) Vangt de hoogte-berichtjes op van elke Kwotio-aanvraagwidget-iframe op
  //    deze pagina (zie de postMessage in PublicOrgPageView, embed=true) en
  //    zet de bijbehorende iframe-hoogte gelijk aan de werkelijke inhoud --
  //    zonder dit blijft een iframe altijd op zijn opgegeven (of standaard
  //    150px) hoogte staan, met een scrollbalkje of afgesneden inhoud tot gevolg.
  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "kwotio-embed-resize") return;
    var frames = document.querySelectorAll('iframe[src*="/embed/"]');
    for (var j = 0; j < frames.length; j++) {
      if (frames[j].contentWindow === event.source) {
        frames[j].style.height = event.data.height + "px";
        break;
      }
    }
  });
})();
