// pmpt_69dec010f07c8190b75fb7a88aaefef503cd17ce546ab745
const API_URL = "https://he4ke2z9cb.execute-api.us-east-2.amazonaws.com/default/soumikFunction";

// Toggle chat window open/closed
function toggleChat() {
  const frame = document.getElementById("chat-frame");
  if (frame.style.display === "none" || frame.style.display === "") {
    frame.style.display = "flex";
  } else {
    frame.style.display = "none";
  }
}

// Send message to Lambda via API Gateway
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const query = input.value.trim();
  if (!query) return;

  input.value = "";
  appendMessage("user", query);
  appendMessage("assistant", "Thinking...");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: query }),
    });

    const data = await res.json();

    // Replace the "Thinking..." message with the real reply
    const messages = document.querySelectorAll(".msg-assistant");
    messages[messages.length - 1].textContent = data.reply || "Sorry, I could not get a response.";

  } catch (error) {
    const messages = document.querySelectorAll(".msg-assistant");
    messages[messages.length - 1].textContent = "Error connecting to the server.";
    console.error("Error:", error);
  }
}

// Add a message bubble to the chat window
function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg-${role}`;
  div.textContent = text;
  div.style.cssText =
    role === "user"
      ? "align-self:flex-end;background:#0066cc;color:white;padding:8px 12px;border-radius:12px 12px 2px 12px;max-width:80%;font-size:14px;"
      : "align-self:flex-start;background:#f0f0f0;color:#333;padding:8px 12px;border-radius:12px 12px 12px 2px;max-width:80%;font-size:14px;";

  const messagesDiv = document.getElementById("chat-messages");
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // auto scroll to latest message
}

// Allow pressing Enter to send
document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("chat-input");
  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") sendMessage();
    });
  }
});

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});