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
        "COCOABRIDGE Ltd supplies Forastero cocoa from trusted Cameroonian cooperatives, known for strong cocoa body and reliable industrial use.",
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
        "COCOABRIDGE exports selected Amelonado cocoa with a classic West African profile and dependable quality.",
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
        "COCOABRIDGE provides specialty Cundeamor cocoa from selected farms for premium chocolate applications.",
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
        "COCOABRIDGE offers rare Criollo cocoa with fine aroma and refined flavor for gourmet buyers.",
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
        "COCOABRIDGE supplies Trinitario cocoa combining strong body with aromatic complexity.",
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
        "COCOABRIDGE supplies export-ready Bresilien cocoa for buyers requiring consistent processing performance.",
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
    cocoa_butter: {
      key: "cocoa_butter",
      pageTitle: "Cocoa Butter Product Detail",
      image: "img/cocoabut.png",
      imageAlt: "Cocoa butter blocks prepared for export",
      title: "Premium Cocoa Butter for Food and Cosmetic Applications",
      intro:
        "COCOABRIDGE supplies deodorized and natural cocoa butter pressed from high-quality beans for chocolate, confectionery, and cosmetic formulations.",
      spec1:
        "Produced from fermented cocoa beans with controlled pressing for consistent fat composition and low moisture.",
      spec2:
        "Quality controls verify FFA, iodine value, peroxide value, and color, with batch traceability and export documents.",
      spec3:
        "Packed in lined cartons or pails suitable for container shipping with temperature-aware handling guidance.",
      specTitle: "Cocoa Butter - Export Specifications",
      varietySpec: "Cocoa butter (deodorized or natural)",
      flavorSpec: "Mild cocoa aroma, pale yellow fat, smooth melt profile",
      flavorProfile:
        "Neutral-to-light cocoa aroma with clean melt behavior for chocolate, cosmetics, and nutraceutical use.",
      moistureSpec: "<0.2%",
      beanCountSpec: "Not applicable (pressed cocoa butter)",
      fermentationSpec: "Not applicable (processed ingredient)",
      dryingMethodSpec: "Pressed and filtered",
      packagingSpec: "20-25kg lined cartons or pails",
      exportPackaging:
        "Food-grade liners in cartons/pails with palletization and shrink wrap for container loading.",
      shippingInfo:
        "FOB/CIF options with cold-chain recommendations for warm climates and full export documentation.",
    },
    cocoa_shells: {
      key: "cocoa_shells",
      pageTitle: "Cocoa Shells Product Detail",
      image: "img/cocoashell.png",
      imageAlt: "Cleaned cocoa shells ready for bulk export",
      title: "Cleaned Cocoa Shells for Extraction, Feed, and Biomass",
      intro:
        "COCOABRIDGE offers cleaned and dried cocoa shells suitable for cocoa extract, dietary fiber blends, animal feed enrichment, and sustainable biomass fuel.",
      spec1:
        "Shells collected post-winnowing and screened to minimize nib residues and foreign matter.",
      spec2:
        "Moisture checked to shipping-safe levels with fumigation and phytosanitary documentation when required.",
      spec3:
        "Flexible packing in woven polypropylene or jumbo bags with lot coding for traceability.",
      specTitle: "Cocoa Shells - Export Specifications",
      varietySpec: "Cocoa shells (cleaned, dried)",
      flavorSpec: "Toasty cocoa aroma with mild woody notes",
      flavorProfile:
        "Light cocoa aroma suitable for extract production, feed flavoring, or biomass combustion.",
      moistureSpec: "<= 10%",
      beanCountSpec: "Not applicable (shell by-product)",
      fermentationSpec: "Derived from fermented and roasted beans",
      dryingMethodSpec: "Mechanical or sun-dried to safe moisture",
      packagingSpec: "25kg woven sacks or 500-1000kg jumbo bags",
      shippingInfo:
        "FOB/CIF with fumigation and phytosanitary certificates available; stowage guidance for dry cargo.",
    },
    cameroon_arabica: {
      key: "cameroon_arabica",
      pageTitle: "Arabica Coffee Product Detail",
      image: "img/cacao.jpg",
      imageAlt: "COCOABRIDGE product information",
      title: "Arabica Coffee from Cameroon",
      varietySpec: "Arabica coffee",
    },
    cameroon_robusta: {
      key: "cameroon_robusta",
      pageTitle: "Robusta Coffee Product Detail",
      image: "img/cacao.jpg",
      imageAlt: "COCOABRIDGE product information",
      title: "Robusta Coffee from Cameroon",
      varietySpec: "Robusta coffee",
    },
    cocoa_powder: {
      key: "cocoa_powder",
      pageTitle: "Cocoa Powder Product Detail",
      image: "img/cacao.jpg",
      imageAlt: "COCOABRIDGE product information",
      title: "Cocoa Powder from Cameroon",
      varietySpec: "Cocoa powder",
    },
  };

  var defaultSpecs = {
    originSpec: "Cameroon — origin certificate and lot reference supplied with the shipment file",
    moistureSpec: "Lot result shown on the pre-shipment certificate of analysis (COA)",
    beanCountSpec: "Recorded in the pre-shipment quality report where applicable",
    fermentationSpec: "Recorded by cut test or processing record, as applicable",
    dryingMethodSpec: "Declared in the lot preparation record",
    packagingSpec: "Food-grade export packaging matched to the confirmed order",
    minimumOrderSpec: "Commercial minimum confirmed with the quotation",
    shippingPortsSpec: "Douala or Kribi, Cameroon; final routing agreed before booking",
    harvestSeason: "Availability is released only after lot allocation and quality review.",
    exportPackaging: "Packaging, marks, palletization, and container protection are stated on the packing list.",
    shippingInfo: "FOB or CIF terms and the document set are stated in the signed sales contract.",
  };

  // Published specification targets. Final values are verified against the
  // allocated lot's COA and pre-shipment inspection report. Cocoa targets use
  // ICCO post-harvest guidance; green-coffee moisture uses ICO Resolution 420.
  var cocoaBeanExportSpecs = {
    originSpec: "Cameroon — cooperative/lot traceable; certificate of origin included in the export file",
    moistureSpec: "≤ 7.5% at dispatch; verified on the lot COA",
    beanCountSpec: "90–110 beans per 100 g; verified by pre-shipment count",
    fermentationSpec: "Good fermented (GF) target; cut-test report provided for the allocated lot",
    dryingMethodSpec: "Sun-dried and/or controlled mechanical drying after fermentation",
    packagingSpec: "65 kg new jute bags; food-grade liner available when specified in the contract",
    minimumOrderSpec: "One 20 ft container program or agreed consolidated quantity",
    shippingPortsSpec: "Douala or Kribi, Cameroon",
    harvestSeason: "Main crop: September–March; mid-crop: April–July. Allocation is confirmed after quality review.",
    exportPackaging: "New jute bags with lot marks; container liner, desiccants, pallets, or stretch wrap supplied when contractually specified.",
    shippingInfo: "FOB Douala/Kribi or CIF destination port. COA, packing list, certificate of origin, and shipping documents are issued per contract.",
  };

  ["forastero", "amelonado", "cundeamor", "criollo", "trinitario", "bresilien"].forEach(function (key) {
    Object.assign(products[key], cocoaBeanExportSpecs);
  });

  Object.assign(products.cameroon_arabica, {
    intro: "COCOABRIDGE supplies green Arabica coffee from Cameroon for roasters and importers, with quality, processing, packaging, and shipment details documented per allocated lot.",
    spec1: "Green-coffee lots are evaluated for moisture, screen size, defects, odor, processing condition, and lot identity before shipment.",
    spec2: "Moisture follows the ICO 8.0–12.5% export range; the final result, screen distribution, and defects are stated in the lot COA.",
    spec3: "Availability is allocated after sample and quality review; packing, shipment window, and documentation are confirmed on the sales contract.",
    specTitle: "Cameroon Arabica Coffee — Export Specifications",
    flavorSpec: "Balanced acidity, cocoa and fruit notes; cup profile varies by processing and lot",
    flavorProfile: "Western Highlands Arabica, offered subject to lot availability and sample approval.",
    originSpec: "Cameroon — Western Highlands sourcing area and lot reference documented in the export file",
    moistureSpec: "8.0–12.5%; verified on the lot COA before container stuffing",
    beanCountSpec: "Screen-size grading replaces cocoa bean count; screen 15+ or buyer-agreed screen distribution",
    fermentationSpec: "Processing declared per lot (washed or natural); fermentation is not used as a green-coffee grade",
    dryingMethodSpec: "Raised-bed/patio or controlled mechanical drying, declared on the lot record",
    packagingSpec: "60 kg new jute bags; GrainPro or food-grade liner available on request",
    minimumOrderSpec: "One 20 ft container program or agreed consolidated quantity",
    shippingPortsSpec: "Douala or Kribi, Cameroon",
    harvestSeason: "Primary availability: November–February; final availability is confirmed after lot allocation.",
    exportPackaging: "New jute bags with buyer bag marks; liner, desiccants, and container moisture protection available by contract.",
    shippingInfo: "FOB Douala/Kribi or CIF destination port. COA, packing list, certificate of origin, and phytosanitary documentation are supplied as applicable.",
  });

  Object.assign(products.cameroon_robusta, {
    intro: "COCOABRIDGE supplies green Robusta coffee from Cameroon for commercial roasters, soluble coffee programs, and traders, with lot-specific quality and logistics records.",
    spec1: "Green-coffee lots are evaluated for moisture, screen size, defects, odor, processing condition, and lot identity before shipment.",
    spec2: "Moisture follows the ICO 8.0–12.5% export range; the final result, screen distribution, and defects are stated in the lot COA.",
    spec3: "Availability is allocated after sample and quality review; packing, shipment window, and documentation are confirmed on the sales contract.",
    specTitle: "Cameroon Robusta Coffee — Export Specifications",
    flavorSpec: "Full body, cocoa and cereal notes, pronounced crema potential; cup profile varies by lot",
    flavorProfile: "Cameroon Robusta supplied subject to lot availability and sample approval.",
    originSpec: "Cameroon — origin area and lot reference documented in the export file",
    moistureSpec: "8.0–12.5%; verified on the lot COA before container stuffing",
    beanCountSpec: "Screen-size grading replaces cocoa bean count; screen 16+ or buyer-agreed screen distribution",
    fermentationSpec: "Processing declared per lot (natural or washed); fermentation is not used as a green-coffee grade",
    dryingMethodSpec: "Patio, raised-bed, or controlled mechanical drying, declared on the lot record",
    packagingSpec: "60 kg new jute bags; GrainPro or food-grade liner available on request",
    minimumOrderSpec: "One 20 ft container program or agreed consolidated quantity",
    shippingPortsSpec: "Douala or Kribi, Cameroon",
    harvestSeason: "Primary availability: November–February; final availability is confirmed after lot allocation.",
    exportPackaging: "New jute bags with buyer bag marks; liner, desiccants, and container moisture protection available by contract.",
    shippingInfo: "FOB Douala/Kribi or CIF destination port. COA, packing list, certificate of origin, and phytosanitary documentation are supplied as applicable.",
  });

  Object.assign(products.cocoa_powder, {
    intro: "COCOABRIDGE supplies natural or alkalized cocoa powder for food manufacturing, with composition and microbiological requirements agreed before allocation.",
    spec1: "Powder grade, fat content, alkalization, color, particle size, and microbiological requirements are agreed against the buyer specification.",
    spec2: "Moisture, fat content, pH, and microbiological results are supplied on the batch COA before shipment.",
    spec3: "Production and dispatch availability are confirmed only after the agreed grade, packaging, and destination requirements are reviewed.",
    specTitle: "Cocoa Powder — Export Specifications",
    flavorSpec: "Natural cocoa or alkalized profile, selected to the agreed food application",
    flavorProfile: "Food-grade cocoa powder supplied to the agreed technical specification and batch COA.",
    originSpec: "Processed in Cameroon from cocoa beans with batch traceability",
    moistureSpec: "≤ 5.0%; verified on the batch COA",
    beanCountSpec: "Not applicable — powder is a processed cocoa ingredient",
    fermentationSpec: "Made from fermented cocoa beans; no finished-powder fermentation rate applies",
    dryingMethodSpec: "Mechanically processed and packed under controlled conditions",
    packagingSpec: "25 kg food-grade paper bags with inner liner; alternative pack sizes by agreement",
    minimumOrderSpec: "Pallet quantity or container program, agreed with the quotation",
    shippingPortsSpec: "Douala or Kribi, Cameroon",
    harvestSeason: "Year-round production subject to factory schedule and raw-material allocation.",
    exportPackaging: "Sealed food-grade inner liner, outer bag, palletization, and stretch wrap as specified in the packing list.",
    shippingInfo: "FOB Douala/Kribi or CIF destination port with COA, packing list, certificate of origin, and food-safety documents as applicable.",
  });

  function getNode(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var node = getNode(id);
    if (node) {
      node.textContent = value;
    }
  }

  function setLink(id, text, href) {
    var node = getNode(id);
    if (!node) {
      return;
    }

    if (typeof text === "string" && text) {
      node.textContent = text;
    }

    if (typeof href === "string" && href) {
      node.setAttribute("href", href);
    }
  }

  var params = new URLSearchParams(window.location.search);
  var slugKeys = {
    "amelonado-cocoa": "amelonado",
    "arabica-coffee": "cameroon_arabica",
    "bresilien-cocoa": "bresilien",
    "cocoa-powder": "cocoa_powder",
    "cocoa-butter": "cocoa_butter",
    "cocoa-shells": "cocoa_shells",
    "criollo-cocoa": "criollo",
    "forastero-cocoa": "forastero",
    "robusta-coffee": "cameroon_robusta",
    "trinitario-cocoa": "trinitario",
  };
  var raw = (
    params.get("variety") ||
    slugKeys[params.get("slug")] ||
    "forastero"
  ).toLowerCase();
  var key = products[raw] ? raw : "forastero";
  var product = Object.assign({}, defaultSpecs, products[key]);

  if (!product) {
    return;
  }

  // Preserve the product-specific content defined in the catalogue.
  // Only provide safe fallbacks when a field is genuinely missing.
  product.title = product.title || product.pageTitle.replace(" Product Detail", "") + " from Cameroon";
  product.intro = product.intro || "Contact COCOABRIDGE to confirm product availability and specifications.";
  product.spec1 = product.spec1 || "Request current product specifications from COCOABRIDGE.";
  product.spec2 = product.spec2 || "Quality parameters and supporting documents are confirmed for each lot.";
  product.spec3 = product.spec3 || "Availability, packaging, quantities, and shipping terms are subject to confirmation.";
  product.specTitle = product.specTitle || product.title + " - Product Information";
  product.varietySpec = product.varietySpec || product.title;
  product.flavorSpec = product.flavorSpec || "Confirm product characteristics for the selected lot.";
  product.flavorProfile = product.flavorProfile || product.flavorSpec;
  product.originSpec = product.originSpec || "Cameroon";
  product.moistureSpec = product.moistureSpec || "Confirm for selected lot";
  product.beanCountSpec = product.beanCountSpec || "Confirm for selected lot, if applicable";
  product.fermentationSpec = product.fermentationSpec || "Confirm for selected lot, if applicable";
  product.dryingMethodSpec = product.dryingMethodSpec || "Confirm for selected lot, if applicable";
  product.packagingSpec = product.packagingSpec || "Confirm for selected lot";
  product.minimumOrderSpec = product.minimumOrderSpec || "Confirm for buyer enquiry";
  product.shippingPortsSpec = product.shippingPortsSpec || "Confirm routing for buyer enquiry";
  product.harvestSeason = product.harvestSeason || "Confirm current availability with COCOABRIDGE.";
  product.exportPackaging = product.exportPackaging || "Confirm available packaging for the selected lot.";
  product.shippingInfo = product.shippingInfo || "Confirm shipping terms and documentation for the buyer enquiry.";

  var image = getNode("product-detail-image");
  if (image) {
    image.src = product.image;
    image.alt = product.imageAlt;
  }

  setText("product-detail-title-text", product.title);
  setText("product-detail-page-title", product.title);
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

  document.title = product.title + " | COCOABRIDGE Ltd";

  var marketLabel = String(product.varietySpec || product.title || "Cocoa").split(" (")[0];
  setLink("market-view-current-link", marketLabel + " Market View", "product_detail.html?variety=" + encodeURIComponent(key));
  setLink("market-view-container-link", "Container Program & Export Workflow", "export.html");
  setLink("market-view-traceability-link", "Traceability & Lot Readiness", "traceability.html");
  setLink("market-view-quote-link", "Request Quote for " + marketLabel, "index.html#buyer_quote_home");

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

  var marketViewCurrentLink = getNode("market-view-current-link");
  if (marketViewCurrentLink) {
    marketViewCurrentLink.classList.add("active-variety");
    marketViewCurrentLink.setAttribute("aria-current", "page");
  }
})();
