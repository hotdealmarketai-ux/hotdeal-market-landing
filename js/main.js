/* =====================================================
   핫딜마켓 가맹 랜딩 — Interactions
   ===================================================== */
(function () {
  "use strict";

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 통계 카운트업 (0 → 목표값) ---------- */
  (function () {
    var counters = document.querySelectorAll(".cnt[data-to]");
    if (!counters.length) return;
    function fmt(n, t) {
      if (t === "dec") return n.toFixed(1);
      if (t === "comma") return Math.round(n).toLocaleString();
      return Math.round(n).toString();
    }
    function run(el) {
      var to = parseFloat(el.getAttribute("data-to"));
      var t = el.getAttribute("data-fmt");
      var dur = 1200, start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * eased, t);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(run);
    }
  })();

  /* ---------- Toast ---------- */
  var toast = document.getElementById("toast");
  var toastMsg = document.getElementById("toastMsg");
  var toastTimer;
  function showToast(msg) {
    if (msg) toastMsg.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 3200);
  }

  /* ---------- Modal ---------- */
  var modal = document.getElementById("modal");
  var floatBtn = document.getElementById("floatBtn");

  function openModal() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var first = modal.querySelector("input");
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (floatBtn) floatBtn.addEventListener("click", openModal);
  modal.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  /* ---------- 상담 폼 전송 ----------
     아래 FORM_ENDPOINT 에 구글 Apps Script 웹앱 URL을 넣으면 실제 전송됩니다.
     비어 있으면 데모(화면 알림)로 안전하게 동작합니다. */
  var FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbxxJ4ipqPW1HFpPN0nUSym55rvdx5UgbNwwg24cFBADznVy_E0s53_XT4t4iygb9PAkjQ/exec"; // 구글 Apps Script 웹앱

  var forms = document.querySelectorAll(".apply-form");
  forms.forEach(function (form) {
    var sending = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;

      var name = (form.querySelector('[name="name"]') || {}).value || "";
      var phone = (form.querySelector('[name="phone"]') || {}).value || "";
      var agree = form.querySelector('[name="agree"]');

      if (!name.trim()) { showToast("성함을 입력해주세요."); focusField(form, "name"); return; }
      if (!/[0-9]{2,3}.*[0-9]{3,4}.*[0-9]{4}/.test(phone.replace(/\s/g, ""))) {
        showToast("연락처를 정확히 입력해주세요. (예: 010-0000-0000)"); focusField(form, "phone"); return;
      }
      if (agree && !agree.checked) { showToast("개인정보 수집·이용에 동의해주세요."); return; }

      function done(msg, ok) {
        showToast(msg);
        if (ok) { form.reset(); if (modal.classList.contains("open")) setTimeout(closeModal, 700); }
      }

      // 엔드포인트 미설정 → 데모 모드
      if (!FORM_ENDPOINT) {
        done(name.trim() + "님, 상담 신청이 접수되었습니다! 곧 연락드릴게요.", true);
        return;
      }

      // 실제 전송 (Google Apps Script)
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : "";
      sending = true;
      if (btn) { btn.disabled = true; btn.textContent = "전송 중…"; }

      var data = new URLSearchParams();
      data.append("name", name.trim());
      data.append("phone", phone.trim());
      data.append("region", (form.querySelector('[name="region"]') || {}).value || "");
      data.append("store", (form.querySelector('[name="store"]') || {}).value || "");
      data.append("message", (form.querySelector('[name="message"]') || {}).value || "");
      data.append("source", location.href);

      fetch(FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: data })
        .then(function () { done(name.trim() + "님, 상담 신청이 접수되었습니다! 곧 연락드릴게요.", true); })
        .catch(function () { done("전송에 실패했어요. 잠시 후 다시 시도하거나 010-5503-8979로 연락 주세요.", false); })
        .then(function () { sending = false; if (btn) { btn.disabled = false; btn.textContent = label; } });
    });
  });

  function focusField(form, n) {
    var el = form.querySelector('[name="' + n + '"]');
    if (el) el.focus();
  }

  /* ---------- 하단 고정 도크(마퀴+상담폼) 높이만큼 본문 여백 확보 ---------- */
  var heroDock = document.querySelector(".hero-dock");
  function syncDockSpace() {
    if (heroDock) document.body.style.paddingBottom = heroDock.offsetHeight + "px";
  }
  syncDockSpace();
  window.addEventListener("resize", syncDockSpace);
  window.addEventListener("load", syncDockSpace);

  /* ---------- Smooth anchor + close modal on in-page nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function () {
      if (modal.classList.contains("open")) closeModal();
    });
  });

  /* ---------- 헤더 투명(영상 위) ↔ 흰배경(스크롤) 전환 ---------- */
  var headerEl = document.querySelector(".header");
  var videoHeroEl = document.querySelector(".video-hero");
  function onScrollHeader() {
    var threshold = videoHeroEl ? (videoHeroEl.offsetHeight - headerEl.offsetHeight - 10) : 60;
    if (window.scrollY > threshold) headerEl.classList.add("scrolled");
    else headerEl.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  window.addEventListener("resize", onScrollHeader);
  onScrollHeader();

  /* ---------- 메인 영상 → 다음 섹션 스크롤 ---------- */
  var vhScroll = document.getElementById("vhScroll");
  if (vhScroll) {
    vhScroll.addEventListener("click", function () {
      var hero = document.querySelector(".hero");
      if (hero) window.scrollTo({ top: hero.getBoundingClientRect().top + window.scrollY - 60, behavior: "smooth" });
    });
  }

  /* ---------- 지점 매출 영수증 캐러셀 (가운데 선명 · 양옆 흐릿) ---------- */
  var proofTrack = document.getElementById("proofTrack");
  if (proofTrack) {
    var rcCards = proofTrack.querySelectorAll(".rc");
    var rcIdx = 0;
    var rcPrev = document.getElementById("proofPrev");
    var rcNext = document.getElementById("proofNext");
    var rcLayout = function () {
      if (!rcCards.length) return;
      var cw = rcCards[0].getBoundingClientRect().width;
      var gap = parseInt(getComputedStyle(proofTrack).gap) || 26;
      var vw = proofTrack.parentElement.getBoundingClientRect().width;
      var offset = vw / 2 - cw / 2 - rcIdx * (cw + gap);
      proofTrack.style.transform = "translateX(" + offset + "px)";
      rcCards.forEach(function (c, i) { c.classList.toggle("active", i === rcIdx); });
      if (rcPrev) rcPrev.style.visibility = rcIdx <= 0 ? "hidden" : "visible";
      if (rcNext) rcNext.style.visibility = rcIdx >= rcCards.length - 1 ? "hidden" : "visible";
    };
    if (rcNext) rcNext.addEventListener("click", function () { if (rcIdx < rcCards.length - 1) { rcIdx++; rcLayout(); } });
    if (rcPrev) rcPrev.addEventListener("click", function () { if (rcIdx > 0) { rcIdx--; rcLayout(); } });
    rcCards.forEach(function (c, i) { c.addEventListener("click", function () { if (i !== rcIdx) { rcIdx = i; rcLayout(); } }); });
    var rcRt;
    window.addEventListener("resize", function () { clearTimeout(rcRt); rcRt = setTimeout(rcLayout, 150); });
    rcLayout();
  }

  /* ---------- 가맹점주 인터뷰 (YouTube) ----------
     실제 유튜브 링크로 교체하려면 아래 url 값만 바꾸면 됩니다.
     전체 URL(https://youtu.be/xxxx, https://www.youtube.com/watch?v=xxxx) 또는
     영상 ID(11자) 그대로 넣어도 자동으로 썸네일·재생 처리됩니다. url 비우면 '준비 중'. */
  var INTERVIEWS = [
    { url: "", title: "오픈 2주 만에 업종변경으로 성공", sub: "월매출 9,300만 · 구래점 사장님" },
    { url: "", title: "직장 그만두고 1인 매장 운영", sub: "월매출 7,500만 · 운정점 사장님" },
    { url: "", title: "24시간 무인 운영의 힘", sub: "하루 6시간 근무 사장님" }
  ];

  function ytId(input) {
    if (!input) return null;
    var m = String(input).match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
    if (m) return m[1];
    if (/^[\w-]{11}$/.test(input)) return input;
    return null;
  }

  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var grid = document.getElementById("interviewGrid");
  if (grid) {
    INTERVIEWS.forEach(function (v) {
      var id = ytId(v.url);
      var card = document.createElement("div");
      card.className = "video-card";
      var thumb = id
        ? '<img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="' + v.title +
          '" loading="lazy" onerror="this.closest(\'.video-thumb\').classList.add(\'noimg\')">'
        : "";
      card.innerHTML =
        '<span class="video-badge">가맹점주 인터뷰</span>' +
        '<div class="video-thumb' + (id ? "" : " noimg") + '">' + thumb +
          '<span class="play">' + PLAY + "</span>" +
          '<div class="video-cap"><b>' + v.title + "</b><span>" + v.sub + "</span></div>" +
        "</div>";
      card.addEventListener("click", function () { openVideo(id); });
      grid.appendChild(card);
    });
  }

  var videoModal = document.getElementById("videoModal");
  var videoEmbed = document.getElementById("videoEmbed");
  function openVideo(id) {
    if (!id) { showToast("인터뷰 영상이 곧 공개됩니다!"); return; }
    videoEmbed.innerHTML =
      '<iframe src="https://www.youtube.com/embed/' + id +
      '?autoplay=1&rel=0" title="가맹점주 인터뷰" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>';
    videoModal.classList.add("open");
    videoModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeVideo() {
    videoModal.classList.remove("open");
    videoModal.setAttribute("aria-hidden", "true");
    videoEmbed.innerHTML = ""; // stop playback
    document.body.style.overflow = "";
  }
  if (videoModal) {
    videoModal.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-vclose")) closeVideo();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && videoModal.classList.contains("open")) closeVideo();
    });
  }

  /* ---------- 개인정보처리방침 모달 ---------- */
  var pp = document.getElementById("privacyModal");
  function openPP() { pp.classList.add("open"); pp.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
  function closePP() { pp.classList.remove("open"); pp.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
  document.querySelectorAll("[data-ppopen]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); openPP(); });
  });
  if (pp) {
    pp.addEventListener("click", function (e) { if (e.target.hasAttribute("data-ppclose")) closePP(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pp.classList.contains("open")) closePP(); });
  }

  /* ---------- Tabs (창업 비용 A형/B형) ---------- */
  var tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-tab");
      tabBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
      document.querySelectorAll(".tab-panel").forEach(function (p) {
        p.classList.toggle("active", p.getAttribute("data-panel") === key);
      });
    });
  });

  /* ---------- 배경 음악: 자동재생 시도 → 막히면 첫 인터랙션에 재생 → 무한 루프 + 토글 ---------- */
  (function () {
    var bgm = document.getElementById("bgm");
    var toggle = document.getElementById("bgmToggle");
    if (!bgm) return;
    bgm.volume = 0.45;
    var EVTS = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"];

    function sync() {
      var on = !bgm.paused;
      if (toggle) {
        toggle.classList.toggle("is-playing", on);
        toggle.setAttribute("aria-pressed", on ? "true" : "false");
      }
    }
    function tryPlay() {
      var p = bgm.play();
      if (p && p.catch) p.catch(function () { /* 자동재생 차단됨 → 인터랙션 대기 */ });
    }
    function onFirst() {
      if (bgm.paused) tryPlay();
      EVTS.forEach(function (ev) { window.removeEventListener(ev, onFirst); });
    }

    bgm.addEventListener("play", sync);
    bgm.addEventListener("pause", sync);

    tryPlay(); // 1) 로드 직후 시도
    EVTS.forEach(function (ev) { window.addEventListener(ev, onFirst, { passive: true }); }); // 2) 폴백

    // 3) 토글: 켜기/끄기
    if (toggle) {
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        if (bgm.paused) tryPlay(); else bgm.pause();
      });
    }
    sync();
  })();

  /* ---------- 가맹점주 인터뷰 — 3D 커버플로우 (좌우분할 카드 회전) + 자동순환 + 진행바 + 카운트업 ---------- */
  (function () {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".itv-tab"));
    var panels = Array.prototype.slice.call(document.querySelectorAll(".itv-panel"));
    var stage = document.querySelector(".itv-stage");
    var bar = document.getElementById("itvBar");
    if (!panels.length || !stage) return;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var n = panels.length;
    var current = 0, elapsed = 0, last = null;
    var DUR = 4600;

    function countUp(panel) {
      var el = panel && panel.querySelector(".itv-stat b");
      if (!el) return;
      var raw = el.getAttribute("data-val") || el.textContent;
      el.setAttribute("data-val", raw);
      var target = parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0;
      var suffix = raw.replace(/[0-9,]/g, "");
      if (reduce) { el.textContent = target.toLocaleString() + suffix; return; }
      var s0 = null, d = 900;
      function step(ts) {
        if (!s0) s0 = ts;
        var p = Math.min((ts - s0) / d, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function layout() {
      var w = panels[0].getBoundingClientRect().width || 600;
      var narrow = window.innerWidth < 760;
      var spread = narrow ? 0.52 : 0.6, angle = narrow ? 30 : 38, depth = narrow ? 160 : 230;
      panels.forEach(function (p, i) {
        var o = i - current;
        if (o > n / 2) o -= n;
        if (o < -n / 2) o += n;
        var a = Math.abs(o);
        var tx = o * w * spread;
        var tz = -a * depth;
        var ry = -o * angle;
        var sc = o === 0 ? 1 : 0.82;
        p.style.transform = "translate(-50%,-50%) translateX(" + tx + "px) translateZ(" + tz + "px) rotateY(" + ry + "deg) scale(" + sc + ")";
        p.style.opacity = a >= 2 ? "0" : (o === 0 ? "1" : "0.55");
        p.style.zIndex = String(100 - a);
        p.style.pointerEvents = a < 2 ? "auto" : "none";
        p.classList.toggle("is-active", o === 0);
        p.setAttribute("aria-hidden", o === 0 ? "false" : "true");
      });
    }

    function syncTabs() {
      var dp = panels[current].getAttribute("data-p");
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-b") === dp;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
    }

    function setCenter(idx) {
      current = (idx + n) % n;
      layout();
      syncTabs();
      countUp(panels[current]);
      elapsed = 0;
      if (bar) bar.style.width = "0%";
    }

    panels.forEach(function (p, i) {
      p.addEventListener("click", function () { if (i !== current) setCenter(i); });
    });
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        var dp = t.getAttribute("data-b");
        for (var k = 0; k < panels.length; k++) {
          if (panels[k].getAttribute("data-p") === dp) { setCenter(k); break; }
        }
      });
    });

    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 120); });

    function loop(ts) {
      if (last == null) last = ts;
      var dt = ts - last; last = ts;
      elapsed += dt;
      var p = Math.min(elapsed / DUR, 1);
      if (bar) bar.style.width = (p * 100).toFixed(1) + "%";
      if (p >= 1) { elapsed = 0; setCenter(current + 1); }
      requestAnimationFrame(loop);
    }

    layout();
    syncTabs();
    countUp(panels[0]);
    if (!reduce) requestAnimationFrame(loop);
  })();
})();
