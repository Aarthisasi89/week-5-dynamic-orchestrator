const API_URL = "https://vibe-proxy-gqv4.onrender.com/v1/chat/completions";
const API_KEY = "sk-vibe-summer-2026";

const agents = {
  math: {
    displayName: "Math Teacher",
    description: "Explain math problems with step-by-step calculations and friendly number examples.",
    outputId: "math-output",
    toggleId: "math-toggle",
    colorClass: "math",
    personality: "You are a cheerful math teacher who uses numbers, clear steps, and fun examples to explain solutions."
  },
  science: {
    displayName: "Science Teacher",
    description: "Describe scientific concepts using real-world examples and easy explanations.",
    outputId: "science-output",
    toggleId: "science-toggle",
    colorClass: "science",
    personality: "You are a curious science teacher who connects ideas to everyday experiments and examples."
  },
  history: {
    displayName: "History Teacher",
    description: "Share historical facts with dates, people, and places to help students remember events.",
    outputId: "history-output",
    toggleId: "history-toggle",
    colorClass: "history",
    personality: "You are a story-driven history teacher who uses dates, people, and places to bring history alive."
  }
};

const state = {
  math: false,
  science: false,
  history: false
};

const activeAgentsDisplay = document.getElementById("active-agents");
const traceLog = document.getElementById("trace-log");
const runButton = document.getElementById("run-btn");
const userPrompt = document.getElementById("user-prompt");

function init() {
  Object.keys(agents).forEach((key) => {
    const toggle = document.getElementById(agents[key].toggleId);
    toggle.addEventListener("click", () => toggleAgent(key));
    setAgentToggleButton(key);
    setOutput(key, `${agents[key].displayName} is ready when you turn them on.`);
  });
  runButton.addEventListener("click", runAgents);
  updateActiveAgentList();
  addTrace("Welcome! Select your agents and ask a question.", "info");
}

function toggleAgent(agentKey) {
  state[agentKey] = !state[agentKey];
  setAgentToggleButton(agentKey);
  updateActiveAgentList();
  addTrace(
    `${agents[agentKey].displayName} turned ${state[agentKey] ? "ON" : "OFF"}.`,
    state[agentKey] ? "success" : "warning"
  );
}

function setAgentToggleButton(agentKey) {
  const toggle = document.getElementById(agents[agentKey].toggleId);
  if (state[agentKey]) {
    toggle.classList.add("active");
    toggle.textContent = "ON";
  } else {
    toggle.classList.remove("active");
    toggle.textContent = "OFF";
  }
}

function updateActiveAgentList() {
  const active = Object.keys(state).filter((key) => state[key]);
  if (active.length === 0) {
    activeAgentsDisplay.textContent = "None";
  } else {
    activeAgentsDisplay.textContent = active
      .map((key) => agents[key].displayName)
      .join(" • ");
  }
}

function addTrace(message, type = "info") {
  const entry = document.createElement("div");
  entry.className = `trace-entry ${type}`;
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  entry.innerHTML = `<strong>${timestamp}</strong> — ${message}`;
  traceLog.prepend(entry);
}

function setOutput(agentKey, message) {
  const output = document.getElementById(agents[agentKey].outputId);
  output.textContent = message;
}

function buildPrompt(agentKey, question) {
  return `${agents[agentKey].personality}\n\nStudent question: "${question}"\n\nAnswer the question clearly and kindly.`;
}

async function callAgent(agentKey, question) {
  const prompt = buildPrompt(agentKey, question);
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "class-chat-model",
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API Error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No answer returned from the teacher agent.");
  }
  return content.trim();
}

async function runAgents() {
  const question = userPrompt.value.trim();
  const activeAgentKeys = Object.keys(state).filter((key) => state[key]);

  if (!question) {
    addTrace("Please type a question before running agents.", "error");
    return;
  }

  if (activeAgentKeys.length === 0) {
    addTrace("Turn on at least one agent to run the tutor.", "error");
    return;
  }

  addTrace("Starting the selected agents...", "info");
  activeAgentKeys.forEach((agentKey, index) => {
    setOutput(agentKey, "Waiting to respond...\nPlease hold on while we ask the teacher.");
  });

  for (const agentKey of activeAgentKeys) {
    const agentName = agents[agentKey].displayName;
    addTrace(`${agentName} is running.`, "info");
    setOutput(agentKey, `Asking ${agentName}...`);

    try {
      const answer = await callAgent(agentKey, question);
      setOutput(agentKey, answer);
      addTrace(`${agentName} finished answering.`, "success");
    } catch (error) {
      const errorMessage = error?.message || "An unexpected error occurred.";
      setOutput(agentKey, `Error: ${errorMessage}`);
      addTrace(`${agentName} failed: ${errorMessage}`, "error");
    }
  }

  addTrace("All active agents have finished their responses.", "success");
}

init();
