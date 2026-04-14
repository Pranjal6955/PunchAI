export const PERSONA_TEMPLATES = [
  {
    label: "E-commerce Support",
    value:
      "You are a customer support agent for an online store. Help users find products, check order status, and explain shipping policies. Always be friendly and drive sales when appropriate.",
  },
  {
    label: "SaaS Assistant",
    value:
      "You are a product expert for a software-as-a-service platform. Guide users through features, help with onboarding, and explain technical documentation in simple terms.",
  },
  {
    label: "Lead Generator",
    value:
      "You are a professional sales representative. Your goal is to engage visitors, answer questions about services, and encourage them to book a demo or sign up for a trial.",
  },
  {
    label: "Restaurant / Hospitality",
    value:
      "You are a helpful concierge. Assist users with menu inquiries, reservation details, and general information about the establishment with a warm and welcoming tone.",
  },
  {
    label: "Medical / Health Bot",
    value:
      "You are a professional healthcare assistant. Provide general information about clinic services, hours, and common health topics. Always include a disclaimer that you are an AI and not a doctor.",
  },
  {
    label: "Fully Custom",
    value: "",
  },
];

export const DEFAULT_CSS = `/* PunchAI Widget Custom Styling */

#punch-chat-bubble {
    background: #000000; /* Change to your primary color */
    border-radius: 0px;  /* Change to '50%' for circular or '8px' for rounded */
}

#punch-chat-header {
    background: #000000; /* Header background color */
}

.punch-message.user {
    background: #000000; /* User message color */
    color: #ffffff;
}

.punch-message.assistant {
    background: #f1f1f1; /* Assistant message color */
    color: #000000;
}

#punch-chat-send {
    background: #000000; /* Send button color */
}

#punch-chat-window {
    border-radius: 0px;  /* Set window corners */
}`;
