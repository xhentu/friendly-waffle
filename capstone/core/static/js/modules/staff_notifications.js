export function fetchNotifications() {
    const mainContainer = document.getElementById("main");

    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Notifications</h3>
            </div>
            <div class="card-body">
                <button class="btn btn-primary mb-3" onclick="createNotificationForm()">Create New Notification</button>
                <table class="table table-striped" id="notifications-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Title</th>
                            <th>Message</th>
                            <th>Scope</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="notifications-table-body">
                        <tr>
                            <td colspan="7" class="text-center">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    fetch("/fetch-notifications/")
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById("notifications-table-body");
            tableBody.innerHTML = "";
            data.forEach((notification, index) => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${notification.title}</td>
                        <td>${notification.message}</td>
                        <td>${notification.scope}</td>
                        <td>${notification.is_active ? "Active" : "Inactive"}</td>
                        <td>${new Date(notification.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editNotification(${notification.id})">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteNotification(${notification.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
        })
        .catch(error => {
            console.error("Error fetching notifications:", error);
            document.getElementById("notifications-table-body").innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">Failed to load notifications.</td>
                </tr>
            `;
        });
}

// To fetch personal notifications for any user (e.g., in a separate panel)
export function fetchMyNotifications() {
    fetch("/fetch-notifications/?view=personal")
        .then(response => response.json())
        .then(data => {
            // Render personal notifications (could use similar markup as above)
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `<h3>My Notifications</h3>`;
            data.forEach(notification => {
                mainContainer.innerHTML += `<div>${notification.title}: ${notification.message}</div>`;
            });
        })
        .catch(error => console.error("Error fetching personal notifications:", error));
}

// export function createNotificationForm() {
//     const mainContainer = document.getElementById("main");

//     mainContainer.innerHTML = `
//     <div class="card shadow-sm p-4">
//         <div class="card-header text-center bg-primary text-white">
//             <h3>Create Notification</h3>
//         </div>
//         <div class="card-body">
//             <form id="notification-form">
//                 <div class="mb-3">
//                     <label for="notification-title" class="form-label">Title</label>
//                     <input type="text" id="notification-title" class="form-control" required>
//                 </div>
//                 <div class="mb-3">
//                     <label for="notification-message" class="form-label">Message</label>
//                     <textarea id="notification-message" class="form-control" rows="4" required></textarea>
//                 </div>
//                 <div class="mb-3">
//                     <label for="notification-scope" class="form-label">Scope</label>
//                     <select id="notification-scope" class="form-select" onchange="toggleScopeFields()" required>
//                         <option value="">Select Scope</option>
//                     </select>
//                 </div>
//                 <div id="scope-specific-fields"></div>
//                 <button type="button" class="btn btn-primary" onclick="createNotification()">Create Notification</button>
//             </form>
//         </div>
//     </div>
//     `;

//     fetch("/fetch-notification-scopes/")
//         .then(response => response.json())
//         .then(data => {
//             document.getElementById("notification-scope").innerHTML += data.scopes.map(scope => `<option value="${scope}">${scope}</option>`).join("");
//         })
//         .catch(error => console.error("Error fetching scopes:", error));
// };

// export function toggleScopeFields() {
//     const scope = document.getElementById("notification-scope").value;
//     const scopeSpecificFields = document.getElementById("scope-specific-fields");
//     scopeSpecificFields.innerHTML = "";
    
//     if (scope === "Grade" || scope === "Class") {
//         const endpoint = scope === "Grade" ? "/fetch-grades/" : "/fetch-classes/";
//         fetch(endpoint)
//             .then(response => response.json())
//             .then(data => {
//                 const dropdownId = scope === "Grade" ? "notification-grade" : "notification-class";
//                 scopeSpecificFields.innerHTML = `
//                     <label for="${dropdownId}">${scope} Selection</label>
//                     <select id="${dropdownId}" class="form-select" onchange="fetchRecipients()">
//                         <option value="">Select ${scope}</option>
//                         ${data.map(item => `<option value="${item.id}">${item.name}</option>`).join("")}
//                     </select>
//                     <div id="recipient-selection"></div>
//                 `;
//             })
//             .catch(error => console.error("Error fetching data:", error));
//     } else {
//         fetch(`/fetch-notification-recipients/?scope=${scope}`)
//             .then(response => response.json())
//             .then(data => {
//                 scopeSpecificFields.innerHTML = `
//                     <label for="notification-recipients">Recipients</label>
//                     <select id="notification-recipients" class="form-select" multiple>
//                         ${data.map(user => `<option value="${user.id}">${user.username}</option>`).join("")}
//                     </select>
//                 `;
//             })
//             .catch(error => console.error("Error fetching recipients:", error));
//     }
// } 



// Helper: Get CSRF token from cookies (adjust as needed)
function getCSRFToken() {
    const name = "csrftoken";
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
        let [key, value] = cookie.trim().split("=");
        if (key === name) return value;
    }
    return "";
}

/*-------------------------------------------------------------
  toggleScopeFields()
  - Clears previous extra fields.
  - If scope is "School": fetches recipients for entire school.
  - If scope is "Grade" or "Class": first fetches the list of available grades or classes, 
    then on selection (onchange) calls fetchRecipientsForScope() to load recipients.
  - For all other scopes, directly fetches recipients using the endpoint.
-------------------------------------------------------------*/
export function toggleScopeFields() {
    const scope = document.getElementById("notification-scope").value;
    const scopeSpecificFields = document.getElementById("scope-specific-fields");
    scopeSpecificFields.innerHTML = "";
    
    if (scope === "School") {
        // Entire school: fetch all users.
        fetch(`/fetch-notification-recipients/?scope=${scope}`)
            .then(response => response.json())
            .then(data => {
                scopeSpecificFields.innerHTML = `
                    <label for="notification-recipients">Recipients (Entire School)</label>
                    <select id="notification-recipients" class="form-select" multiple>
                        ${data.map(user => `<option value="${user.id}">${user.username}</option>`).join("")}
                    </select>
                `;
            })
            .catch(error => console.error("Error fetching recipients:", error));
    } else if (scope === "Grade" || scope === "Class") {
        // For Grade or Class, first fetch available options.
        const endpoint = scope === "Grade" ? "/fetch-grades/" : "/fetch-classes/";
        fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                const dropdownId = scope === "Grade" ? "notification-grade" : "notification-class";
                scopeSpecificFields.innerHTML = `
                    <label for="${dropdownId}">${scope} Selection</label>
                    <select id="${dropdownId}" class="form-select" onchange="fetchRecipientsForScope('${scope}')">
                        <option value="">Select ${scope}</option>
                        ${data.map(item => `<option value="${item.id}">${item.name}</option>`).join("")}
                    </select>
                    <div id="recipient-selection"></div>
                `;
            })
            .catch(error => console.error("Error fetching " + scope + " data:", error));
    } else {
        // For other scopes (Admin, Staff, Teacher, Student, Parent, Personal), directly fetch recipients.
        fetch(`/fetch-notification-recipients/?scope=${scope}`)
            .then(response => response.json())
            .then(data => {
                scopeSpecificFields.innerHTML = `
                    <label for="notification-recipients">Recipients</label>
                    <select id="notification-recipients" class="form-select" multiple>
                        ${data.map(user => `<option value="${user.id}">${user.username}</option>`).join("")}
                    </select>
                `;
            })
            .catch(error => console.error("Error fetching recipients:", error));
    }
}

/*-------------------------------------------------------------
  fetchRecipientsForScope()
  - Called when the user selects a specific Grade or Class from the extra dropdown.
  - It uses the selected grade/class ID to fetch recipients via the endpoint.
-------------------------------------------------------------*/
export function fetchRecipientsForScope(scope) {
    const dropdownId = scope === "Grade" ? "notification-grade" : "notification-class";
    const selectedId = document.getElementById(dropdownId).value;
    if (!selectedId) return;
    
    const endpoint = scope === "Grade"
        ? `/fetch-notification-recipients/?scope=Grade&grade_id=${selectedId}`
        : `/fetch-notification-recipients/?scope=Class&class_id=${selectedId}`;
    
    fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            const recipientDiv = document.getElementById("recipient-selection");
            recipientDiv.innerHTML = `
                <label for="notification-recipients">Recipients</label>
                <select id="notification-recipients" class="form-select" multiple>
                    ${data.map(user => `<option value="${user.id}">${user.username}</option>`).join("")}
                </select>
                <button type="button" class="btn btn-secondary btn-sm mt-2" onclick="selectAllRecipients()">Select All</button>
            `;
        })
        .catch(error => console.error("Error fetching recipients for " + scope + ":", error));
}

/*-------------------------------------------------------------
  selectAllRecipients()
  - Selects all options in the recipients dropdown.
-------------------------------------------------------------*/
export function selectAllRecipients() {
    const selectBox = document.getElementById("notification-recipients");
    if (selectBox) {
        for (let option of selectBox.options) {
            option.selected = true;
        }
    }
}

/*-------------------------------------------------------------
  createNotificationForm()
  - Renders the form for creating a notification.
  - Populates the scope dropdown via /fetch-notification-scopes/ endpoint.
-------------------------------------------------------------*/
export function createNotificationForm() {
    const mainContainer = document.getElementById("main");

    mainContainer.innerHTML = `
    <div class="card shadow-sm p-4">
        <div class="card-header text-center bg-primary text-white">
            <h3>Create Notification</h3>
        </div>
        <div class="card-body">
            <form id="notification-form">
                <div class="mb-3">
                    <label for="notification-title" class="form-label">Title</label>
                    <input type="text" id="notification-title" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label for="notification-message" class="form-label">Message</label>\n
                    <textarea id=\"notification-message\" class=\"form-control\" rows=\"4\" required></textarea>\n                </div>\n                <div class=\"mb-3\">\n                    <label for=\"notification-scope\" class=\"form-label\">Scope</label>\n                    <select id=\"notification-scope\" class=\"form-select\" onchange=\"toggleScopeFields()\" required>\n                        <option value=\"\">Select Scope</option>\n                    </select>\n                </div>\n                <div id=\"scope-specific-fields\"></div>\n                <button type=\"button\" class=\"btn btn-primary\" onclick=\"createNotification()\">Create Notification</button>\n            </form>\n        </div>\n    </div>\n    `
                    ;

    // Populate the scope dropdown
    fetch("/fetch-notification-scopes/")
        .then(response => response.json())
        .then(data => {
            const scopeSelect = document.getElementById("notification-scope");
            scopeSelect.innerHTML += data.scopes.map(scope => `<option value="${scope}">${scope}</option>`).join("");
        })
        .catch(error => console.error("Error fetching scopes:", error));
}

/*-------------------------------------------------------------
  createNotification()
  - Collects form data (title, message, scope, and recipients) and sends it to the backend.
-------------------------------------------------------------*/
export function createNotification() {
    const title = document.getElementById("notification-title").value;
    const message = document.getElementById("notification-message").value;
    const scope = document.getElementById("notification-scope").value;
    
    let payload = { title, message, scope };
    
    // For Grade or Class, include the extra selected value (grade_id or class_id) and recipients from that selection.
    if (scope === "Grade" || scope === "Class") {
        const extraSelect = document.getElementById(scope === "Grade" ? "notification-grade" : "notification-class");
        const extraId = extraSelect ? extraSelect.value : "";
        payload[scope === "Grade" ? "grade_id" : "class_id"] = extraId;
        const recipientSelect = document.getElementById("notification-recipients");
        payload.recipients = recipientSelect ? Array.from(recipientSelect.selectedOptions).map(option => option.value) : [];
    } else {
        const recipientSelect = document.getElementById("notification-recipients");
        payload.recipients = recipientSelect ? Array.from(recipientSelect.selectedOptions).map(option => option.value) : [];
    }
    
    fetch("/create-notification/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchNotifications();
    })
    .catch(error => console.error("Error creating notification:", error));
}

/*-------------------------------------------------------------
  deleteNotification()
  - Deletes a notification and refreshes the list.
-------------------------------------------------------------*/
export function deleteNotification(notificationId) {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    
    fetch(`/delete-notification/${notificationId}/`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": getCSRFToken(),
        },
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchNotifications();
    })
    .catch(error => console.error("Error deleting notification:", error));
}

