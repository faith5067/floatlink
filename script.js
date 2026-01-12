 <script>
    // Application state
    let isSubscriber = false;
    let activeOfferId = null;
    let dealTimerInterval = null;
    let remainingMs = 0;

    // Enhanced mock data with user statistics
    const offers = [
      {
        id: "1",
        username: "agent_kilimanjaro",
        legalName: "Abel K.",
        from: "M-Pesa",
        to: "Airtel",
        amount: 250000,
        createdAt: Date.now() - 5 * 60 * 1000,
        verified: true,
        trustBand: "Gold",
        status: "OPEN",
        lockExpiresAt: null,
        userStats: {
          completionRate: 96,
          totalOrders: 247,
          feedbackScore: 4.8
        }
      },
      {
        id: "2",
        username: "arusha_float",
        legalName: "Maria R.",
        from: "Airtel",
        to: "M-Pesa",
   amount: 750000,
        createdAt: Date.now() - 15 * 60 * 1000,
        verified: true,
        trustBand: "Silver",
        status: "OPEN",
        lockExpiresAt: null,
        userStats: {
          completionRate: 89,
          totalOrders: 132,
          feedbackScore: 4.6
        }
      },
      {
        id: "3",
        username: "mbeya_liquidity",
        legalName: "John M.",
        from: "Tigo",
        to: "M-Pesa",
        amount: 1250000,
        createdAt: Date.now() - 36 * 60 * 1000,
        verified: false,
        trustBand: "Bronze",
        status: "OPEN",
        lockExpiresAt: null,
        userStats: {
          completionRate: 78,
          totalOrders: 45,
          feedbackScore: 4.2
        }
      },
    ];

    const providers = [
      {
        username: "arusha_pro",
        trust: "Gold",
        completion: 96,
        networks: ["M-Pesa", "Airtel", "Tigo"],
        region: "Arusha",
        userStats: {
          completionRate: 96,
          totalOrders: 312,
          feedbackScore: 4.9
        }
      },
      {
        username: "tz_liquidity",
        trust: "Silver",
        completion: 89,
        networks: ["M-Pesa", "Tigo"],
        region: "Dar es Salaam",
        userStats: {
     completionRate: 89,
          totalOrders: 187,
          feedbackScore: 4.7
        }
      },
      {
        username: "coastal_float",
        trust: "Gold",
        completion: 98,
        networks: ["M-Pesa", "Airtel", "Halopesa"],
        region: "Mombasa Road",
        userStats: {
          completionRate: 98,
          totalOrders: 421,
          feedbackScore: 4.9
        }
      },
    ];

    const balances = {
      cash: 1250000,
      mpesa: 2000000,
      airtel: 800000,
      tigo: 600000,
      halopesa: 400000,
      crdb: 5000000,
      nmb: 4800000,
      bank: 0,
      floatWorking: 3400000,
      reserve: 0,
    };

    const officeActions = [];
    const reserveActions = [];
    const activities = [];
    let chatMessages = [];
    let subscriberReceived = false;

    // Recent activities history - separated by section
    const recentActivities = {
      offers: [
        {
          id: "1",
          type: "OFFER_POSTED",
          description: "Posted float offer",
          details: "M-Pesa → Airtel • TZS 250,000",
          amount: 0,
          time: Date.now() - 5 * 60 * 1000,
          user: "agent_kilimanjaro"
        },
        {
          id: "2",
  type: "OFFER_COMPLETED",
          description: "Completed float exchange",
          details: "Airtel → M-Pesa • TZS 150,000",
          amount: 150000,
          time: Date.now() - 25 * 60 * 1000,
          user: "you_subscriber"
        },
        {
          id: "3",
          type: "OFFER_PICKED",
          description: "Picked float offer",
          details: "Tigo → M-Pesa • TZS 1,250,000",
          amount: 0,
          time: Date.now() - 85 * 60 * 1000,
          user: "you_subscriber"
        }
      ],
      providers: [
        {
          id: "1",
          type: "PROVIDER_VIEWED",
          description: "Viewed provider profile",
          details: "@arusha_pro • Gold Trust",
          amount: 0,
          time: Date.now() - 15 * 60 * 1000,
          user: "you"
        },
        {
          id: "2",
          type: "PROVIDER_CONTACTED",
          description: "Contacted provider",
          details: "@tz_liquidity • Silver Trust",
          amount: 0,
          time: Date.now() - 45 * 60 * 1000,
          user: "you"
        },
        {
          id: "3",
          type: "PROVIDER_RATED",
          description: "Rated provider",
          details: "@coastal_float • 5 stars",
          amount: 0,
          time: Date.now() - 120 * 60 * 1000,
          user: "you"
        }
      ],
      reconcile: [
        {
          id: "1",
          type: "CASH_DEPOSIT",
          description: "Cash deposit",
          details: "Office cash • TZS 500,000",
    amount: 500000,
          time: Date.now() - 45 * 60 * 1000,
          user: "you"
        },
        {
          id: "2",
          type: "FLOAT_MOVEMENT",
          description: "Float to reserve",
          details: "M-Pesa • TZS 300,000",
          amount: -300000,
          time: Date.now() - 65 * 60 * 1000,
          user: "you"
        },
        {
          id: "3",
          type: "OFFICE_ACTIVITY",
          description: "Bill payment processed",
          details: "Airtel • TZS 75,000",
          amount: -75000,
          time: Date.now() - 90 * 60 * 1000,
          user: "you"
        }
      ]
    };

    // Utility functions
    function fmtTZS(n) {
      return "TZS " + Number(n).toLocaleString();
    }

    function renderStars(score) {
      const fullStars = Math.floor(score);
      const hasHalfStar = score % 1 >= 0.5;
      let stars = '';
      
      for (let i = 0; i < fullStars; i++) {
        stars += '★';
      }
      
      if (hasHalfStar) {
        stars += '☆';
      }
      
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
      for (let i = 0; i < emptyStars; i++) {
        stars += '☆';
      }
      
      return stars;
    }

      function showToast(msg) {
      const toast = document.getElementById("toast");
      toast.textContent = msg;
      toast.classList.remove("hidden");
      clearTimeout(showToast._timer);
      showToast._timer = setTimeout(() => {
        toast.classList.add("hidden");
      }, 2500);
    }

    function setActiveSection(sectionId) {
      const sections = [
        "section-offers",
        "section-providers",
        "section-reconcile",
      ];
      sections.forEach((id) => {
        document.getElementById(id).classList.add("hidden");
      });
      document.getElementById(sectionId).classList.remove("hidden");

      const navs = ["nav-offers", "nav-providers", "nav-reconcile"];
      navs.forEach((id) => {
        document.getElementById(id).classList.remove("active");
      });
      if (sectionId === "section-offers") {
        document.getElementById("nav-offers").classList.add("active");
        renderRecentActivities('offers');
      } else if (sectionId === "section-providers") {
        document.getElementById("nav-providers").classList.add("active");
        renderRecentActivities('providers');
      } else {
        document.getElementById("nav-reconcile").classList.add("active");
        renderRecentActivities('reconcile');
      }
    }

    // Recent Activities Functions
    function addRecentActivity(section, activity) {
      recentActivities[section].unshift(activity);
      if (recentActivities[section].length > 5) {
        recentActivities[section].pop();
      }
      renderRecentActivities(section);
    }

    function renderRecentActivities(section) {
      const containerId = ${section}-activities-list;
      const container = document.getElementById(containerId);
      if (!container) return;

    container.innerHTML = "";

      const activities = recentActivities[section];
      if (!activities.length) {
        container.innerHTML = '<div class="hint-text">No recent activities</div>';
        return;
      }

      activities.forEach((activity) => {
        const activityEl = document.createElement("div");
        activityEl.className = "activity-item";
        
        let amountClass = "activity-neutral";
        if (activity.amount > 0) {
          amountClass = "activity-positive";
        } else if (activity.amount < 0) {
          amountClass = "activity-negative";
        }

        activityEl.innerHTML = `
          <div class="activity-info">
            <div class="activity-type">${activity.description}</div>
            <div class="activity-details">${activity.details}</div>
            <div class="activity-time">${new Date(activity.time).toLocaleString()} • ${activity.user}</div>
          </div>
          <div class="activity-amount ${amountClass}">
            ${activity.amount !== 0 ? fmtTZS(Math.abs(activity.amount)) : '—'}
          </div>
        `;
        container.appendChild(activityEl);
      });
    }

    // Offers section
    function renderOffers() {
      const container = document.getElementById("offers-list");
      container.innerHTML = "";

      if (!offers.length) {
        container.innerHTML = '<div class="hint-text">No offers yet.</div>';
        return;
      }

      offers.forEach((o) => {
        const card = document.createElement("div");
        card.className = "subcard";
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
            <div style="flex:1;">
  <div style="font-size:0.85rem;">
                @${o.username}
                <span style="margin-left:6px;font-size:0.65rem;padding:2px 6px;border-radius:999px;border:1px solid rgba(148,163,184,0.8);background:rgba(15,23,42,0.8);">
                  ${o.trustBand}
                </span>
              </div>
              <div style="font-size:0.95rem;margin-top:2px;">
                ${o.from} → ${o.to}
              </div>
              <div style="font-size:0.78rem;color:#9ca3af;margin-top:2px;">
                ${fmtTZS(o.amount)} •
                ${new Date(o.createdAt).toLocaleTimeString()} •
                ${o.verified ? "Verified ✅" : "Unverified"}
              </div>
              
              <!-- User Stats -->
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">${o.userStats.completionRate}%</div>
                  <div class="stat-label">Completion</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${o.userStats.totalOrders}</div>
                  <div class="stat-label">Orders</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${o.userStats.feedbackScore}</div>
                  <div class="stat-label">Rating</div>
                  <div class="stars">${renderStars(o.userStats.feedbackScore)}</div>
                </div>
              </div>
            </div>
            <div>
              ${
                o.status === "OPEN"
                  ? isSubscriber
                    ? <button data-offer-id="${o.id}" class="btn-primary btn-pick-offer">Pick &amp; Serve</button>
                    : '<span class="hint-text">Subscribers only</span>'
                  : <span class="hint-text" style="font-size:0.7rem;">${o.status}</span>
              }
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      container.querySelectorAll(".btn-pick-offer").forEach((btn) => {
        btn.addEventListener("click", () =>
          pickOffer(btn.getAttribute("data-offer-id"))
        );
     });
    }

    function setupPostOfferForm() {
      const form = document.getElementById("post-offer-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const from = document.getElementById("post-from").value;
        const to = document.getElementById("post-to").value;
        const amountStr = document
          .getElementById("post-amount")
          .value.replace(/[^0-9]/g, "");
        const amount = parseInt(amountStr || "0", 10);

        if (!amount || amount <= 0) {
          alert("Enter a valid amount");
          return;
        }

        const offer = {
          id: String(Date.now()),
          username: "you_username",
          legalName: "Your Legal Name",
          from,
          to,
          amount,
          createdAt: Date.now(),
          verified: true,
          trustBand: "Gold",
          status: "OPEN",
          lockExpiresAt: null,
          userStats: {
            completionRate: 95,
            totalOrders: 156,
            feedbackScore: 4.8
          }
        };

        offers.unshift(offer);
        renderOffers();

        // Add to recent activities
        addRecentActivity('offers', {
          id: String(Date.now()),
          type: "OFFER_POSTED",
          description: "Posted float offer",
          details: ${from} → ${to} • ${fmtTZS(amount)},
          amount: 0,
     time: Date.now(),
          user: "you_username"
        });

        document.getElementById("post-from").value = "M-Pesa";
        document.getElementById("post-to").value = "Airtel";
        document.getElementById("post-amount").value = "";
        showToast("Offer submitted");
      });
    }

    function pickOffer(offerId) {
      const offer = offers.find((o) => o.id === offerId);
      if (!offer || offer.status !== "OPEN" || !isSubscriber) return;

      offer.status = "LOCKED";
      offer.lockExpiresAt = Date.now() + 15 * 60 * 1000;
      activeOfferId = offer.id;
      subscriberReceived = false;

      // Add to recent activities
      addRecentActivity('offers', {
        id: String(Date.now()),
        type: "OFFER_PICKED",
        description: "Picked float offer",
        details: ${offer.from} → ${offer.to} • ${fmtTZS(offer.amount)},
        amount: 0,
        time: Date.now(),
        user: "you_subscriber"
      });

      chatMessages = [
        {
          sender: "subscriber",
          text: "Hi, I picked your offer. I will receive float first per policy.",
          ts: Date.now(),
        },
        {
          sender: "poster",
          text: "Okay, sending now. Kindly confirm once received.",
          ts: Date.now() + 1500,
        },
      ];

      openDealRoom();
      renderOffers();
    }

    // Deal room functions
    function openDealRoom() {
      const modal = document.getElementById("deal-room");
   modal.classList.remove("hidden");

      const offer = offers.find((o) => o.id === activeOfferId);
      if (!offer) return;

      document.getElementById("deal-poster-username").textContent = @${offer.username};
      document.getElementById("deal-poster-legal").textContent = offer.legalName;
      document.getElementById("deal-route").textContent = ${offer.from} → ${offer.to};
      document.getElementById("deal-amount").textContent = fmtTZS(offer.amount);

      document.getElementById("btn-mark-received").classList.remove("disabled");
      const btnPaid = document.getElementById("btn-mark-paid");
      btnPaid.classList.add("disabled");

      renderChat();
      startTimer();
    }

    function closeDeal() {
      const modal = document.getElementById("deal-room");
      modal.classList.add("hidden");
      activeOfferId = null;
      subscriberReceived = false;
      chatMessages = [];
      stopTimer();
    }

    function renderChat() {
      const list = document.getElementById("chat-list");
      list.innerHTML = "";

      if (!chatMessages.length) {
        list.innerHTML = '<div class="hint-text">No messages yet.</div>';
        return;
      }

      chatMessages.forEach((m) => {
        const div = document.createElement("div");
        div.className = chat-bubble ${m.sender};
        div.innerHTML = `
          <div class="chat-meta">${m.sender === "subscriber" ? "Subscriber" : "Poster"}</div>
          <div>${m.text}</div>
        `;
        list.appendChild(div);
      });

      list.scrollTop = list.scrollHeight;
    }

    function addChatMessage(sender, text) {
    if (!text.trim()) return;
      chatMessages.push({
        sender,
        text: text.trim(),
        ts: Date.now(),
      });
      renderChat();
    }

    function markSubscriberReceived() {
      if (!activeOfferId) return;
      if (subscriberReceived) return;
      subscriberReceived = true;
      addChatMessage("subscriber", "Float received ✅ — proof uploaded.");
      document.getElementById("btn-mark-paid").classList.remove("disabled");
    }

    function markPosterPaid() {
      if (!activeOfferId || !subscriberReceived) return;
      addChatMessage("poster", "Payment sent ✅ — proof uploaded.");
      const offer = offers.find((o) => o.id === activeOfferId);
      if (offer) {
        offer.status = "COMPLETED";
        
        // Add to recent activities
        addRecentActivity('offers', {
          id: String(Date.now()),
          type: "OFFER_COMPLETED",
          description: "Completed float exchange",
          details: ${offer.from} → ${offer.to} • ${fmtTZS(offer.amount)},
          amount: offer.amount,
          time: Date.now(),
          user: "you_subscriber"
        });
      }
      renderOffers();
      setTimeout(closeDeal, 800);
    }

    function startTimer() {
      const offer = offers.find((o) => o.id === activeOfferId);
      if (!offer || !offer.lockExpiresAt) return;
      remainingMs = Math.max(0, offer.lockExpiresAt - Date.now());
      updateTimerDisplay();
      stopTimer();
      dealTimerInterval = setInterval(() => {
        const currentOffer = offers.find((o) => o.id === activeOfferId);
        if (!currentOffer) {
          stopTimer();
          return;
        }
    remainingMs = Math.max(0, currentOffer.lockExpiresAt - Date.now());
        updateTimerDisplay();
        if (remainingMs <= 0) {
          currentOffer.status = "EXPIRED";
          renderOffers();
          closeDeal();
        }
      }, 1000);
    }

    function stopTimer() {
      if (dealTimerInterval) {
        clearInterval(dealTimerInterval);
        dealTimerInterval = null;
      }
    }

    function updateTimerDisplay() {
      const textEl = document.getElementById("timer-text");
      if (!textEl) return;
      const totalSec = Math.floor(remainingMs / 1000);
      const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
      const ss = String(totalSec % 60).padStart(2, "0");
      textEl.textContent = ${mm}:${ss};
    }

    // Providers section
    function renderProviders() {
      const publicCheckbox = document.getElementById("providers-public");
      const list = document.getElementById("providers-list");
      const hiddenText = document.getElementById("providers-hidden-text");

      list.innerHTML = "";
      if (!publicCheckbox.checked) {
        hiddenText.classList.remove("hidden");
        return;
      }
      hiddenText.classList.add("hidden");

      providers.forEach((p) => {
        const card = document.createElement("div");
        card.className = "subcard";
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
            <div style="flex:1;">
              <div style="font-size:0.85rem;">
                @${p.username}
                <span style="margin-left:6px;font-size:0.65rem;padding:2px 6px;border-radius:999px;border:1px solid rgba(148,163,184,0.8);background:rgba(15,23,42,0.9);">
                  ${p.trust}
        </span>
              </div>
              <div style="font-size:0.75rem;color:#9ca3af;margin-top:2px;">
                Networks: ${p.networks.join(", ")}
              </div>
              <div style="font-size:0.75rem;color:#9ca3af;">
                Region: ${p.region || "—"}
              </div>
              
              <!-- User Stats -->
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">${p.userStats.completionRate}%</div>
                  <div class="stat-label">Completion</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${p.userStats.totalOrders}</div>
                  <div class="stat-label">Orders</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${p.userStats.feedbackScore}</div>
                  <div class="stat-label">Rating</div>
                  <div class="stars">${renderStars(p.userStats.feedbackScore)}</div>
                </div>
              </div>
              
              <!-- Progress Bar -->
              <div style="margin-top:8px;">
                <div style="display:flex;justify-content:space-between;font-size:0.7rem;">
                  <span>Completion Rate</span>
                  <span>${p.completion}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${p.completion}%"></div>
                </div>
              </div>
            </div>
            <button class="btn-secondary" style="font-size:0.7rem;">Profile</button>
          </div>
        `;
        list.appendChild(card);
      });

      // Add click handlers for provider buttons
      list.querySelectorAll('.btn-secondary').forEach((btn, index) => {
        btn.addEventListener('click', () => {
          const provider = providers[index];
          addRecentActivity('providers', {
            id: String(Date.now()),
            type: "PROVIDER_VIEWED",
            description: "Viewed provider profile",
     details: @${provider.username} • ${provider.trust} Trust,
            amount: 0,
            time: Date.now(),
            user: "you"
          });
          showToast(Viewing ${provider.username}'s profile);
        });
      });
    }

    // Reconcile section
    function recomputeTotalCapital() {
      return (
        balances.cash +
        balances.mpesa +
        balances.airtel +
        balances.tigo +
        balances.halopesa +
        balances.crdb +
        balances.nmb +
        balances.bank +
        balances.floatWorking +
        balances.reserve
      );
    }

    function renderReconcileKpis() {
      document.getElementById("kpi-cash").textContent = fmtTZS(balances.cash);
      document.getElementById("kpi-mpesa").textContent = fmtTZS(balances.mpesa);
      document.getElementById("kpi-airtel").textContent = fmtTZS(balances.airtel);
      document.getElementById("kpi-tigo-halo").textContent = fmtTZS(
        balances.tigo + balances.halopesa
      );
      document.getElementById("kpi-crdb").textContent = fmtTZS(balances.crdb);
      document.getElementById("kpi-nmb").textContent = fmtTZS(balances.nmb);
      document.getElementById("kpi-bank").textContent = fmtTZS(balances.bank);
      document.getElementById("kpi-working-float").textContent = fmtTZS(
        balances.floatWorking
      );
      document.getElementById("total-capital").textContent = fmtTZS(
        recomputeTotalCapital()
      );
    }

    function setupOfficeMoveForm() {
      const form = document.getElementById("office-move-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const channel = document.getElementById("om-channel").value;
        const direction = document.getElementById("om-direction").value;
        const amountStr = document
          .getElementById("om-amount")
         .value.replace(/[^0-9]/g, "");
        const amount = parseInt(amountStr || "0", 10);
        const note = document.getElementById("om-note").value.trim();

        if (!amount || amount <= 0) {
          alert("Enter amount");
          return;
        }
        if (!note) {
          alert("Note required");
          return;
        }

        let field = "cash";
        switch (channel) {
          case "Cash":
            field = "cash";
            break;
          case "M-Pesa":
            field = "mpesa";
            break;
          case "Airtel":
            field = "airtel";
            break;
          case "Tigo":
            field = "tigo";
            break;
          case "Halopesa":
            field = "halopesa";
            break;
          case "CRDB":
            field = "crdb";
            break;
          case "NMB":
            field = "nmb";
            break;
          case "Other Bank":
            field = "bank";
            break;
        }

        if (direction === "OUT" && amount > balances[field]) {
          alert("Amount exceeds channel balance");
          return;
        }

        balances[field] += direction === "IN" ? amount : -amount;
        officeActions.unshift({
          time: Date.now(),
          channel,
          direction,
      amount,
          note,
        });
        if (officeActions.length > 10) officeActions.pop();

        // Add to recent activities
        addRecentActivity('reconcile', {
          id: String(Date.now()),
          type: direction === "IN" ? "CASH_DEPOSIT" : "CASH_WITHDRAWAL",
          description: direction === "IN" ? "Cash deposit" : "Cash withdrawal",
          details: ${channel} • ${fmtTZS(amount)},
          amount: direction === "IN" ? amount : -amount,
          time: Date.now(),
          user: "you"
        });

        document.getElementById("om-amount").value = "";
        document.getElementById("om-note").value = "";

        renderReconcileKpis();
        renderOfficeActions();
        showToast(
          `${direction === "IN" ? "Added" : "Removed"} ${fmtTZS(
            amount
          )} on ${channel}`
        );
      });
    }

    function renderOfficeActions() {
      const list = document.getElementById("office-actions-list");
      list.innerHTML = "";
      if (!officeActions.length) {
        list.innerHTML = '<div class="hint-text">No movements yet.</div>';
        return;
      }
      officeActions.forEach((a) => {
        const row = document.createElement("div");
        row.className = "scroll-row";
        row.innerHTML = `
          <div>
            <div>${a.direction === "IN" ? "+" : "-"} ${a.channel}</div>
            <div class="hint-text" style="font-size:0.7rem;">
              ${new Date(a.time).toLocaleString()} • ${a.note}
            </div>
          </div>
          <div>${fmtTZS(a.amount)}</div>
        `;
        list.appendChild(row);
      });
    }

    function setupCircForm() {
      const form = document.getElementById("circ-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const network = document.getElementById("circ-network").value;
        const dir = document.getElementById("circ-dir").value;
        const amountStr = document
          .getElementById("circ-amount")
          .value.replace(/[^0-9]/g, "");
        const amount = parseInt(amountStr || "0", 10);
        const note = document.getElementById("circ-note").value.trim();

        if (!amount || amount <= 0) {
          alert("Enter amount");
          return;
        }
        if (!note) {
          alert("Note required");
          return;
        }

        if (dir === "TO_RESERVE") {
          if (amount > balances.floatWorking) {
            alert("Amount exceeds working float");
            return;
          }
          balances.floatWorking -= amount;
          balances.reserve += amount;
          showToast(Moved ${fmtTZS(amount)} ${network} to Reserve);
        } else {
          if (amount > balances.reserve) {
            alert("Amount exceeds reserve");
            return;
          }
          balances.floatWorking += amount;
          balances.reserve -= amount;
          showToast(Returned ${fmtTZS(amount)} ${network} from Reserve);
        }

        reserveActions.unshift({
          time: Date.now(),
          network,
          dir,
          amount,
          note,
        });
        if (reserveActions.length > 10) reserveActions.pop();

        // Add to recent activities
        addRecentActivity('reconcile', {
          id: String(Date.now()),
   type: "FLOAT_MOVEMENT",
          description: dir === "TO_RESERVE" ? "Float to reserve" : "Float from reserve",
          details: ${network} • ${fmtTZS(amount)},
          amount: dir === "TO_RESERVE" ? -amount : amount,
          time: Date.now(),
          user: "you"
        });

        document.getElementById("circ-amount").value = "";
        document.getElementById("circ-note").value = "";

        renderReconcileKpis();
        renderReserveActions();
      });
    }

    function renderReserveActions() {
      const list = document.getElementById("reserve-actions-list");
      list.innerHTML = "";
      if (!reserveActions.length) {
        list.innerHTML = '<div class="hint-text">No actions yet.</div>';
        return;
      }
      reserveActions.forEach((a) => {
        const row = document.createElement("div");
        row.className = "scroll-row";
        row.innerHTML = `
          <div>
            <div>
              ${a.dir === "TO_RESERVE" ? "→ To Reserve" : "← From Reserve"} • ${
          a.network
        }
            </div>
            <div class="hint-text" style="font-size:0.7rem;">
              ${new Date(a.time).toLocaleString()} • ${a.note}
            </div>
          </div>
          <div>${fmtTZS(a.amount)}</div>
        `;
        list.appendChild(row);
      });
    }

    function setupActivityForm() {
      const form = document.getElementById("activity-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const category = document.getElementById("act-category").value;
        const channel = document.getElementById("act-channel").value;
        const amountStr = document
          .getElementById("act-amount")
          .value.replace(/[^0-9]/g, "");
   const amount = parseInt(amountStr || "0", 10);
        const staff = document.getElementById("act-staff").value.trim() || "—";
        const reference =
          document.getElementById("act-ref").value.trim() || "—";
        const description =
          document.getElementById("act-desc").value.trim();

        if (!amount || amount <= 0) {
          alert("Enter amount");
          return;
        }
        if (!description) {
          alert("Description required");
          return;
        }

        activities.unshift({
          time: Date.now(),
          category,
          channel,
          amount,
          staff,
          reference,
          description,
        });
        if (activities.length > 15) activities.pop();

        // Add to recent activities
        addRecentActivity('reconcile', {
          id: String(Date.now()),
          type: "OFFICE_ACTIVITY",
          description: category,
          details: ${channel} • ${fmtTZS(amount)} • ${description},
          amount: amount,
          time: Date.now(),
          user: "you"
        });

        document.getElementById("act-amount").value = "";
        document.getElementById("act-staff").value = "";
        document.getElementById("act-ref").value = "";
        document.getElementById("act-desc").value = "";

        renderActivities();
        showToast("Daily office activity saved");
      });
    }

    function renderActivities() {
      const list = document.getElementById("activities-list");
      list.innerHTML = "";
   if (!activities.length) {
        list.innerHTML = '<div class="hint-text">No activities captured yet.</div>';
        return;
      }
      activities.forEach((a) => {
        const row = document.createElement("div");
        row.className = "scroll-row";
        row.innerHTML = `
          <div>
            <div>${a.category} • ${a.channel}</div>
            <div class="hint-text" style="font-size:0.65rem;">
              ${new Date(a.time).toLocaleString()} • Staff: ${a.staff} • Ref: ${
          a.reference
        }
            </div>
            <div style="font-size:0.78rem;margin-top:2px;">${
              a.description
            }</div>
          </div>
          <div>${fmtTZS(a.amount)}</div>
        `;
        list.appendChild(row);
      });
    }

    // Initialize the application
    window.addEventListener("DOMContentLoaded", () => {
      document.getElementById("nav-offers").addEventListener("click", () =>
        setActiveSection("section-offers")
      );
      document.getElementById("nav-providers").addEventListener("click", () =>
        setActiveSection("section-providers")
      );
      document.getElementById("nav-reconcile").addEventListener("click", () =>
        setActiveSection("section-reconcile")
      );

      const subCheckbox = document.getElementById("subscriber-checkbox");
      subCheckbox.addEventListener("change", () => {
        isSubscriber = subCheckbox.checked;
        renderOffers();
      });

      setupPostOfferForm();
      renderOffers();

      document.getElementById("providers-public").addEventListener("change", renderProviders);
      renderProviders();

      renderReconcileKpis();
      setupOfficeMoveForm();
    setupCircForm();
      setupActivityForm();
      renderOfficeActions();
      renderReserveActions();
      renderActivities();
      
      // Render initial recent activities for offers section
      renderRecentActivities('offers');

      document.getElementById("btn-close-deal").addEventListener("click", closeDeal);
      document.getElementById("btn-mark-received").addEventListener("click", () => markSubscriberReceived());
      document.getElementById("btn-mark-paid").addEventListener("click", () => markPosterPaid());
      document.getElementById("chat-send-btn").addEventListener("click", () => {
        const input = document.getElementById("chat-input");
        addChatMessage("subscriber", input.value);
        input.value = "";
      });
      document.getElementById("chat-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const input = document.getElementById("chat-input");
          addChatMessage("subscriber", input.value);
          input.value = "";
        }
      });
    });
  </script>

