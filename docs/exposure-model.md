# SaansPlan Exposure & Indoor Mass-Balance Model

## 1. Personal Exposure Score

City-level AQI is a single ambient number, whereas actual health burden depends on **where** a person is, **what** they are doing (breathing rate), **how long** they stay there, and **who** they are (physiological sensitivity).

For each household member $i$, SaansPlan computes a deterministic 24-hour exposure score:

$$\text{Exposure}_i = \sum_{t \in \text{slots}} C_{\text{place}}(t) \times \Delta t \times \text{BR}(\text{activity}, \text{age}) \times S(\text{member})$$

Where:
- $C_{\text{place}}(t)$ is effective $\text{PM}_{2.5}$ ($\mu\text{g/m}^3$) in the microenvironment:
  - **Indoors (Home)**: $C_{\text{in}} = C_{\text{out}}(t) \cdot F_{\text{inf}} \cdot \frac{k_{\text{decay}}}{k_{\text{decay}} + \text{CADR}/V} + S_{\text{cook}} \cdot \frac{k_{\text{decay}}}{k_{\text{decay}} + \text{CADR}/V}$
  - **Indoors (School/Office)**: $C_{\text{out}}(t) \times 0.56$
  - **Commute / Outdoors**: $C_{\text{out}}(t) \times F_{\text{mode}} \times (1 - \eta_{\text{N95}})$
- $\text{BR}(\text{activity}, \text{age})$ is the activity- and age-adjusted breathing rate ($\text{m}^3/\text{h}$).
- $S(\text{member})$ is the sensitivity multiplier (`1.0` standard, `1.25` pregnant, `1.30` elderly 60+, `1.35` child <12, `1.55` asthma/respiratory).

## 2. Indoor Single-Zone Mass-Balance Simulator

The interactive What-If Simulator integrates the differential equation in 15-minute steps ($\Delta t = 0.25\text{ h}$) over 24 hours:

$$\frac{dC_{\text{in}}}{dt} = k_{\text{inf}} \cdot C_{\text{out}}(t) - \left(k_{\text{decay}} + \frac{\text{CADR}}{V}\right) C_{\text{in}}(t) + \frac{S_{\text{cook}}(t)}{V}$$

All math runs deterministically in `lib/exposure-engine/` with zero LLM involvement.
