/**
 * Medicine Conflict Checker Service
 * MVP version using a static dataset
 */

const medicineInteractions = {
  "Paracetamol + Alcohol": "Possible liver overload",
  "Warfarin + Aspirin": "Increased risk of bleeding",
  "Sildenafil + Nitrates": "Severe drop in blood pressure",
  "Metformin + Contrast Dye": "Risk of lactic acidosis",
  "Simvastatin + Amiodarone": "Increased risk of muscle damage (myopathy)",
};

export const checkMedicineConflicts = async (prescriptions) => {
  try {
    const conflicts = [];
    const meds = prescriptions.split(",").map(m => m.trim().toLowerCase());

    for (let i = 0; i < meds.length; i++) {
      for (let j = i + 1; j < meds.length; j++) {
        const pair = [meds[i], meds[j]].sort().join(" + ");
        
        // Check for exact match or partial match in our static dataset
        for (const [interaction, warning] of Object.entries(medicineInteractions)) {
          const interactionMeds = interaction.toLowerCase().split(" + ");
          if (
            (interactionMeds[0].includes(meds[i]) && interactionMeds[1].includes(meds[j])) ||
            (interactionMeds[0].includes(meds[j]) && interactionMeds[1].includes(meds[i]))
          ) {
            conflicts.push(`${interaction}: ${warning}`);
          }
        }
      }
    }

    return conflicts;
  } catch (error) {
    console.error("Medicine Conflict Error:", error);
    return [];
  }
};
