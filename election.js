(() => {
  "use strict";

  const nameButtons = Array.from(document.querySelectorAll(".name-hit"));
  const status = document.getElementById("selectionStatus");
  const storageKey = "classroomElectionSelectedStudent";

  function selectStudent(button) {
    const studentName = button.dataset.student;
    if (!studentName) return;

    nameButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    try {
      sessionStorage.setItem(storageKey, studentName);
    } catch (error) {
      // The screen remains usable when browser storage is unavailable.
    }

    if (status) status.textContent = studentName + " selected.";
  }

  nameButtons.forEach((button) => {
    button.addEventListener("click", () => selectStudent(button));
  });

  // Restore the current student's highlighted name if the page is refreshed
  // during the same browser session.
  try {
    const savedName = sessionStorage.getItem(storageKey);
    const savedButton = nameButtons.find((button) => button.dataset.student === savedName);
    if (savedButton) selectStudent(savedButton);
  } catch (error) {
    // Ignore unavailable session storage.
  }
})();