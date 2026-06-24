document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message and reset activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        // Title
        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        // Description
        const desc = document.createElement("p");
        desc.textContent = details.description;
        activityCard.appendChild(desc);

        // Schedule
        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        activityCard.appendChild(schedule);

        // Availability
        const spotsLeft = details.max_participants - details.participants.length;
        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        activityCard.appendChild(availability);

        // Participants section
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants-section";

        const participantsTitle = document.createElement("p");
        participantsTitle.className = "participants-title";
        participantsTitle.innerHTML = `<strong>Participants (${details.participants.length}):</strong>`;
        participantsContainer.appendChild(participantsTitle);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (!details.participants || details.participants.length === 0) {
          const li = document.createElement("li");
          li.className = "participant-item empty";
          const span = document.createElement("span");
          span.className = "participant-email";
          span.textContent = "No participants yet";
          li.appendChild(span);
          participantsList.appendChild(li);
        } else {
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = email;

            const btn = document.createElement("button");
            btn.className = "delete-participant";
            btn.type = "button";
            btn.title = "Remove participant";
            btn.dataset.email = email;
            btn.textContent = "×";

            btn.addEventListener("click", async (e) => {
              e.stopPropagation();
              const emailToRemove = btn.dataset.email;
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(emailToRemove)}`,
                  { method: "DELETE" }
                );
                const resJson = await resp.json();
                if (resp.ok) {
                  messageDiv.textContent = resJson.message;
                  messageDiv.className = "success";
                  // Refresh activities to reflect change
                  fetchActivities();
                } else {
                  messageDiv.textContent = resJson.detail || "Failed to remove participant";
                  messageDiv.className = "error";
                }
              } catch (err) {
                messageDiv.textContent = "Failed to remove participant.";
                messageDiv.className = "error";
                console.error("Error removing participant:", err);
              }

              messageDiv.classList.remove("hidden");
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            });

            li.appendChild(span);
            li.appendChild(btn);
            participantsList.appendChild(li);
          });
        }

        participantsContainer.appendChild(participantsList);
        activityCard.appendChild(participantsContainer);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the participants and availability update
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
