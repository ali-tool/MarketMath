(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const num = (id) => Math.max(0, Number.parseFloat($(id)?.value) || 0);
  const money = (n) => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD"}).format(Number.isFinite(n) ? n : 0);
  const integer = (n) => new Intl.NumberFormat("en-US", {maximumFractionDigits:0}).format(n);
  const setText = (id, text) => { if ($(id)) $(id).textContent = text; };
  const bind = (ids, fn) => ids.forEach(id => $(id)?.addEventListener("input", fn));
  const copyText = async (text, messageId) => {
    try { await navigator.clipboard.writeText(text); setText(messageId, "Copied. You can paste this summary into your notes."); }
    catch { setText(messageId, text); }
  };
  const currentYear = $("year"); if (currentYear) currentYear.textContent = new Date().getFullYear();

  function eventCalc() {
    const booth = num("boothFee"), travel = num("travel"), other = num("otherCosts");
    const avg = num("orderValue"), cost = num("productCost"), fee = Math.min(100, num("paymentFee")) / 100;
    const goal = num("profitGoal"), fixed = booth + travel + other;
    const contribution = avg * (1 - fee) - cost;
    const be = contribution > 0 ? Math.ceil(fixed / contribution) : Infinity;
    const goalOrders = contribution > 0 ? Math.ceil((fixed + goal) / contribution) : Infinity;
    setText("eventCosts", money(fixed));
    setText("contribution", money(contribution));
    setText("breakEven", Number.isFinite(be) ? `${integer(be)} orders` : "Not available");
    setText("breakEvenHint", contribution > 0 ? "Covers your estimated event costs." : "Adjust your order value, product cost, or fee.");
    setText("goalOrders", Number.isFinite(goalOrders) ? `${integer(goalOrders)} orders` : "Not available");
    setText("goalRevenue", Number.isFinite(goalOrders) ? money(goalOrders * avg) : "—");
    const progress = Number.isFinite(goalOrders) && goalOrders > 0 ? Math.min(100, Math.max(0, (be / goalOrders) * 100)) : 0;
    if ($("goalProgress")) $("goalProgress").style.width = `${progress}%`;
    return {booth, travel, other, avg, cost, fee, goal, fixed, contribution, be, goalOrders};
  }
  const eventIds = ["boothFee","travel","otherCosts","orderValue","productCost","paymentFee","profitGoal"];
  if ($("event-form")) {
    bind(eventIds, eventCalc); eventCalc();
    $("reset-event")?.addEventListener("click", () => {
      const defaults = {boothFee:85,travel:25,otherCosts:15,orderValue:24,productCost:8,paymentFee:3,profitGoal:240};
      Object.entries(defaults).forEach(([id,value]) => $(id).value = value); eventCalc();
      setText("save-message", "Sample values restored.");
    });
    $("save-plan")?.addEventListener("click", () => {
      const result = eventCalc();
      try { localStorage.setItem("marketmath-event-plan", JSON.stringify({...result, savedAt:new Date().toISOString()})); setText("save-message","Plan saved on this device. It will remain in this browser until cleared."); }
      catch { setText("save-message","This browser did not allow local storage. You can copy the summary instead."); }
    });
    $("copy-plan")?.addEventListener("click", () => {
      const r = eventCalc();
      copyText(`MarketMath event plan\nFixed costs: ${money(r.fixed)}\nContribution per order: ${money(r.contribution)}\nBreak-even: ${Number.isFinite(r.be)?integer(r.be)+" orders":"not available"}\nProfit goal: ${money(r.goal)}\nOrders for goal: ${Number.isFinite(r.goalOrders)?integer(r.goalOrders)+" orders":"not available"}\nRevenue at goal: ${Number.isFinite(r.goalOrders)?money(r.goalOrders*r.avg):"not available"}`, "save-message");
    });
  }

  function pricingCalc() {
    const materials = num("pMaterials"), packaging = num("pPackaging"), minutes = num("pMinutes"), hourly = num("pHourly");
    const overhead = num("pOverhead"), fees = Math.min(99, num("pFees")) / 100, margin = Math.min(90, num("pMargin")) / 100;
    const labor = minutes / 60 * hourly, cost = materials + packaging + labor + overhead;
    const divisor = 1 - fees - margin, price = divisor > 0 ? cost / divisor : NaN;
    const profit = Number.isFinite(price) ? price * (1-fees) - cost : NaN;
    setText("pMatTotal", money(materials + packaging)); setText("pLabor", money(labor)); setText("pCost", money(cost));
    setText("pPrice", Number.isFinite(price) ? money(price) : "Adjust margin/fees");
    setText("pProfit", Number.isFinite(profit) ? money(profit) : "—");
    return {materials,packaging,minutes,hourly,overhead,fees,margin,labor,cost,price,profit};
  }
  const pIds = ["pMaterials","pPackaging","pMinutes","pHourly","pOverhead","pFees","pMargin"];
  if ($("pricing-form")) {
    bind(pIds, pricingCalc); pricingCalc();
    $("copy-price")?.addEventListener("click", () => { const r=pricingCalc(); copyText(`MarketMath product pricing estimate\nMaterials + packaging: ${money(r.materials+r.packaging)}\nLabor: ${money(r.labor)}\nTotal cost: ${money(r.cost)}\nTarget margin: ${(r.margin*100).toFixed(1)}%\nSelling fee: ${(r.fees*100).toFixed(1)}%\nSuggested price: ${Number.isFinite(r.price)?money(r.price):"not available"}\nEstimated profit: ${Number.isFinite(r.profit)?money(r.profit):"not available"}`, "pricing-message"); });
  }

  function breakCalc() {
    const fixed = num("bBooth") + num("bTravel") + num("bOther");
    const avg = num("bOrder"), cost = num("bProduct"), fee = Math.min(100,num("bFee"))/100;
    const contribution = avg * (1-fee) - cost, orders = contribution > 0 ? Math.ceil(fixed/contribution) : Infinity;
    setText("bFixed", money(fixed)); setText("bContribution", money(contribution));
    setText("bOrders", Number.isFinite(orders) ? `${integer(orders)} orders` : "Not available");
    setText("bRevenue", Number.isFinite(orders) ? money(orders*avg) : "—");
    setText("bMessage", contribution > 0 ? "Rounded up to the next whole order." : "Your contribution per order must be positive.");
    setText("bCallout", contribution > 0 ? `Each order contributes about ${money(contribution)} toward your fixed event costs after the product cost and payment fee entered.` : "The current order value does not cover product cost and payment fees. Review your inputs.");
    return {fixed,avg,cost,fee,contribution,orders};
  }
  const bIds=["bBooth","bTravel","bOther","bOrder","bProduct","bFee"];
  if ($("break-form")) {
    bind(bIds, breakCalc); breakCalc();
    $("copy-break")?.addEventListener("click", () => { const r=breakCalc(); copyText(`MarketMath break-even estimate\nFixed event costs: ${money(r.fixed)}\nContribution per order: ${money(r.contribution)}\nBreak-even: ${Number.isFinite(r.orders)?integer(r.orders)+" orders":"not available"}\nRevenue at break-even: ${Number.isFinite(r.orders)?money(r.orders*r.avg):"not available"}`, "break-message"); });
  }
})();