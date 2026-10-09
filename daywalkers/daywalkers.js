/* Daywalkers landing page: next-show date + on-page Eventbrite checkout + Google Ads tracking */
(function () {
  var EVENT_ID = '886479824017';
  var AFFILIATE = 'tfcdaywalkers';
  // Google Ads "Ticket purchase" conversion (send_to = AW-ID/label)
  var PURCHASE_CONVERSION = 'AW-17864140957/8XM7CImYpZYdEJ3RpMZC';
  var TICKET_VALUE = 15;

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  /* ---- Next show: the coming Friday at 6PM Central (rolls over after 6:30PM Friday) ---- */
  function nextShowLabel() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago', weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(new Date()).reduce(function (o, p) { o[p.type] = p.value; return o; }, {});
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var dow = days[parts.weekday];
    var minutes = (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10);
    var add = (5 - dow + 7) % 7;
    if (add === 0 && minutes > 18 * 60 + 30) add = 7;
    var d = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day + add));
    if (add === 0) return 'tonight at 6PM';
    var label = d.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'short', day: 'numeric' });
    return (add <= 6 ? 'this ' : 'next ') + label + ' at 6PM';
  }
  var label = nextShowLabel();
  document.querySelectorAll('.js-next-show').forEach(function (el) { el.textContent = label; });

  /* ---- Eventbrite on-page checkout (falls back to the Eventbrite link if the widget can't load) ---- */
  var buttons = document.querySelectorAll('.js-tickets');
  var ready = false;

  buttons.forEach(function (btn, i) {
    btn.id = btn.id || 'eb-checkout-' + i;
    btn.addEventListener('click', function (e) {
      track('begin_checkout', { cta: btn.dataset.cta, method: ready ? 'modal' : 'link' });
      if (ready) e.preventDefault();
    });
  });

  function onOrderComplete(data) {
    var orderId = data && data.orderId;
    track('conversion', {
      send_to: PURCHASE_CONVERSION,
      value: TICKET_VALUE,
      currency: 'USD',
      transaction_id: orderId || ''
    });
    track('purchase', { transaction_id: orderId || '', value: TICKET_VALUE, currency: 'USD' });
  }

  window.tfcInitCheckout = function () {
    // Eventbrite only allows the embedded checkout over https; elsewhere the buttons stay plain links
    if (ready || !window.EBWidgets || location.protocol !== 'https:') return;
    buttons.forEach(function (btn) {
      window.EBWidgets.createWidget({
        widgetType: 'checkout',
        eventId: EVENT_ID,
        modal: true,
        modalTriggerElementId: btn.id,
        affiliateCode: AFFILIATE,
        onOrderComplete: onOrderComplete
      });
    });
    ready = true;
  };
  if (window.EBWidgets) window.tfcInitCheckout();
})();
