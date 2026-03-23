# SurfersDelight: Your Personal AI Surf Scout

The evolution of surf forecasting has moved beyond raw wave data toward a holistic **"Golden Hour"** utility model. SurfersDelight represents a technical shift from static reporting to an agentic system that synchronizes environmental conditions with human logistics.

By ingesting high-resolution marine models, behavioral proxies, and infrastructure-level transport data, the SurfersDelight agent identifies windows of peak wave quality and minimal logistical friction. The system incorporates a "House-to-Sea" experience, monitoring everything from the initial drive to the post-surf meal.

---

## 1. Onboarding: Calibration Phase
When a user first launches the app, they enter a guided onboarding flow to calibrate the AI engine:

*   **Spot Ranking:** Users rank their top 10 preferred surf spots (e.g., Banzai Pipeline, Waimea Bay). These coordinates serve as primary monitoring targets.
*   **Temporal Availability:** Define specific weekly windows (e.g., Wednesday 1:00 PM – 5:00 PM). The agent performs proactive scheduled checks:
    *   **Afternoon Sessions (Post-12:00 PM):** Final scan and "Go/No-Go" notification at **6:00 AM** that same morning.
    *   **Morning Sessions (Pre-12:00 PM):** Final verification and notification at **6:00 PM** the evening prior.
*   **Condition Thresholds:** Set ideal ranges for wave height, wind state (Glassy or Offshore), and weather tolerances.
*   **Friction Sensitivity ($S_{f}$):** A 1–10 scale defining the user's "Pain Threshold" for logistical delays.
*   **Auto-Monitoring Toggle:** Enable background monitoring for 1 to 10-day look-ahead windows.

---

## 2. The Agentic Monitoring Loop
Once calibrated, the agent runs asynchronous tasks to synthesize data:

1.  **Marine Scan:** Fetches swell height, period, and direction from Open-Meteo or PacIOOS.
2.  **Wind Analysis:** Calculates the offshore vector. Ideal conditions are "Glassy" ($<5$ mph) or "Offshore."
3.  **Safety Verification:** Scrapes Hawaii DOH Clean Water Branch for advisories and NWS for High Surf Warnings.
4.  **Logistics Assessment:** Queries Google Maps Routes for travel times and BestTime.app for crowd proxies.

---

## 3. The Technical Utility Formula
The SurfersDelight agent calculates maximum utility ($U$) by balancing surf quality against the "cost" of reaching the break.

### The Formula
$$U = \frac{Q_{score}}{L_{friction} \times S_{f}}$$

### Variables Defined
| Variable | Name | Description |
| :--- | :--- | :--- |
| $U$ | **Utility Score** | The final 1–10 ranking of the session. A high $U$ indicates a "Golden Hour." |
| $Q_{score}$ | **Quality Score** | A composite value (1–10) based on swell and wind alignment. |
| $L_{friction}$ | **Logistics Friction** | The sum of transport (80% weight) and crowd density (20% weight). |
| $S_{f}$ | **Friction Sensitivity** | User's multiplier (1-10). Low = sensitive to traffic; High = willing to drive through anything. |

> **Logic Note:** A 10/10 $Q_{score}$ is penalized if winds are "Onshore" (sea to land). If wave quality is high but a road accident doubles travel time ($L_{friction}$), the Utility Score drops.

---

## 4. The "Golden Hour" Discovery
When a window matches availability, the agent calculates scores for all 10 saved spots and highlights the top three.

### Sample Notification (Stage 1: Pre-Surf)
> "Hey! Your **'Golden Window'** is Thursday at 7:30 AM. Here are your top 3 matches:
> 
> *   **Banzai Pipeline (Score: 9.4):** 5ft @ 14s. Clear roads (15 min) and 70% quieter than usual.
> *   **Sunset Beach (Score: 8.8):** 6ft @ 15s. Light offshore winds.
> *   **Laniakea (Score: 7.2):** Solid swell, but expect a 25 min drive.
> 
> Tap to see scores for your other 7 spots. Enjoy the peace!"

---

## 5. Post-Surf Itinerary: The "End-to-End" Experience
Triggered via geofencing once the user leaves the beach coordinates, the agent suggests local spots to refuel or rest.

### Sample Notification (Stage 2: Post-Surf)
> **Victory Lap!** You conquered the swell—now treat yourself.
> 
> *   **Refuel at Ted's Bakery (0.3km):** Indulge in their world-famous, velvety Chocolate Haupia Cream Pie. The line is short!
> *   **Gear up at Surf N Sea Haleiwa:** Snapped a leash? Swing by the North Shore's most iconic shop. Open until 6:00 PM.
> *   **Unwind at Waimea Valley Trail:** Keep the stoke alive with a peaceful wander to the waterfall.

---

## Conclusion
By automating the "app-hopping" ritual and integrating local POI data, SurfersDelight provides a seamless experience from the user's home to the lineup and back.

**Works Cited:**
*   Surf Forecast for the State of Hawaii - [Weather.gov](https://www.weather.gov/hfo/SRF)
*   Ongoing water quality advisories - [CWB System](https://eha-cloud.doh.hawaii.gov/cwb/#!/landing)
