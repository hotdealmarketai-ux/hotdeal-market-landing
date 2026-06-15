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

  floatBtn.addEventListener("click", openModal);
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

  /* ---------- Smooth anchor + close modal on in-page nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function () {
      if (modal.classList.contains("open")) closeModal();
    });
  });

  /* ---------- 메인 영상 → 다음 섹션 스크롤 ---------- */
  var vhScroll = document.getElementById("vhScroll");
  if (vhScroll) {
    vhScroll.addEventListener("click", function () {
      var hero = document.querySelector(".hero");
      if (hero) window.scrollTo({ top: hero.getBoundingClientRect().top + window.scrollY - 60, behavior: "smooth" });
    });
  }

  /* ---------- 지점 매출 메모 슬라이더 (transform) ---------- */
  var proofTrack = document.getElementById("proofTrack");
  if (proofTrack) {
    var memos = proofTrack.querySelectorAll(".memo");
    var idx = 0;
    var metrics = function () {
      var c = proofTrack.querySelector(".memo");
      var gap = parseInt(getComputedStyle(proofTrack).gap) || 20;
      var cw = c ? c.getBoundingClientRect().width : 320;
      var view = proofTrack.parentElement.getBoundingClientRect().width;
      var visible = Math.max(1, Math.round((view + gap) / (cw + gap)));
      var maxIdx = Math.max(0, memos.length - visible);
      return { step: cw + gap, maxIdx: maxIdx };
    };
    var apply = function () {
      var m = metrics();
      if (idx > m.maxIdx) idx = m.maxIdx;
      if (idx < 0) idx = 0;
      proofTrack.style.transform = "translateX(" + (-idx * m.step) + "px)";
      if (pp) pp.style.visibility = idx <= 0 ? "hidden" : "visible";
      if (pn) pn.style.visibility = idx >= m.maxIdx ? "hidden" : "visible";
    };
    var pn = document.getElementById("proofNext");
    var pp = document.getElementById("proofPrev");
    if (pn) pn.addEventListener("click", function () { idx += 1; apply(); });
    if (pp) pp.addEventListener("click", function () { idx -= 1; apply(); });
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(apply, 150); });
    apply();
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
})();
