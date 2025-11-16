document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select so options don't duplicate on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p><strong>Participants:</strong></p>
            <ul class="participants-list"></ul>
          </div>
        `;

        // Populate participants list (with delete icon)
        const participantsList = activityCard.querySelector(".participants-list");
        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((participant) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = participant;

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "participant-delete";
            deleteBtn.title = `Unregister ${participant}`;
            deleteBtn.innerHTML = `\u2716`;

            // Click handler to unregister participant
            deleteBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              if (!confirm(`Unregister ${participant} from ${name}?`)) return;
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );

                if (res.ok) {
                  // refresh activities list so counts/participants update
                  fetchActivities();
                } else {
                  const data = await res.json().catch(() => ({}));
                  alert(data.detail || data.message || "Failed to unregister participant.");
                }
              } catch (err) {
                console.error("Error unregistering:", err);
                alert("Failed to unregister participant. See console for details.");
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            participantsList.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet";
          participantsList.appendChild(li);
        }

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
            // Refresh activities list so UI reflects the new participant immediately
            fetchActivities();
        signupForm.reset();
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
