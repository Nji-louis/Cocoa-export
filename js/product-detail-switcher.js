(function () {
  "use strict";

  var products = {
    forastero: {
      key: "forastero",
      pageTitle: "Forastero Cocoa Product Detail",
      image: "img/For5.jpg",
      imageAlt: "Forastero cocoa beans from Cameroon",
      title: "Premium Forastero Cocoa Beans from Cameroon",
      intro:
        "CHOCOCAM S.A.R.L supplies Forastero cocoa from trusted Cameroonian cooperatives, known for strong cocoa body and reliable industrial use.",
      spec1:
        "Export lots are fermented, dried, and sorted to consistent standards for blends and bulk programs.",
      spec2:
        "Pre-shipment controls cover moisture, cut test, bean count, and foreign matter, with complete export documentation.",
      spec3:
        "Stable farmer partnerships support dependable volumes shipped through Douala and Kribi with traceable lot IDs.",
      specTitle: "Premium Forastero Cocoa Beans - Export Specifications",
      varietySpec: "Forastero (export-grade lots)",
      flavorSpec: "Deep cocoa notes, mild bitterness, balanced acidity",
      flavorProfile:
        "Strong cocoa body with dependable bitterness control and balanced acidity for industrial chocolate blends.",
    },
    amelonado: {
      key: "amelonado",
      pageTitle: "Amelonado Cocoa Product Detail",
      image: "img/Ame6.png",
      imageAlt: "Amelonado cocoa beans from Cameroon",
      title: "Premium Amelonado Cocoa Beans from Cameroon",
      intro:
        "CHOCOCAM exports selected Amelonado cocoa with a classic West African profile and dependable quality.",
      spec1:
        "Lots offer medium cocoa intensity and gentle nutty notes, prepared and packed to export standards.",
      spec2:
        "Each shipment is checked for moisture, uniformity, and fermentation, with full compliance documents.",
      spec3:
        "Partner farmer programs support consistent seasonal availability and traceable container bookings.",
      specTitle: "Premium Amelonado Cocoa Beans - Export Specifications",
      varietySpec: "Amelonado (classic West African profile)",
      flavorSpec: "Medium cocoa intensity, gentle nutty undertones",
      flavorProfile:
        "Balanced cocoa profile with mild nutty tones suitable for broad chocolate and cocoa powder applications.",
    },
    cundeamor: {
      key: "cundeamor",
      pageTitle: "Cundeamor Cocoa Product Detail",
      image: "img/Cu1.png",
      imageAlt: "Cundeamor cocoa beans from Cameroon",
      title: "Specialty Cundeamor Cocoa Beans from Cameroon",
      intro:
        "CHOCOCAM provides specialty Cundeamor cocoa from selected farms for premium chocolate applications.",
      spec1:
        "The profile combines strong cocoa aroma, subtle fruit notes, and a refined finish.",
      spec2:
        "Lots are graded for size, moisture, cut test, and purity before export, with complete documentation.",
      spec3:
        "Farmer partnerships improve post-harvest quality and traceability for specialty shipment planning.",
      specTitle: "Specialty Cundeamor Cocoa Beans - Export Specifications",
      varietySpec: "Cundeamor (specialty traceable lots)",
      flavorSpec: "Pronounced cocoa aroma, complex fruity accents",
      flavorProfile:
        "Distinct aromatic profile with layered cocoa and fruit notes suited for specialty chocolate programs.",
    },
    criollo: {
      key: "criollo",
      pageTitle: "Criollo Cocoa Product Detail",
      image: "img/Cri2.png",
      imageAlt: "Criollo cocoa beans from Cameroon",
      title: "Premium Criollo Cocoa Beans from Cameroon",
      intro:
        "CHOCOCAM offers rare Criollo cocoa with fine aroma and refined flavor for gourmet buyers.",
      spec1:
        "Selected lots deliver smooth body, delicate fruit notes, and low bitterness.",
      spec2:
        "Shipments pass strict integrity, moisture, and contamination checks with full export files.",
      spec3:
        "Traceable farmer sourcing supports both micro-lot and contract volumes through Cameroon corridors.",
      specTitle: "Premium Criollo Cocoa Beans - Export Specifications",
      varietySpec: "Criollo (premium micro-lots)",
      flavorSpec: "Smooth aromatic profile, delicate fruity notes",
      flavorProfile:
        "Fine aroma cocoa with soft bitterness and delicate fruit character for gourmet chocolate production.",
    },
    trinitario: {
      key: "trinitario",
      pageTitle: "Trinitario Cocoa Product Detail",
      image: "img/Tri3.png",
      imageAlt: "Trinitario cocoa beans from Cameroon",
      title: "Premium Trinitario Cocoa Beans from Cameroon",
      intro:
        "CHOCOCAM supplies Trinitario cocoa combining strong body with aromatic complexity.",
      spec1:
        "Lots are fermented, dried, and graded for balanced cocoa character and export consistency.",
      spec2:
        "Quality assurance includes moisture, bean count, cut test, and foreign matter verification.",
      spec3:
        "Long-term partnerships secure traceable volumes for contract and spot shipments via Douala and Kribi.",
      specTitle: "Premium Trinitario Cocoa Beans - Export Specifications",
      varietySpec: "Trinitario (selected cooperative lots)",
      flavorSpec: "Balanced cocoa body, subtle fruit notes, aromatic depth",
      flavorProfile:
        "Balanced and aromatic profile combining Forastero strength and Criollo finesse for premium buyers.",
    },
    bresilien: {
      key: "bresilien",
      pageTitle: "Bresilien Cocoa Product Detail",
      image: "img/Bri6.png",
      imageAlt: "Bresilien cocoa beans for export",
      title: "Premium Bresilien Cocoa Beans for International Buyers",
      intro:
        "CHOCOCAM supplies export-ready Bresilien cocoa for buyers requiring consistent processing performance.",
      spec1:
        "Lots deliver rich cocoa character with balanced acidity and are prepared to commercial export standards.",
      spec2:
        "Checks cover moisture, cleanliness, size distribution, and fermentation with full document support.",
      spec3:
        "Coordinated sourcing and logistics enable reliable container supply with clear lot traceability.",
      specTitle: "Premium Bresilien Cocoa Beans - Export Specifications",
      varietySpec: "Bresilien (commercial export lots)",
      flavorSpec: "Rich cocoa character, moderate fruit notes",
      flavorProfile:
        "Structured cocoa aroma with moderate fruit complexity and dependable batch consistency for export programs.",
    },
  };

  var defaultSpecs = {
    originSpec: "Cameroon",
    moistureSpec: "6-7%",
    beanCountSpec: "90-100 beans / 100g",
    fermentationSpec: ">= 85%",
    dryingMethodSpec: "Sun-dried",
    packagingSpec: "Jute bags (50kg or 65kg)",
    minimumOrderSpec: "1 x 20ft container (19-20 MT)",
    shippingPortsSpec: "Douala Port, Kribi Deep Seaport",
    harvestSeason: "Main crop: October to March. Mid crop: April to July.",
    exportPackaging:
      "New export-grade jute bags with lot codes, stack control, and moisture-safe container preparation.",
    shippingInfo:
      "FOB/CIF options available with complete export documents and shipment traceability references.",
  };

  function getNode(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var node = getNode(id);
    if (node) {
      node.textContent = value;
    }
  }

  var params = new URLSearchParams(window.location.search);
  var raw = (params.get("variety") || "forastero").toLowerCase();
  var key = products[raw] ? raw : "forastero";
  var product = Object.assign({}, defaultSpecs, products[key]);

  if (!product) {
    return;
  }

  var image = getNode("product-detail-image");
  if (image) {
    image.src = product.image;
    image.alt = product.imageAlt;
  }

  setText("product-detail-title-text", product.title);
  setText("product-detail-intro", product.intro);
  setText("product-detail-spec-1", product.spec1);
  setText("product-detail-spec-2", product.spec2);
  setText("product-detail-spec-3", product.spec3);
  setText("product-detail-spec-title", product.specTitle);
  setText("product-detail-variety", product.varietySpec);
  setText("product-detail-origin", product.originSpec);
  setText("product-detail-moisture", product.moistureSpec);
  setText("product-detail-bean-count", product.beanCountSpec);
  setText("product-detail-fermentation", product.fermentationSpec);
  setText("product-detail-drying-method", product.dryingMethodSpec);
  setText("product-detail-flavor", product.flavorSpec);
  setText("product-detail-packaging", product.packagingSpec);
  setText("product-detail-min-order", product.minimumOrderSpec);
  setText("product-detail-shipping-ports", product.shippingPortsSpec);
  setText("product-detail-flavor-profile", product.flavorProfile || product.flavorSpec);
  setText("product-detail-harvest-season", product.harvestSeason);
  setText("product-detail-export-packaging", product.exportPackaging);
  setText("product-detail-shipping-info", product.shippingInfo);

  document.title = product.pageTitle + " | CHOCOCAM S.A.R.L";

  var links = document.querySelectorAll("[data-variety-link]");
  links.forEach(function (link) {
    var linkKey = link.getAttribute("data-variety-link");
    var isActive = linkKey === key;
    link.classList.toggle("active-variety", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
})();
