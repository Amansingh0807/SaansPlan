# Model Assumptions & Disclaimers

1. **Guidance, Not Medical Diagnosis**: SaansPlan provides environmental exposure estimates and public-health guidance grounded in WHO (2021), CPCB, and ICMR advisories. It is not a medical device or clinical diagnostic tool.
2. **Cigarette-Equivalent Approximation**: Computed using the Berkeley Earth rule of thumb (~22 µg/m³ 24-hour average $\text{PM}_{2.5}$ ≈ 1 cigarette/day) and explicitly labeled as an educational approximation.
3. **Infiltration Factors ($F_{\text{inf}}$)**: Baseline closed-window ratios range from `0.42` (high-rise apartment) to `0.78` (informal settlement), adjusted for road-facing windows (`×1.12`), door-gap sealing (`×0.84`), and open windows (`+0.36`).
4. **Natural Decay ($k_{\text{decay}}$)**: Modeled at `0.35 h⁻¹` for fine particulate deposition indoors.
5. **Purifier CADR**: Defaults to `220 m³/h` for a DIY Corsi-Rosenthal box, `260 m³/h` for standard HEPA, and `450 m³/h` for high-CADR HEPA.
6. **N95 Filtration Efficiency**: Modeled at `82%` real-world reduction assuming proper nose-clip fit.
