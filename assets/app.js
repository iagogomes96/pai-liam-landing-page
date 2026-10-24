(function () {
  "use strict";

  const config = window.PAI_LIAM_CONFIG || {};
  const offer = config.offer || {};
  const guarantee = config.guarantee || {};
  const contact = config.contact || {};
  const messages = contact.whatsappMessages || {};
  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  });
  const money = (value) => currency.format(Number(value) || 0);

  const setText = (selector, value) => {
    if (value === undefined || value === null || value === "") return;
    document.querySelectorAll(selector).forEach((node) => { node.textContent = String(value); });
  };
  setText("[data-brand]", config.brandName);
  setText("[data-experience]", config.experienceYears);
  setText("[data-price='regular']", money(offer.regularPrice));
  setText("[data-price='promotional']", money(offer.promotionalPrice));
  setText("[data-result-days]", offer.resultsStartDays);
  setText("[data-guarantee-days]", guarantee.days);
  setText("[data-refund-percent]", guarantee.refundPercent);
  setText("[data-scarcity]", offer.scarcityLabel);
  setText("[data-current-year]", new Date().getFullYear());
  if (config.siteTitle) {
    document.title = config.siteTitle;
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", config.siteTitle);
  }
  if (config.siteDescription) {
    document.querySelector('meta[name="description"]')?.setAttribute("content", config.siteDescription);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", config.siteDescription);
  }

  const dateNode = document.querySelector("[data-daily-date]");
  if (dateNode) {
    const updateDate = () => {
      const now = new Date();
      const options = { timeZone: config.timeZone || "America/Sao_Paulo" };
      const parts = new Intl.DateTimeFormat("en-CA", {
        ...options,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(now);
      const dateParts = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      dateNode.dateTime = dateParts.year + "-" + dateParts.month + "-" + dateParts.day;
      dateNode.textContent = new Intl.DateTimeFormat("pt-BR", {
        ...options,
        day: "2-digit",
        month: "2-digit"
      }).format(now);
    };
    updateDate();
    window.setInterval(updateDate, 60 * 1000);
  }

  const phone = String(contact.whatsappNumber || "").replace(/\D/g, "");
  const messageFor = (context) => messages[context] || messages.hero || "Olá, gostaria de saber mais sobre o atendimento.";
  const whatsappUrl = (context) => {
    const message = messageFor(context)
      .replaceAll("{regularPrice}", money(offer.regularPrice))
      .replaceAll("{promoPrice}", money(offer.promotionalPrice))
      .replaceAll("{brand}", config.brandName || "Pai Liam");
    return (phone ? "https://wa.me/" + phone : "https://wa.me/") + "?text=" + encodeURIComponent(message);
  };

  document.querySelectorAll("[data-wa-cta]:not([data-mobile-cta-link])").forEach((link) => {
    const context = link.dataset.waCta || "hero";
    link.href = whatsappUrl(context);
    link.addEventListener("click", () => {
      const analytics = config.analytics || {};
      if (analytics.conversionEvent && Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: analytics.conversionEvent, cta_context: link.dataset.conversionContext || context });
      }
    });
  });

  const footerWhatsapp = document.querySelector("[data-footer-whatsapp]");
  if (footerWhatsapp) {
    footerWhatsapp.href = whatsappUrl("final");
    footerWhatsapp.target = "_blank";
    footerWhatsapp.rel = "noopener noreferrer";
  }

  const socials = [
    ["Instagram", "instagramUrl", "◎"],
    ["Facebook", "facebookUrl", "f"],
    ["TikTok", "tiktokUrl", "♪"]
  ];
  const socialContainer = document.querySelector("[data-social-links]");
  if (socialContainer) {
    socials.forEach(([label, key, mark]) => {
      const url = String((config.social || {})[key] || "").trim();
      if (!url) return;
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return;
        const anchor = document.createElement("a");
        anchor.href = parsed.href;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.setAttribute("aria-label", label + " de " + (config.brandName || "Pai Liam"));
        anchor.textContent = mark;
        socialContainer.appendChild(anchor);
      } catch (_) {
        // Links sociais inválidos não são exibidos.
      }
    });
  }

  const privacyNode = document.querySelector("[data-privacy-link]");
  if (privacyNode && config.privacyUrl) {
    const privacyLink = document.createElement("a");
    privacyLink.href = config.privacyUrl;
    privacyLink.textContent = "Política de Privacidade";
    privacyLink.rel = "noopener noreferrer";
    privacyNode.hidden = false;
    privacyNode.append(" ", privacyLink);
  }
  const gtmId = String((config.analytics || {}).gtmContainerId || "").trim();
  if (/^GTM-[A-Z0-9]+$/.test(gtmId)) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(gtmId);
    document.head.appendChild(script);
  }

  const mobileBar = document.querySelector("[data-mobile-cta-bar]");
  const mobileLink = document.querySelector("[data-mobile-cta-link]");
  const mobileSections = [...document.querySelectorAll("[data-mobile-cta]")];
  const finalSection = document.querySelector(".final-cta");
  if (mobileBar && mobileLink && mobileSections.length) {
    const formatLabel = (template) => String(template || "Falar pelo WhatsApp")
      .replaceAll("{promoPrice}", money(offer.promotionalPrice))
      .replaceAll("{regularPrice}", money(offer.regularPrice));
    const setActiveSection = (section) => {
      const context = section.dataset.waContext || "hero";
      mobileLink.textContent = formatLabel(section.dataset.ctaLabel);
      mobileLink.dataset.waCta = context;
      mobileLink.dataset.conversionContext = context;
      mobileLink.href = whatsappUrl(context);
    };
    setActiveSection(mobileSections[0]);

    if ("IntersectionObserver" in window) {
      const visible = new Map();
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target, entry.intersectionRatio);
          else visible.delete(entry.target);
        });
        const current = [...visible.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        if (current) setActiveSection(current);
      }, { rootMargin: "-15% 0px -35% 0px", threshold: [0.1, 0.35, 0.6] });
      mobileSections.forEach((section) => sectionObserver.observe(section));
    }
    if (finalSection) {
      const dockMobileCta = () => {
        if (window.innerWidth > 760) {
          mobileBar.classList.remove("is-docked");
          mobileBar.style.removeProperty("top");
          return;
        }
        const endOfFinal = finalSection.getBoundingClientRect().bottom + window.scrollY;
        const shouldDock = window.scrollY + window.innerHeight >= endOfFinal;
        mobileBar.classList.toggle("is-docked", shouldDock);
        if (shouldDock) mobileBar.style.top = Math.round(endOfFinal - mobileBar.offsetHeight) + "px";
        else mobileBar.style.removeProperty("top");
      };
      window.addEventListener("scroll", dockMobileCta, { passive: true });
      window.addEventListener("resize", dockMobileCta, { passive: true });
      dockMobileCta();
    }
    mobileLink.addEventListener("click", () => {
      const analytics = config.analytics || {};
      if (analytics.conversionEvent && Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: analytics.conversionEvent, cta_context: mobileLink.dataset.conversionContext || "hero" });
      }
    });
  }

  // Revela blocos conforme a leitura, sem ocultar o conteúdo quando não há suporte
  // a IntersectionObserver ou quando o visitante prefere movimento reduzido.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const revealGroups = [
      ".guarantee-emblem", ".guarantee-copy", ".intro-art", ".intro-copy",
      ".work-section .section-heading", ".work-card", ".offer-description", ".offer-card",
      ".testimonials-section .section-heading", ".carousel-wrap", ".video-heading", ".video-grid",
      ".hiring-section .section-heading", ".steps li", ".fit-section .section-heading",
      ".fit-grid p", ".about-copy", ".about-photo", ".trust-section .section-heading",
      ".trust-grid article", ".faq-inner", ".final-cta-inner"
    ];
    const revealItems = document.querySelectorAll(revealGroups.join(","));
    revealItems.forEach((item, index) => {
      item.dataset.reveal = "";
      item.style.setProperty("--reveal-delay", (index % 3) * 75 + "ms");
    });
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
    document.documentElement.classList.add("js-motion");
  }

  const videoGallery = document.querySelector("[data-video-gallery]");
  if (videoGallery) {
    (config.youtubeVideos || []).forEach((video, index) => {
      const id = String(video.id || "").trim();
      if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;

      const item = document.createElement("div");
      item.className = "video-item";
      const frame = document.createElement("div");
      frame.className = "video-frame";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "video-trigger";
      trigger.setAttribute("aria-label", "Reproduzir " + (video.title || "depoimento em vídeo"));

      const poster = document.createElement("img");
      poster.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
      poster.alt = "";
      poster.loading = "lazy";
      poster.decoding = "async";

      const label = document.createElement("span");
      label.textContent = video.title || "Depoimento em vídeo " + (index + 1);
      trigger.append(poster, label);

      trigger.addEventListener("click", () => {
        if (window.location.protocol === "file:") {
          const hint = document.createElement("div");
          hint.className = "video-local-hint";
          const title = document.createElement("strong");
          title.textContent = "Prévia local";
          const description = document.createElement("p");
          description.textContent = "Para reproduzir o vídeo nesta página, abra abrir-preview.cmd na pasta do projeto e clique no vídeo na aba HTTP que será aberta.";
          hint.append(title, description);
          frame.replaceChildren(hint);
          return;
        }
        const player = document.createElement("iframe");
        const playerUrl = new URL("https://www.youtube.com/embed/" + id);
        playerUrl.searchParams.set("autoplay", "1");
        playerUrl.searchParams.set("rel", "0");
        playerUrl.searchParams.set("playsinline", "1");
        if (window.location.protocol === "http:" || window.location.protocol === "https:") {
          playerUrl.searchParams.set("origin", window.location.origin);
        }
        player.src = playerUrl.href;
        player.title = video.title || "Depoimento em vídeo " + (index + 1);
        player.loading = "eager";
        player.referrerPolicy = "strict-origin-when-cross-origin";
        player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        player.allowFullscreen = true;
        frame.replaceChildren(player);
      }, { once: true });

      const directLink = document.createElement("a");
      directLink.className = "video-direct-link";
      directLink.href = "https://www.youtube.com/shorts/" + id;
      directLink.target = "_blank";
      directLink.rel = "noopener noreferrer";
      directLink.textContent = "Abrir no YouTube se necessário ↗";
      frame.appendChild(trigger);
      item.append(frame, directLink);
      videoGallery.appendChild(item);
    });
  }

  const track = document.querySelector(".testimonial-track");
  if (track) {
    const previous = document.querySelector(".carousel-prev");
    const next = document.querySelector(".carousel-next");
    const cards = [...track.querySelectorAll(".testimonial-card")];
    const updateControls = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (previous) previous.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= maxScroll - 2;
    };
    const scrollByCard = (direction) => {
      const card = cards[0];
      if (!card) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: (card.getBoundingClientRect().width + gap) * direction, behavior: "smooth" });
    };
    previous?.addEventListener("click", () => scrollByCard(-1));
    next?.addEventListener("click", () => scrollByCard(1));
    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls, { passive: true });
    updateControls();
  }
})();
