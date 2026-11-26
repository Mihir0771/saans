# ADR 002 — Exact Shapley Attribution for Day Replay Waterfall

**Status:** Accepted  
**Context:** Indoor PM2.5 mass balance (`C_ss = (P·λ·C_out + S/V) / (λ + k + a_p)`) and mask/schedule interventions interact nonlinearly. Summing standalone single-action reductions does not equal the combined plan reduction.  
**Decision:** Compute waterfall action savings using exact **Shapley value attribution** over the active candidate actions (`n <= 6`, at most `2^6 = 64` evaluations in pure TypeScript). This makes attribution order-independent and guarantees exact additivity (`sum(delta_i) === typicalDose - planDose`).
