const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("task-form");
    const list = document.getElementById("task-list");

    async function loadTasks() {
        try {
            const response = await fetch(`${API_URL}/tasks`);
            if (!response.ok) throw new Error("Failed to load tasks");

            const tasks = await response.json();
            list.innerHTML = "";

            tasks.forEach(task => {
                const li = document.createElement("li");
                li.textContent = `${task.title} - ${task.completed ? "✅" : "❌"}`;
                list.appendChild(li);
            });
        } catch (error) {
            console.error(error);
        }
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("title").value.trim();
        const description = document.getElementById("description").value.trim();

        if (!title) {
            alert("Title is required");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description: description || null })
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("Server response:", text);
                throw new Error("Failed to create task");
            }

            form.reset();
            await loadTasks(); // 🔥 refresh tasks immediately
        } catch (error) {
            console.error(error);
            alert("Error adding task. Check console for details.");
        }
    });

    loadTasks();
});
