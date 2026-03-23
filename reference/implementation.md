# Implementation Plan: SurfersDelight Proof of Concept (PoC)

This PoC aims to demonstrate the feasibility of the **"Golden Hour"** agentic workflow. We are building a high-fidelity demo using a React frontend and a Node.js/Express backend, integrated with **Gemini Flash 2.5** as our surf scout: **Rick Kane**.

---

## 1. Project Overview

### Design Aesthetic: "The North Shore Vibe"
*   **Palette:** Sky Blue (`#87CEEB`), Turquoise (`#40E0D0`), and Sun-Drenched Yellow (`#FFD700`).
*   **Typography:** Playful, beachy display fonts (e.g., *Pacifico*) for headers; clean sans-serif (*Inter*) for data.
*   **UI Components:** ShadcnUI customized with rounded corners and glassmorphism to mimic water reflections.

---

## 2. Technical Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | React + Tailwind + ShadcnUI | Rapid prototyping of high-quality, responsive interfaces. |
| **Backend** | Node.js + Express | Lightweight and handles asynchronous API orchestration efficiently. |
| **Database** | Supabase | Supports real-time geolocation triggers and easy multi-device demoing. |
| **AI Agent** | Gemini Flash 2.5 | Fast inference for real-time "Rick Kane" personality-driven analysis. |
| **Auth** | Supabase Auth | Instant social/anonymous login for team testing and user persistence. |

---

## 3. External API Strategy

### A. Marine & Weather Data
*   **API:** Open-Meteo Marine API
*   **Parameters:** `wave_height`, `wave_direction`, `swell_wave_period`, `wind_speed_10m`, `wind_direction_10m`.

### B. Transport & Traffic
*   **API:** Google Maps Routes API
*   **Value:** Provides real-time duration vs. static duration to calculate $L_{friction}$.

### C. Crowd Proxies
*   **API:** BestTime.app API
*   **Value:** Returns foot_traffic percentage for local cafes or trailheads near the beach.

### D. Local POIs (Post-Surf)
*   **API:** Geoapify Places API
*   **Value:** Finds `catering.restaurant` and `commercial.outdoor_and_sport` within 1km of the spot.

---

## 4. Implementation Phases

### Phase 1: The "Rick Kane" Agent Configuration
*   **Identity:** Rick Kane from *North Shore* (1987).
*   **Tone:** "Soul surfer" slang combined with technical savvy.
*   **Logic:** Feed raw JSON from APIs into Gemini to generate the "Golden Hour" summary and itinerary.

### Phase 2: Calibration UI (The Onboarding)
*   Implement a 4-step wizard using ShadcnUI Cards.
*   Store user preferences (top 10 spots, time windows) in Supabase.

### Phase 3: The Scoring Engine
*   Create a backend utility to calculate the $U$ (Utility) score.
*   Fetch Marine and Traffic data, rank spots, and select the Top 3.

### Phase 4: Notification Simulation
*   Create a "Simulate 6:00 AM Notification" button for the demo.
*   Display Stage 1 (The Invitation) and Stage 2 (The Victory Lap) messages.

---

## 5. Success Metrics
*   **Latency:** Does the agent generate a "Rick Kane" response in under 2 seconds?
*   **Accuracy:** Does the Utility Score correctly penalize spots with red-level traffic?
*   **Vibe Check:** Does the UI feel like a premium North Shore experience?

---

## 6. Prompt Engineering: Rick Kane Identity
> **Character:** Rick Kane
> 
> **Tone:** Encouraging, slightly naive, but technically savvy about "shredding."
> 
> **Example:** "Listen up, braddah! You aren't in Arizona anymore. The Pipeline is pumping—9.4 utility score! The waves are overhead and the trades are light. If you leave now, you'll beat the morning jam on the Kam Highway. See you in the green room!"
