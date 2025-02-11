export function viewTeacherSchedule(day = null) {
    // Detect the current day if no day is provided
    if (!day) {
        const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" }); // e.g., "Monday"
        day = currentDay;
    }

    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Schedule for ${day}</h3>
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-between" id="day-buttons">
                    <button class="btn btn-secondary" id="Monday" onclick="viewTeacherSchedule('Monday')">Monday</button>
                    <button class="btn btn-secondary" id="Tuesday" onclick="viewTeacherSchedule('Tuesday')">Tuesday</button>
                    <button class="btn btn-secondary" id="Wednesday" onclick="viewTeacherSchedule('Wednesday')">Wednesday</button>
                    <button class="btn btn-secondary" id="Thursday" onclick="viewTeacherSchedule('Thursday')">Thursday</button>
                    <button class="btn btn-secondary" id="Friday" onclick="viewTeacherSchedule('Friday')">Friday</button>
                </div>
                <table class="table table-striped mt-3" id="schedule-table">
                    <thead>
                        <tr>
                            <th>Section</th>
                            <th>Time</th>
                            <th>Class Name</th>
                            <th>Grade</th>
                            <th>Subject</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="5" class="text-center">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Highlight the active day button
    document.querySelectorAll("#day-buttons button").forEach((button) => {
        button.classList.remove("btn-primary"); // Remove active color
        button.classList.add("btn-secondary"); // Reset to default color
    });
    const activeButton = document.getElementById(day);
    if (activeButton) {
        activeButton.classList.remove("btn-secondary");
        activeButton.classList.add("btn-primary"); // Highlight active button
    }

    fetch(`/get-teacher-schedule/?day=${day}`)
        .then(response => {
            if (!response.ok) {
                console.error(`Server error: ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.querySelector("#schedule-table tbody");
            tableBody.innerHTML = ""; // Clear loading state
            if (data.schedules.length > 0) {
                data.schedules.forEach((item) => {
                    tableBody.innerHTML += `
                        <tr>
                            <td>${item.section}</td>
                            <td>${item.time}</td>
                            <td>${item.class_name}</td>
                            <td>${item.grade}</td>
                            <td>${item.subject_name}</td>
                        </tr>
                    `;
                });
            } else {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">No schedule available</td>
                    </tr>
                `;
            }
        })
        .catch(error => {
            console.error("Error fetching schedule:", error.message);
            const tableBody = document.querySelector("#schedule-table tbody");
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">Failed to load schedule</td>
                </tr>
            `;
        });
}

export function listAssignedClasses() {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Assigned Classes</h3>
            </div>
            <div class="card-body">
                <ul id="class-list" class="list-group">
                    <li class="list-group-item text-center">Loading...</li>
                </ul>
            </div>
        </div>
    `;

    fetch("/get-assigned-classes/")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch classes");
            }
            return response.json();
        })
        .then(data => {
            const classList = document.getElementById("class-list");
            classList.innerHTML = ""; // Clear loading state

            if (data.classes.length > 0) {
                data.classes.forEach((classItem) => {
                    classList.innerHTML += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${classItem.name} (${classItem.grade})
                            <button class="btn btn-sm btn-primary" onclick="viewClassTimetable(${classItem.id})">View Timetable</button>
                        </li>
                    `;
                });
            } else {
                classList.innerHTML = `<li class="list-group-item text-center">No assigned classes</li>`;
            }
        })
        .catch(error => {
            console.error("Error fetching classes:", error.message);
            const classList = document.getElementById("class-list");
            classList.innerHTML = `<li class="list-group-item text-danger text-center">Failed to load classes</li>`;
        });
}

export function viewClassTimetable(classId) {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Class Timetable</h3>
            </div>
            <div class="card-body">
                <table class="table table-bordered" id="class-timetable">
                    <thead>
                        <tr>
                            <th>Day</th>
                            <th>1st Section</th>
                            <th>2nd Section</th>
                            <th>3rd Section</th>
                            <th>4th Section</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="5" class="text-center">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    fetch(`/get-class-schedule/${classId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch timetable");
            }
            return response.json();
        })
        .then(data => {
            const timetableBody = document.querySelector("#class-timetable tbody");
            timetableBody.innerHTML = ""; // Clear loading state

            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
            days.forEach(day => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${day}</td>
                    ${["1st Section", "2nd Section", "3rd Section", "4th Section"].map(section => {
                        const schedule = data.timetable[day]?.[section];
                        if (schedule) {
                            return `
                                <td>
                                    ${schedule.subject_name}
                                    <br/>
                                    <button class="btn btn-sm btn-warning mb-2" onclick="editSchedule(${schedule.id})">Edit</button>
                                    <br/>
                                    <button class="btn btn-sm btn-danger mb-2" onclick="deleteSchedule(${schedule.id}, ${classId})">Delete</button>
                                </td>
                            `;
                        } else {
                            return `
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="createSchedule('${day}', '${section}', ${classId})">Create</button>
                                </td>
                            `;
                        }
                    }).join("")}
                `;
                timetableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Error fetching timetable:", error.message);
            const timetableBody = document.querySelector("#class-timetable tbody");
            timetableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Failed to load timetable</td></tr>`;
        });
}

export function createSchedule(day, section, classId) {
    const mainContainer = document.getElementById("main");
    mainContainer.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="card-header text-center bg-primary text-white">
                <h3>Create Schedule</h3>
            </div>
            <div class="card-body">
                <form id="create-schedule-form">
                    <div class="mb-3">
                        <label for="subject" class="form-label">Subject</label>
                        <select id="subject" class="form-select">
                            <!-- Populate dynamically -->
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Create Schedule</button>
                </form>
            </div>
        </div>
    `;

    populateValidSubjects(classId);

    // Attach form submission handler
    document.getElementById("create-schedule-form").addEventListener("submit", function (e) {
        e.preventDefault();
        const subjectId = document.getElementById("subject").value;

        fetch(`/create-schedule/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                class_id: classId,
                day_of_week: day,
                section: section,
                subject_id: subjectId,
            }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to create schedule");
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                viewClassTimetable(classId); // Refresh the timetable
            })
            .catch(error => {
                console.error("Error creating schedule:", error.message);
            });
    });
}

export function populateValidSubjects(classId) {
    const subjectDropdown = document.getElementById("subject");
    subjectDropdown.innerHTML = `<option>Loading...</option>`; // Show loading state

    // Fetch subjects filtered by class_id
    const url = classId ? `/get-subjects/?class_id=${classId}` : '/get-subjects/';
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch subjects");
            }
            return response.json();
        })
        .then(subjects => {
            if (subjects.length > 0) {
                // Populate dropdown with valid subjects
                subjectDropdown.innerHTML = subjects.map(subject => `
                    <option value="${subject.id}">${subject.name}</option>
                `).join("");
            } else {
                subjectDropdown.innerHTML = `<option disabled>No subjects available</option>`;
            }
        })
        .catch(error => {
            console.error("Error fetching subjects:", error.message);
            subjectDropdown.innerHTML = `<option disabled>Error loading subjects</option>`;
        });
}

export function editSchedule(scheduleId) {
    fetch(`/get-schedule-details/${scheduleId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch schedule details");
            }
            return response.json();
        })
        .then(schedule => {
            const mainContainer = document.getElementById("main");
            mainContainer.innerHTML = `
                <div class="card shadow-sm p-4">
                    <div class="card-header text-center bg-warning text-white">
                        <h3>Edit Schedule</h3>
                    </div>
                    <div class="card-body">
                        <form id="edit-schedule-form">
                            <div class="mb-3">
                                <label for="day-of-week" class="form-label">Day of Week</label>
                                <select id="day-of-week" class="form-select">
                                    <option value="Monday" ${schedule.day_of_week === "Monday" ? "selected" : ""}>Monday</option>
                                    <option value="Tuesday" ${schedule.day_of_week === "Tuesday" ? "selected" : ""}>Tuesday</option>
                                    <option value="Wednesday" ${schedule.day_of_week === "Wednesday" ? "selected" : ""}>Wednesday</option>
                                    <option value="Thursday" ${schedule.day_of_week === "Thursday" ? "selected" : ""}>Thursday</option>
                                    <option value="Friday" ${schedule.day_of_week === "Friday" ? "selected" : ""}>Friday</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="section" class="form-label">Section</label>
                                <select id="section" class="form-select">
                                    <option value="1st Section" ${schedule.section === "1st Section" ? "selected" : ""}>1st Section</option>
                                    <option value="2nd Section" ${schedule.section === "2nd Section" ? "selected" : ""}>2nd Section</option>
                                    <option value="3rd Section" ${schedule.section === "3rd Section" ? "selected" : ""}>3rd Section</option>
                                    <option value="4th Section" ${schedule.section === "4th Section" ? "selected" : ""}>4th Section</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="subject" class="form-label">Subject</label>
                                <select id="subject" class="form-select">
                                    <option>Loading...</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-warning">Save Changes</button>
                        </form>
                    </div>
                </div>
            `;

            // Fetch valid subjects based on class_id
            fetch(`/get-subjects/?class_id=${schedule.class_id}`)
                .then(response => response.json())
                .then(subjects => {
                    const subjectDropdown = document.getElementById("subject");
                    if (subjects.length > 0) {
                        subjectDropdown.innerHTML = subjects.map(subject => `
                            <option value="${subject.id}" ${schedule.subject_id === subject.id ? "selected" : ""}>
                                ${subject.name}
                            </option>
                        `).join("");
                    } else {
                        subjectDropdown.innerHTML = `<option disabled>No valid subjects available</option>`;
                    }
                })
                .catch(error => {
                    console.error("Error fetching valid subjects:", error.message);
                    const subjectDropdown = document.getElementById("subject");
                    subjectDropdown.innerHTML = `<option disabled>Error loading subjects</option>`;
                });

            // Attach form submission handler
            document.getElementById("edit-schedule-form").addEventListener("submit", function (e) {
                e.preventDefault();
                saveScheduleChanges(scheduleId, schedule.class_id); // Pass class_id to saveScheduleChanges
            });
        })
        .catch(error => {
            console.error("Error fetching schedule details:", error.message);
        });
}

export function saveScheduleChanges(scheduleId, classId) {
    const dayOfWeek = document.getElementById("day-of-week").value;
    const section = document.getElementById("section").value;
    const subjectId = document.getElementById("subject").value;

    fetch(`/edit-schedule/${scheduleId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            day_of_week: dayOfWeek,
            section: section,
            subject_id: subjectId,
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to save changes");
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            viewClassTimetable(classId); // Pass the correct classId here
        })
        .catch(error => {
            console.error("Error saving schedule:", error.message);
        });
}

export function deleteSchedule(scheduleId, classId) {
    if (!confirm("Are you sure you want to delete this schedule? This action cannot be undone.")) {
        return;
    }

    fetch(`/delete-schedule/${scheduleId}/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to delete schedule");
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            viewClassTimetable(classId); // Refresh the timetable
        })
        .catch(error => {
            console.error("Error deleting schedule:", error.message);
            alert("Failed to delete schedule. Please try again.");
        });
}


