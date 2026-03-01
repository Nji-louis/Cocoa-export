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
        "CHOCOCAM S.A.R.L supplies robust Forastero cocoa lots sourced from cooperative farmers in Cameroon. This variety is known for its strong cocoa body, reliable bean count, and consistent performance in large-scale chocolate production and industrial processing.",
      spec1:
        "Our Forastero program focuses on export-ready lots with uniform fermentation, controlled moisture, and standardized sorting. Typical flavor profile includes deep cocoa notes, mild bitterness, and balanced acidity, making it ideal for blends and bulk manufacturing contracts.",
      spec2:
        "Quality control includes moisture verification, cut test sampling, bean count review, and foreign matter inspection before loading. Export documentation package includes certificate of origin, phytosanitary certificate, quality report, packing list, and commercial invoice.",
      spec3:
        "Through long-term farmer partnerships, CHOCOCAM secures dependable Forastero volumes for annual contracts and spot container orders. Shipments are coordinated through Douala Port and Kribi Deep Seaport with traceable lot references for each container.",
      specTitle: "Premium Forastero Cocoa Beans - Export Specifications",
      varietySpec: "Forastero (export-grade lots)",
      flavorSpec: "Deep cocoa notes, mild bitterness, balanced acidity",
    },
    amelonado: {
      key: "amelonado",
      pageTitle: "Amelonado Cocoa Product Detail",
      image: "img/Ame6.png",
      imageAlt: "Amelonado cocoa beans from Cameroon",
      title: "Premium Amelonado Cocoa Beans from Cameroon",
      intro:
        "CHOCOCAM S.A.R.L exports carefully selected Amelonado cocoa beans from partner cooperatives across Cameroon. Amelonado lots are valued for their classic West African profile, dependable quality, and suitability for mainstream chocolate formulations.",
      spec1:
        "Our Amelonado supply offers medium cocoa intensity, gentle nutty undertones, and balanced bitterness. Beans are fermented and dried to export standards, then sorted and packed in jute bags to preserve quality during long-distance shipment.",
      spec2:
        "Each lot is checked for moisture, mold risk, bean uniformity, and fermentation condition before dispatch. Export files include certificate of origin, phytosanitary certificate, quality analysis summary, packing list, and commercial invoice for smooth clearance.",
      spec3:
        "CHOCOCAM works with farmer groups to maintain consistent Amelonado availability throughout the season while supporting sustainable production practices. Buyers can book regular container programs with transparent lot traceability from origin to destination.",
      specTitle: "Premium Amelonado Cocoa Beans - Export Specifications",
      varietySpec: "Amelonado (classic West African profile)",
      flavorSpec: "Medium cocoa intensity, gentle nutty undertones",
    },
    cundeamor: {
      key: "cundeamor",
      pageTitle: "Cundeamor Cocoa Product Detail",
      image: "img/Cu1.png",
      imageAlt: "Cundeamor cocoa beans from Cameroon",
      title: "Specialty Cundeamor Cocoa Beans from Cameroon",
      intro:
        "CHOCOCAM S.A.R.L provides specialty Cundeamor cocoa beans sourced from selected farms in Cameroon. Cundeamor is appreciated by specialty buyers for its distinctive character and compatibility with premium chocolate programs.",
      spec1:
        "Flavor profile typically shows pronounced cocoa aroma, complex fruity accents, and an elegant bitter finish. Our team manages controlled fermentation and drying windows to protect sensory quality and preserve consistency across export lots.",
      spec2:
        "Before export, Cundeamor lots pass grading checks for bean size, moisture level, cut test, and purity. We provide full shipping documentation including certificate of origin, phytosanitary certificate, quality note, packing list, and commercial invoice.",
      spec3:
        "CHOCOCAM supports farmer partnerships that improve post-harvest handling and traceability for Cundeamor supply chains. Buyers can secure specialty container lots for craft and premium chocolate manufacturing with structured shipment planning.",
      specTitle: "Specialty Cundeamor Cocoa Beans - Export Specifications",
      varietySpec: "Cundeamor (specialty traceable lots)",
      flavorSpec: "Pronounced cocoa aroma, complex fruity accents",
    },
    criollo: {
      key: "criollo",
      pageTitle: "Criollo Cocoa Product Detail",
      image: "img/Cri2.png",
      imageAlt: "Criollo cocoa beans from Cameroon",
      title: "Premium Criollo Cocoa Beans from Cameroon",
      intro:
        "CHOCOCAM S.A.R.L offers premium Criollo cocoa beans from carefully managed sourcing zones in Cameroon. Criollo is a rare variety recognized for fine aroma and refined flavor, suitable for gourmet chocolate applications.",
      spec1:
        "Criollo flavor profile is smooth and aromatic with delicate fruity notes, mild bitterness, and low astringency. We apply strict lot selection, fermentation tracking, and gentle post-harvest handling to maintain premium quality standards.",
      spec2:
        "All Criollo shipments undergo intensive quality screening including bean integrity, moisture control, visual grading, and contamination checks. Export support includes certificate of origin, phytosanitary certificate, quality report, packing list, and commercial invoice.",
      spec3:
        "By partnering with experienced farmer groups, CHOCOCAM secures traceable Criollo micro-lots and contract volumes for international buyers. Loading and documentation are coordinated for dependable delivery through Cameroon export corridors.",
      specTitle: "Premium Criollo Cocoa Beans - Export Specifications",
      varietySpec: "Criollo (premium micro-lots)",
      flavorSpec: "Smooth aromatic profile, delicate fruity notes",
    },
    trinitario: {
      key: "trinitario",
      pageTitle: "Trinitario Cocoa Product Detail",
      image: "img/Tri3.png",
      imageAlt: "Trinitario cocoa beans from Cameroon",
      title: "Premium Trinitario Cocoa Beans from Cameroon",
      intro:
        "CHOCOCAM S.A.R.L supplies export-grade Trinitario cocoa beans from selected farmer cooperatives in Cameroon. Trinitario combines the strength of Forastero with the aromatic complexity valued by premium chocolate manufacturers and international buyers.",
      spec1:
        "Our Trinitario lots deliver a balanced flavor profile with rich cocoa body, subtle fruit notes, and refined aromatic depth. Beans are fermented and dried under controlled post-harvest protocols, then graded for export consistency.",
      spec2:
        "Quality assurance includes moisture checks, bean count analysis, cut test verification, and foreign matter inspection before shipment. Each container is supported by certificate of origin, phytosanitary certificate, quality report, packing list, and commercial invoice.",
      spec3:
        "Through long-term farmer partnerships, CHOCOCAM secures traceable Trinitario volumes for contract and spot orders. Shipments are coordinated via Douala Port and Kribi Deep Seaport with clear lot identification and reliable export timelines.",
      specTitle: "Premium Trinitario Cocoa Beans - Export Specifications",
      varietySpec: "Trinitario (selected cooperative lots)",
      flavorSpec: "Balanced cocoa body, subtle fruit notes, aromatic depth",
    },
    bresilien: {
      key: "bresilien",
      pageTitle: "Bresilien Cocoa Product Detail",
      image: "img/Bri6.png",
      imageAlt: "Bresilien cocoa beans for export",
      title: "Premium Bresilien Cocoa Beans for International Buyers",
      intro:
        "CHOCOCAM S.A.R.L supplies export-ready Bresilien cocoa lots through its professional Cameroon export network. This variety is selected for buyers seeking consistent bean quality, dependable supply execution, and strong processing performance.",
      spec1:
        "Bresilien profile presents rich cocoa character with moderate fruit notes and balanced acidity. Beans are processed under controlled fermentation and drying conditions, then graded and packed to meet international commercial requirements.",
      spec2:
        "Our pre-shipment controls verify moisture, cleanliness, bean size distribution, and fermentation indicators to reduce quality risk. Documentation package includes certificate of origin, phytosanitary certificate, quality summary, packing list, and commercial invoice.",
      spec3:
        "CHOCOCAM coordinates Bresilien sourcing with trusted producer partners and logistics operators, enabling secure container movements for long-term contracts and spot demand. Each shipment is tracked with clear lot identification for buyer assurance.",
      specTitle: "Premium Bresilien Cocoa Beans - Export Specifications",
      varietySpec: "Bresilien (commercial export lots)",
      flavorSpec: "Rich cocoa character, moderate fruit notes",
    },
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
  var product = products[key];

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
  setText("product-detail-flavor", product.flavorSpec);

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
