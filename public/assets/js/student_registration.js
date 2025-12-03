// Function to calculate and update the total tuition fee
function updateTotalTuition() {
  const selectedProgram = document.getElementById("allocatedProgram").value;

  let selectedModules = 0;

  // Iterate through all checkboxes to count selected modules
  const checkboxes = document.querySelectorAll(".module-checkbox");
  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      selectedModules++;
    }
  });

  // Calculate the total tuition fee based on the selected modules and program
  let totalTuition = 0;
  switch (selectedProgram) {
    case "E1":
      if (selectedModules === 1) totalTuition = 39000;
      else if (selectedModules === 2) totalTuition = 73000;
      else if (selectedModules === 3) totalTuition = 107000;
      else if (selectedModules === 4) totalTuition = 141000;
      else if (selectedModules === 5) totalTuition = 170000;
      break;
    case "E2":
      if (selectedModules === 6) totalTuition = 200000;
      else if (selectedModules === 5) totalTuition = 171000;
      else if (selectedModules === 4) totalTuition = 138000;
      else if (selectedModules === 3) totalTuition = 105000;
      else if (selectedModules === 2) totalTuition = 71000;
      else if (selectedModules === 1) totalTuition = 38000;
      break;
    case "E3":
      if (selectedModules === 4) totalTuition = 180000;
      else if (selectedModules === 3) totalTuition = 140000;
      else if (selectedModules === 2) totalTuition = 95000;
      else if (selectedModules === 1) totalTuition = 50000;
      break;
    case "E4":
      if (selectedModules === 4) totalTuition = 200000;
      else if (selectedModules === 3) totalTuition = 155000;
      else if (selectedModules === 2) totalTuition = 105000;
      else if (selectedModules === 1) totalTuition = 55000;
      break;
    case "E4M":
      totalTuition = 100000;
      break;
  }

  // Update the selected module count and total tuition fee display
  document.getElementById("totalTuition").textContent = totalTuition.toFixed(2); // Format as currency if needed
}

// Attach an event listener to the allocated program dropdown
document
  .getElementById("allocatedProgram")
  .addEventListener("change", updateTotalTuition);

// Attach event listeners to each checkbox to trigger the calculation
const checkboxes = document.querySelectorAll(".module-checkbox");
checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", updateTotalTuition);
});

// UNDER CONSTRUCTION
document
  .getElementById("studentRegistrationForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting traditionally
    console.log("form submitted");
    //-----------------------------------------------------------------------------------------------------------------------------------------
    // Collect the data that is required to send to the server
    //-----------------------------------------------------------------------------------------------------------------------------------------

    const phone_number = document.getElementById("phoneExt").value;
    const contact_address = document.querySelector(
      'input[name="contact_address"]'
    ).value;
    // Check if the nationality field exists on the page
    const nationalityField = document.getElementById("nationality");
    const nationality = nationalityField ? nationalityField.value : null;

    // Check if the district field exists on the page
    const districtField = document.querySelector('input[name="district"]');
    const district = districtField ? districtField.value : null;

    // Check if the tradi_auth field exists on the page
    const tradiAuthField = document.querySelector('input[name="tradi_auth"]');
    const tradi_auth = tradiAuthField ? tradiAuthField.value : null;

    // Check if the village field exists on the page
    const villageField = document.querySelector('input[name="village"]');
    const village = villageField ? villageField.value : null;

    // Check if the date_of_birth field exists on the page
    const dateOfBirthField = document.querySelector(
      'input[name="date_of_birth"]'
    );
    const date_of_birth = dateOfBirthField ? dateOfBirthField.value : null;

    // Check if the gender field exists on the page
    const genderField = document.querySelector('input[name="gender"]');
    const gender = genderField ? genderField.value : null;

    // Check if the next_of_kin_name field exists on the page
    const nextOfKinNameField = document.querySelector(
      'input[name="next_of_kin_name"]'
    );
    const next_of_kin_name = nextOfKinNameField
      ? nextOfKinNameField.value
      : null;

    // Check if the next_of_kin_relationship field exists on the page
    const nextOfKinRelationshipField = document.querySelector(
      'input[name="next_of_kin_relationship"]'
    );
    const next_of_kin_relationship = nextOfKinRelationshipField
      ? nextOfKinRelationshipField.value
      : null;

    // Check if the next_of_kin_phone_number field exists on the page
    const nextOfKinPhoneNumberField = document.querySelector(
      'input[name="next_of_kin_phone_number"]'
    );
    const next_of_kin_phone_number = nextOfKinPhoneNumberField
      ? nextOfKinPhoneNumberField.value
      : null;

    // Check if the next_of_kin_email field exists on the page
    const nextOfKinEmailField = document.querySelector(
      'input[name="next_of_kin_email"]'
    );
    const next_of_kin_email = nextOfKinEmailField
      ? nextOfKinEmailField.value
      : null;

    // Check if the next_of_kin_address field exists on the page
    const nextOfKinAddressField = document.querySelector(
      'input[name="next_of_kin_address"]'
    );
    const next_of_kin_address = nextOfKinAddressField
      ? nextOfKinAddressField.value
      : null;

    //------------------------------------------------------------------------------------------------------------------------------------------
    const selectedModules = [];
    const checkboxes = document.querySelectorAll(".module-checkbox");
    checkboxes.forEach((checkbox, index) => {
      if (checkbox.checked) {
        selectedModules.push(checkbox.name);
      }
    });

    if (selectedModules.length === 0) {
      // Display an error message
      document.getElementById("errorModuleSelection").textContent =
        "Please select at least one module.";
    } else {
      document.getElementById("errorModuleSelection").textContent = "";

      const totalTuition = parseInt(
        document.getElementById("totalTuition").textContent
      );

      // Create an object to store the data
      const formData = {
        phone_number,
        contact_address,
        selectedModules,
        totalTuition,
        nationality,
        district,
        tradi_auth,
        village,
        date_of_birth,
        gender,
        next_of_kin_name,
        next_of_kin_address,
        next_of_kin_relationship,
        next_of_kin_phone_number,
        next_of_kin_email,
      };

      // Send the data to the server
      fetch("student-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data.message);

          window.location.href = "student-dashboard";
          toast(data.message);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  });

document
  .getElementById("confirmDetails")
  .addEventListener("change", function () {
    const submitButton = document.getElementById("submitButton");
    submitButton.disabled = !this.checked;
  });
