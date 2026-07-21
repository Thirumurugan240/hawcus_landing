/* Booking form validation. Errors appear under the field that caused them,
   and clear as soon as the visitor fixes it. */
(function () {
  "use strict";

  var form = document.getElementById("demo-booking");
  if (!form) return;

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var RULES = {
    name: {
      err: "bd-name-err",
      check: function (v) {
        if (!v) return "Name is required";
        if (v.length < 2) return "Please enter your full name";
        return "";
      },
    },
    email: {
      err: "bd-email-err",
      check: function (v) {
        if (!v) return "Email is required";
        // any provider is fine here, including gmail
        if (!EMAIL.test(v)) return "Enter a valid email address";
        return "";
      },
    },
    business: {
      err: "bd-business-err",
      check: function (v) {
        if (!v) return "Business name is required";
        return "";
      },
    },
    phone: {
      err: "bd-phone-err",
      check: function (v) {
        var digits = v.replace(/\D/g, "");
        if (!digits) return "Contact number is required";
        if (digits.length !== 10) return "Enter a 10 digit mobile number";
        if (!/^[6-9]/.test(digits)) return "Indian mobile numbers start with 6 to 9";
        return "";
      },
    },
  };

  function setError(field, message) {
    var input = form.elements[field];
    var slot = document.getElementById(RULES[field].err);
    if (message) {
      slot.textContent = message;
      slot.hidden = false;
      input.classList.add("is-bad");
      input.setAttribute("aria-invalid", "true");
    } else {
      slot.hidden = true;
      input.classList.remove("is-bad");
      input.removeAttribute("aria-invalid");
    }
    return !message;
  }

  function validate(field) {
    return setError(field, RULES[field].check(form.elements[field].value.trim()));
  }

  Object.keys(RULES).forEach(function (field) {
    var input = form.elements[field];
    // only nag on blur, then correct live once they have seen the message
    input.addEventListener("blur", function () { validate(field); });
    input.addEventListener("input", function () {
      if (input.classList.contains("is-bad")) validate(field);
    });
  });

  // the country code is fixed, so keep the number field to digits only
  form.elements.phone.addEventListener("input", function (e) {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    var firstBad = null;
    Object.keys(RULES).forEach(function (field) {
      if (!validate(field) && !firstBad) firstBad = field;
    });
    if (firstBad) {
      form.elements[firstBad].focus();
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Sending...";

    try {
      var res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "demo",
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          business: form.elements.business.value.trim(),
          phone: form.elements.phone.value.trim(),
          website: form.elements.website ? form.elements.website.value : "",
        }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");

      document.getElementById("bd-fields").hidden = true;
      document.getElementById("bd-success").hidden = false;
      form.reset();
    } catch (ex) {
      setError("name", ex.message);
      btn.disabled = false;
      btn.textContent = label;
    }
  });
})();
