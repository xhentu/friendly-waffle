// Updated Notification Frontend (notifications.js)

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
                    <label for="notification-message" class="form-label">Message</label>
                    <textarea id="notification-message" class="form-control" rows="4" required></textarea>
                </div>
                <div class="mb-3">
                    <label for="notification-scope" class="form-label">Scope</label>
                    <select id="notification-scope" class="form-select" onchange="toggleScopeFields()" required>
                        <option value="">Select Scope</option>
                    </select>
                </div>
                <div id="scope-specific-fields"></div>
                <button type="button" class="btn btn-primary" onclick="createNotification()">Create Notification</button>
            </form>
        </div>
    </div>
    `;

    fetch("/fetch-notification-scopes/")
        .then(response => response.json())
        .then(data => {
            document.getElementById("notification-scope").innerHTML += data.scopes.map(scope => `<option value="${scope}">${scope}</option>`).join("");
        })
        .catch(error => console.error("Error fetching scopes:", error));
}

export function toggleScopeFields() {
    const scope = document.getElementById("notification-scope").value;
    const scopeSpecificFields = document.getElementById("scope-specific-fields");
    scopeSpecificFields.innerHTML = "";
    
    if (scope === "Grade" || scope === "Class") {
        const endpoint = scope === "Grade" ? "/fetch-grades/" : "/fetch-classes/";
        fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                const dropdownId = scope === "Grade" ? "notification-grade" : "notification-class";
                scopeSpecificFields.innerHTML = `
                    <label for="${dropdownId}">${scope} Selection</label>
                    <select id="${dropdownId}" class="form-select" onchange="fetchRecipients()">
                        <option value="">Select ${scope}</option>
                        ${data.map(item => `<option value="${item.id}">${item.name}</option>`).join("")}
                    </select>
                    <div id="recipient-selection"></div>
                `;
            })
            .catch(error => console.error("Error fetching data:", error));
    } else {
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

export function createNotification() {
    console.log('give to server');
}

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
