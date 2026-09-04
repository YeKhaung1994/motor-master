# Honda 2026 Motorcycle Specification Dataset — Executive Summary

## TL;DR
- I compiled a 2026-model-year (plus early 2027) Honda specification dataset spanning Global/Europe, USA, Japan, Thailand and India, covering ~70 model/variant entries. The headline 2026 news: E-Clutch expands to the CB750 Hornet, CB500 Hornet, CBR500R, NX500 and XL750 Transalp; two all-new retro-styled big fours (CB1000GT sport-tourer and CB1000F roadster) arrive off the CB1000 Hornet platform; and Honda launches its first full-size electric motorcycle, the WN7.
- Flagship figures: CBR1000RR-R Fireblade SP 160 kW (≈215–218 hp) @ 14,000–14,500 rpm; CB1000 Hornet SP ~114 kW (155 hp); CB1000GT 110.1 kW (147.6 hp) @ 11,000 rpm / 102 Nm; Africa Twin 75 kW (101 hp) / 112 Nm; WN7 50 kW peak / 9.3 kWh battery / up to 140 km WMTC.
- Thai-market commuters (Wave 110i/125i, Click 125i/160, Scoopy, Giorno+, PCX160, ADV350/160, CBR250RR, CB150R Streetster, Monkey, Grom, CT125) are included with Thai baht MSRPs where officially published.

## Key Findings (verified via enrichment)
- **US pricing cuts:** Per American Honda's Jan 7, 2026 release, MSRP reductions include **$1,000 on the CB500 Hornet and CBR500R, $700 on the CB650R E-Clutch and CBR650R E-Clutch, and $650 on the CB300R**; the CB750 Hornet gained E-Clutch while held at $7,999.
- **15 on-road models for 2026, four E-Clutch-equipped** (CB650R, CBR650R, CB750 Hornet, plus the Rebel 300 E-Clutch cruiser).
- **Africa Twin:** mechanically unchanged for 2026 (75 kW / 112 Nm); **globally ~half of Africa Twin customers choose DCT (just over 40% in the U.S.)**.
- **CBR1000RR-R Fireblade SP:** 160 kW at 14,000 rpm; US MSRP **$28,999**.
- **CB1000GT:** kerb weight **229 kg**, 21-litre tank, 147.6 hp (110.1 kW) @ 11,000 rpm, 102 Nm @ 8,750 rpm, Showa-EERA electronic suspension; Europe/Japan-first (US TBC).
- **WN7 (first full-size EV from any of the four major Japanese makers):** 9.3 kWh battery, 50 kW peak / 100 Nm, 217 kg kerb, up to 140 km WMTC; CCS2 20–80% in 30 minutes (adds ~89 km). ~USD 17,400 equivalent.
- **Gold Wing:** 1833cc flat-six, 125 hp @ 5,500 rpm / 170 Nm @ 4,500 rpm, 7-speed DCT; US from $26,500 (Automatic DCT), $30,500 (Tour DCT), $33,800 (Tour Airbag DCT); UK GL1800 Tour £32,999.
- **XL750 Transalp:** optional E-Clutch for 2026, 67.5 kW @ 9,500 rpm / 75 Nm @ 7,250 rpm; 210 kg (216 kg E-Clutch); UK £9,999.
- **Montesa (Honda-owned trials):** Cota 4RT 301RR (298 cc) US $12,949; Cota 4RT 260R (259 cc) US $9,849; 4Ride revamped for Euro5+ (83 kg dry). The 301RR Race Replica was dropped for 2026.

## Coverage by market/category
- **Europe/Global (honda.co.uk):** most complete — Super Sport (4), Sport Touring (1: CB1000GT), Touring (3), Adventure (8), Street (10), 125cc (6), Scooter (11 incl. 3 electric), Off-Road & Trial (13 incl. 3 Montesa).
- **USA (powersports.honda.com):** supersport, naked, adventure, touring, cruiser (Rebel 300/500/1100 + T/DCT/SE), motocross (CRF450R/RWE, CRF250R/RWE, CRF150R), miniMOTO, scooter (PCX, ADV160), Montesa.
- **Thailand:** Wave 110i/125i, Click 125i/160, Scoopy, Giorno+, PCX160, ADV350, ADV160, CBR250RR, CBR150R, CB150R Streetster, Monkey, Grom, CT125, plus shared big-bikes.
- **India (honda2wheelersindia.com):** SP125, Shine 125, Unicorn/SP160, Hornet 2.0, CB350 family, NX200/NX500, plus CB1000 Hornet SP (₹13,29,390 ex-showroom).
- **Japan:** adds CB400SF relaunch (399cc inline-four, 41 kW/56 PS) and domestic scooter/commuter variants.

## Categories represented
Supersport, naked/standard, sport-touring, touring, cruiser/bobber, scrambler, adventure, dual-sport, motocross, enduro, trials, scooter, miniMOTO, commuter/underbone, and electric (WN7, CUV e:, EM1 e:).

## Data captured per model
Model name/variant, model year, markets, category, engine type/configuration, displacement, bore×stroke, compression, max power (kW+hp @rpm), max torque (Nm @rpm), fuel system, transmission/clutch (manual/DCT/E-Clutch), final drive, frame, front/rear suspension+travel, brakes+ABS, tyres, wheelbase, seat height, ground clearance, kerb weight, fuel capacity, WMTC/economy, EV battery/range/charging, MSRP (with currency/market), and a per-model source URL. `null` used for unpublished figures.

## Conflicts / could-not-verify (flagged)
- **CBR1000RR-R power/rpm:** Honda official cites 160 kW @ 14,000 rpm; some secondary sources state 217.6 hp @ 14,500 rpm and torque 113 Nm @ 12,500 rpm — treat torque as secondary-sourced.
- **WN7 output:** quoted as 18 kW continuous vs 50 kW peak (both Honda claims for different measures); range 130–140 km depending on cycle.
- **Thai power/torque:** ZigWheels Thailand rarely publishes kW/hp/Nm; figures for Click 160, Scoopy, ADV160, CBR150R, CB150R, Monkey and Grom are engine-family values pending Thai spec-sheet confirmation.
- **Thai price conflicts resolved to official launch figures:** Click 160 ฿69,900 (not ฿63,500/67,900); Giorno+ ฿63,700/68,700 (vs ฿61,900/66,900); CT125 ฿88,900 (vs ฿84,900); ADV350 ฿181,900/183,900 (aggregator ฿218,700 rejected as unreliable); Monkey ~฿106,400 (aggregator ฿131,700 rejected).
- **CBR150R Thai MSRP** genuinely unpublished (left null).
- **Bore/stroke, compression, seat height, kerb weight** for the 2026-relaunched Wave110/125i, Click125i, Giorno+ and ADV160 not itemized on accessible Thai pages (null or flagged as shared-engine).
- **CB1000GT / CB1000F** confirmed Europe/Japan; US availability/MSRP still to be confirmed.

## Recommendations
1. **Immediate:** Use the dataset as-is for Europe/US/Montesa entries (sourced from honda.co.uk, powersports.honda.com and hondanews spec sheets — high confidence).
2. **Before production use:** Verify Thai commuter hard specs (bore/stroke, compression, seat height, kerb weight) against official thaihonda.co.th per-model spec PDFs, which were bot-blocked during research.
3. **Watch list:** Confirm US launch/MSRP for CB1000GT and CB1000F; monitor 2027 previews (CB1000 Hornet, CB1000F, Monkey 125, CRF450R/250R Works Editions).
4. **Thresholds to revise figures:** replace any engine-family Thai power/torque value the moment a Thai-specific Honda spec sheet publishes it; supersede any secondary-sourced flagship figure (CBR1000RR-R torque) with the official Honda EU/US sheet when accessible.

*Note: The full ~70-entry machine-readable JSON dataset (top-level object with `brand`, `generated_date`, `scope`, `units`, and a `models` array, one object per model/variant with a per-model `source` URL) was assembled and enriched but could not be transmitted in this final message due to an output-length limit on the delivery step. This executive summary reflects its verified contents, coverage counts, and all flagged conflicts.*