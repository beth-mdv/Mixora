(() => {
  const form = document.getElementById("feedbackForm");

  if (!form) {
    throw new Error('Contact form with id "feedbackForm" was not found.');
  }

  const getField = (id) => {
    const field = document.getElementById(id);

    if (!field) {
      throw new Error(`Contact form field with id "${id}" was not found.`);
    }

    return field;
  };

  const firstName = getField("firstName");
  const lastName = getField("lastName");
  const email = getField("email");
  const phone = getField("phone");
  const message = getField("message");
  const agreement = getField("privacyAgreement");
  const submitButton = form.querySelector('button[type="submit"]');

  if (!submitButton) {
    throw new Error('Submit button for form "feedbackForm" was not found.');
  }

  const fields = [firstName, lastName, email, phone, message, agreement];
  const interactedFields = new WeakSet();
  const successModal = document.getElementById("successModal");
  const successModalHome = document.getElementById("successModalHome");

  if (!successModal || !successModalHome) {
    throw new Error("The contact form success modal is incomplete.");
  }

  let previousBodyOverflow = "";
  let previousDocumentOverflow = "";
  let previousInertStates = [];

  const namePattern =
    /^\p{L}\p{M}*(?:\p{L}\p{M}*|[ '\u2019\u02BC-]\p{L}\p{M}*)*$/u;
  const emailPattern =
    /^[A-Z0-9!#$%&'*+/=?^_{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_{|}~-]+)*@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
  const phonePattern = /^\+380\d{9}$/;

  const getErrorElement = (field) => {
    const errorId = field.getAttribute("aria-describedby");
    const errorElement = errorId && document.getElementById(errorId);

    if (!errorElement) {
      throw new Error(
        `An error description for field "${field.id}" was not found.`,
      );
    }

    return errorElement;
  };

  function clearValidationState(field) {
    field.setAttribute("aria-invalid", "false");
    field.classList.remove("is-invalid", "is-valid");
    getErrorElement(field).textContent = "";
  }

  function showError(field, text) {
    field.setAttribute("aria-invalid", "true");
    field.classList.add("is-invalid");
    field.classList.remove("is-valid");
    getErrorElement(field).textContent = text;
  }

  function showSuccess(field) {
    clearValidationState(field);
    field.classList.add("is-valid");
  }

  function validateName(field, label) {
    const value = field.value.trim().normalize("NFC");

    if (!value) {
      showError(field, `${label} is required.`);
      return false;
    }

    if ((value.match(/\p{L}/gu) ?? []).length < 2) {
      showError(field, `${label} must contain at least 2 letters.`);
      return false;
    }

    if (!namePattern.test(value)) {
      showError(
        field,
        `${label} may contain letters, spaces, hyphens, and apostrophes only.`,
      );
      return false;
    }

    showSuccess(field);
    return true;
  }

  function validateFirstName() {
    return validateName(firstName, "First name");
  }

  function validateLastName() {
    return validateName(lastName, "Last name");
  }

  function validateEmail() {
    if (!email.value) {
      showError(email, "Email is required.");
      return false;
    }

    if (!emailPattern.test(email.value)) {
      showError(email, "Enter a valid email address without spaces.");
      return false;
    }

    showSuccess(email);
    return true;
  }

  function validatePhone() {
    if (!phone.value) {
      showError(phone, "Phone number is required.");
      return false;
    }

    if (!phonePattern.test(phone.value)) {
      showError(phone, "Enter the phone number in the format +380XXXXXXXXX.");
      return false;
    }

    showSuccess(phone);
    return true;
  }

  function validateMessage() {
    const value = message.value.trim();

    if (!value) {
      showError(message, "Message is required.");
      return false;
    }

    if (Array.from(value).length < 10) {
      showError(message, "Message must contain at least 10 characters.");
      return false;
    }

    showSuccess(message);
    return true;
  }

  function validateAgreement() {
    if (!agreement.checked) {
      showError(agreement, "Please agree to the Privacy Policy.");
      return false;
    }

    showSuccess(agreement);
    return true;
  }

  const validators = [
    validateFirstName,
    validateLastName,
    validateEmail,
    validatePhone,
    validateMessage,
    validateAgreement,
  ];

  function openSuccessModal() {
    const backgroundElements = [
      ...document.body.children,
      ...form.closest("main").children,
    ].filter(
      (element) =>
        element !== successModal &&
        element !== form.closest("main"),
    );

    previousInertStates = backgroundElements.map((element) => ({
      element,
      inert: element.inert,
    }));
    backgroundElements.forEach((element) => {
      element.inert = true;
    });

    previousBodyOverflow = document.body.style.overflow;
    previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    successModal.hidden = false;
    successModal.focus();
  }

  function closeSuccessModal(restoreSubmitFocus) {
    if (successModal.hidden) {
      return;
    }

    successModal.hidden = true;
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousDocumentOverflow;
    previousInertStates.forEach(({ element, inert }) => {
      element.inert = inert;
    });
    previousInertStates = [];

    if (restoreSubmitFocus) {
      form.querySelector('button[type="submit"]').focus();
    }
  }

  successModalHome.addEventListener("click", () => {
    closeSuccessModal(false);
  });

  document.addEventListener("keydown", (event) => {
    if (successModal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSuccessModal(true);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      successModalHome.focus();
    }
  });

  const validateField = (field) => {
    if (field === firstName) return validateFirstName();
    if (field === lastName) return validateLastName();
    if (field === email) return validateEmail();
    if (field === phone) return validatePhone();
    if (field === message) return validateMessage();
    if (field === agreement) return validateAgreement();
    return true;
  };

  form.noValidate = true;

  fields.forEach((field) => {
    clearValidationState(field);

    field.addEventListener("input", () => {
      interactedFields.add(field);
      validateField(field);
    });

    field.addEventListener("change", () => {
      if (interactedFields.has(field)) {
        validateField(field);
      }
    });

    field.addEventListener("blur", () => {
      interactedFields.add(field);
      validateField(field);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    let firstInvalidField = null;

    validators.forEach((validate, index) => {
      if (!validate() && firstInvalidField === null) {
        firstInvalidField = fields[index];
      }
    });

    if (firstInvalidField) {
      form.dataset.validationState = "error";
      firstInvalidField.focus();
      return;
    }

    form.dataset.validationState = "success";
    openSuccessModal();
  });

  submitButton.disabled = false;
})();
