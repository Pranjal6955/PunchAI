# PunchAI Development Roadmap & Optimization Plan

This document outlines the planned features, architectural improvements, and optimizations for the PunchAI platform.

## 🚀 Phase 1: Performance & Technical Debt (UI)
*Priority: Critical*

- [x] **Bundle Size Cleanup**: 
    - Uninstall unused libraries: `@hugeicons` (59MB), `@xyflow/react`, `recharts`, `@dnd-kit`.
    - Optimize `lucide-react` imports to ensure tree-shaking.
    - Result: Reduce `.next` folder from 514MB to <100MB.
- [x] **Auth Experience Refactor**:
    - Replace `null` return in `DashboardLayout` during auth checks with Page Skeletons.
    - Ensure Sidebar and Header are visible immediately while session loads.
- [x] **Data Caching Layer**:
    - Implement `SWR` or `TanStack Query` for global state (User Profile, Bot List).
    - Eliminate redundant network waterfalls on page transitions.
- [x] **Asset Optimization**:
    - Convert and optimize all PNG assets (like `Logo_dark_theme.png`) to WebP/SVG.

## 🧠 Phase 2: Advanced RAG Capabilities (Backend)
*Priority: High*

- [x] **Extended Format Support**:
    - Implement parsers for Excel (`.xlsx`), Word (`.docx`), and PowerPoint (`.pptx`).
    - Integrate `unstructured` library for more robust document chunking.
- [x] **Hybrid Search V2**:
    - Explore **GraphRAG** (Knowledge Graphs) alongside vector search for relationship-heavy queries.
    - Implement **Query Expansion** to improve retrieval relevance for short queries.
- [x] **Automated Evaluation**:
    - Integrate **RAGAS** for automated testing of Faithfulness, Relevancy, and Accuracy.
    - Create a `test_rag.py` suite that runs on every CI/CD pipeline.

## 🎨 Phase 3: Enhanced User & Admin Tools
*Priority: Medium*

- [x] **Pro Playground**:
    - Add a "Retrieved Context" panel showing raw chunks, scores, and source names.
    - Add a toggle to switch between LLM models (e.g., GPT-4o vs Groq Llama 3) for side-by-side comparison.
- [x] **Widget Customizer**:
    - Build a "Theme Settings" UI to control widget colors, fonts, and brand logo.
    - Allow customization of the initial "Welcome Message" and suggestion chips.
- [x] **Human-in-the-Loop (HITL)**:
    - Add Thumbs Up/Down feedback for all AI responses.
    - Create an admin view to review negative feedback and override the knowledge base for specific queries.

## 📊 Phase 4: Analytics & Insights
*Priority: Low/Medium*

- [ ] **Sentiment Heatmaps**: 
    - Visualize conversation sentiment trends over time on the Chat Logs page.
- [ ] **Knowledge Gap Analysis**:
    - Dashboard to track queries that returned "No Information Found" or had low similarity scores.
- [ ] **Token Usage Monitoring**:
    - Track cost and token consumption per bot/user to prepare for potential monetization.

## 🔒 Phase 5: Production Hardening
*Priority: Low*

- [ ] **Tiered Rate Limiting**: Implement specialized limits based on API Keys (Free vs Enterprise).
- [ ] **Health Monitoring**: Integrated Prometheus/Grafana dashboard for real-time latency and error tracking.
